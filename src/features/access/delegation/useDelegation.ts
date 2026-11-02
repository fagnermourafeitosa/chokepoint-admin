import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '../../../api/http-client';
import { usePendingChanges } from '../../auth/pending/PendingChanges';
import type { AgentScope } from '../agent-api';
import { delegationKey, emptyDocument, permissionApi, type Configuration } from './api';
import { countChanges, fromDocument, toDocument, type Catalog, type Doc } from './model';

function failure(cause: unknown) {
  if (cause instanceof HttpError && cause.status === 409) return 'The agent changed in another session. Reload to see the latest draft; your unsaved edits are lost.';
  if (cause instanceof HttpError && cause.status === 400) return 'Check the selected subjects, the reviewed tools, the resource types, the rules and their bindings. Your edits are kept.';
  return 'Could not save. Your edits are kept; retry when the service is available.';
}

// The agent configuration of Backend 033. Edits stay in the browser until Review & publish
// saves the draft and publishes it (Admin 026 Resolved Decision 4).
export function useDelegation(scope: AgentScope, agentId: string, catalog: Catalog) {
  const cache = useQueryClient();
  const key = delegationKey(scope, agentId);
  // While a publication is pending, read again until OpenFGA confirms it (Backend 033 reconciler).
  const query = useQuery({ queryKey: key, queryFn: ({ signal }) => permissionApi.get(scope, agentId, signal), retry: false, refetchInterval: q => (q.state.data?.reconciliation.state === 'pending' ? 5000 : false) });
  const [edited, setEdited] = useState<{ revision: number; doc: Doc }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  usePendingChanges(edited !== undefined || busy);
  const config = query.data;
  const saved = config?.draft ?? config?.published ?? emptyDocument();
  const draft = edited?.doc ?? fromDocument(saved, catalog);
  const published = fromDocument(config?.published ?? emptyDocument(), catalog);
  const changes = config ? countChanges(toDocument(draft), config.published ?? emptyDocument()) : 0;

  function edit(next: Doc) { setEdited({ revision: edited?.revision ?? config?.revision ?? 0, doc: next }); setError(''); }
  async function run(work: (signal: AbortSignal) => Promise<Configuration>) {
    if (!config || controller.current) return false;
    const current = new AbortController(); controller.current = current; setBusy(true); setError('');
    try {
      const next = await work(current.signal);
      if (current.signal.aborted) return false;
      cache.setQueryData<Configuration>(key, next); setEdited(undefined); return true;
    } catch (cause) {
      if (!current.signal.aborted) { setError(failure(cause)); setConflict(cause instanceof HttpError && cause.status === 409); }
      return false;
    } finally { if (!current.signal.aborted) { controller.current = null; setBusy(false); } }
  }
  // Saves the edits as the draft, then publishes it. A saved draft without edits is published as it is.
  const publish = () => run(async signal => {
    let revision = edited?.revision ?? config!.revision;
    if (edited) revision = (await permissionApi.change(scope, agentId, 'draft', revision, toDocument(edited.doc), signal)).revision;
    return permissionApi.change(scope, agentId, 'publish', revision, undefined, signal);
  });
  const discard = () => (config?.draft ? run(signal => permissionApi.change(scope, agentId, 'discard', config.revision, undefined, signal)) : (setEdited(undefined), Promise.resolve(true)));
  const reload = async () => { setEdited(undefined); setError(''); setConflict(false); await query.refetch(); };
  return { query, config, draft, published, changes, edit, busy, error, conflict, publish, discard, reload };
}
export type DelegationState = ReturnType<typeof useDelegation>;
