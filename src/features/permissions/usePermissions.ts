import { usePendingChanges } from "../auth/pending/PendingChanges";
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '../../api/http-client';
import type { AgentScope } from '../access/agent-api';
import { mcpApi } from '../mcp/api';
import { identityApi } from '../identity/api';
import { sourceApi } from '../sources/api';
import { emptyDocument, permissionApi, permissionKey, type Configuration, type PermissionDocument } from './api';

// Exhaust each scoped catalog rather than silently omitting records after page one.
async function pages<T>(load: (offset: number) => Promise<{ items: T[]; next_offset: number | null }>) {
  const result: T[] = []; let offset = 0;
  for (;;) { const page = await load(offset); result.push(...page.items); if (page.next_offset === null) return result; if (page.next_offset <= offset) throw new Error('Invalid catalog pagination'); offset = page.next_offset; }
}

export function usePermissions(scope: AgentScope, agentId: string) {
  const cache = useQueryClient();
  const query = useQuery({ queryKey: permissionKey(scope, agentId), queryFn: ({ signal }) => permissionApi.get(scope, agentId, signal), retry: false });
  const catalogs = useQuery({ queryKey: ['permission-catalogs', scope.userId, scope.tenantId, scope.environmentId], queryFn: async ({ signal }) => {
    const [servers, identities, sources] = await Promise.all([pages(offset => mcpApi.list(scope, offset, signal)), pages(offset => identityApi.list(scope, offset, signal)), sourceApi.list(scope, signal)]);
    return { servers, identities, sources: sources.items };
  }, retry: false });
  const [edited, setEdited] = useState<{ revision: number; document: PermissionDocument }>();
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const configuration = query.data;
  const document = edited?.document ?? configuration?.draft ?? configuration?.published ?? emptyDocument();
  usePendingChanges(edited !== undefined || busy);
  const conflict = edited !== undefined && configuration !== undefined && edited.revision !== configuration.revision;
  function edit(next: PermissionDocument) { setEdited({ revision: edited?.revision ?? configuration?.revision ?? 0, document: next }); setError(''); }
  async function change(action: 'draft' | 'publish' | 'discard' | 'revoke') {
    if (!configuration || controller.current || conflict) return false;
    const current = new AbortController(); controller.current = current; setBusy(true); setError('');
    try {
      const saved = await permissionApi.change(scope, agentId, action, edited?.revision ?? configuration.revision, action === 'draft' ? document : undefined, current.signal);
      if (current.signal.aborted) return false;
      cache.setQueryData<Configuration>(permissionKey(scope, agentId), saved); setEdited(undefined); return true;
    } catch (cause) {
      if (!current.signal.aborted) setError(cause instanceof HttpError && cause.status === 409 ? 'Permissions changed. Reload and review before retrying.' : cause instanceof HttpError && cause.status === 400 ? 'Check user identities, enabled server/tools, boolean CEL expressions and approved source bindings.' : 'Could not save permissions. Your edits are retained.');
      return false;
    } finally { if (!current.signal.aborted) { controller.current = null; setBusy(false); } }
  }
  async function reload() { setEdited(undefined); setError(''); await query.refetch(); }
  return { query, catalogs, configuration, document, edit, dirty: edited !== undefined, busy, error, conflict, change, reload };
}
export type PermissionActions = ReturnType<typeof usePermissions>;
