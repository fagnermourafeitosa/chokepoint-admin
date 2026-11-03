import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
import { mcpKey } from './api';
import { mappingApi, mappingError, mappingKey, type MappingView } from './mapping-api';
import { readResource, resourceAgentsKey, resourceApi, serverResourcesKey, writeResource, type ResourceMap, type ToolMappingEntry } from './resource-api';

// The Resource block writes into the local mapping draft and uses the COAZ
// mapping lifecycle (Admin 009, Backend 008). It shares the mapping cache with
// Configure mapping, so both show the same draft.
// The collapsed line comes from the server read (Admin 034, Backend 042); the
// tool mapping, with the server revision that a write needs, is read only while
// the block is open. The editor uses that fresh view.
export function useResourceMapping(scope: EnvironmentScope, serverId: string, toolName: string, entry: ToolMappingEntry, open: boolean) {
  const client = useQueryClient();
  const key = mappingKey(scope, serverId, toolName);
  const query = useQuery({ queryKey: key, queryFn: ({ signal }) => mappingApi.get(scope, serverId, toolName, signal), enabled: open });
  const view = open ? query.data : undefined;
  const line = { source: entry.source, active: readResource(entry.effective), draft: entry.draft ? readResource(entry.draft) : undefined };
  const active = view ? readResource(view.effective) : line.active;
  const draft = view ? (view.draft ? readResource(view.draft.document) : undefined) : line.draft;
  const agents = useQuery({
    queryKey: resourceAgentsKey(scope, serverId, active.resource?.type ?? ''),
    queryFn: ({ signal }) => resourceApi.agents(scope, serverId, active.resource!.type, signal),
    enabled: open && !!active.resource,
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); }, []);
  async function run(work: (view: MappingView, signal: AbortSignal) => Promise<MappingView>, done: string) {
    if (request.current || !view) return false;
    const controller = new AbortController(); request.current = controller; setPending(true); setError(''); setNotice('');
    try {
      const next = await work(view, controller.signal);
      if (controller.signal.aborted) return false;
      client.setQueryData(key, next);
      // The mapping revision belongs to the server: the other tools of the server need a fresh revision.
      void client.invalidateQueries({ queryKey: key.slice(0, 5), predicate: q => q.queryKey[5] !== toolName });
      // The server details refetch gives a new server revision, which reloads the Resource lines (Admin 034).
      void client.invalidateQueries({ queryKey: mcpKey(scope) });
      void client.invalidateQueries({ queryKey: ['mcp-detail', scope.userId, scope.tenantId, scope.environmentId, serverId] });
      setConflict(false); setNotice(done);
      return true;
    } catch (e) {
      if (!controller.signal.aborted) { setError(mappingError(e)); setConflict(e instanceof HttpError && e.status === 409); }
      return false;
    } finally { if (!controller.signal.aborted) setPending(false); request.current = null; }
  }
  const save = (resource?: ResourceMap) => run((v, signal) => mappingApi.save(scope, serverId, toolName, v.server_revision, writeResource(v.draft?.document ?? v.effective, resource), signal), 'Draft saved. It has no effect until it is approved.');
  const approve = () => run((v, signal) => mappingApi.change(scope, serverId, toolName, v.server_revision, 'approve', signal), 'Approved. New calls use this mapping.');
  const discard = () => run((v, signal) => mappingApi.change(scope, serverId, toolName, v.server_revision, 'discard', signal), 'Draft discarded. The active mapping is unchanged.');
  const reload = async () => { setError(''); setConflict(false); void client.invalidateQueries({ queryKey: serverResourcesKey(scope, serverId) }); await query.refetch(); };
  return { query, view, line, active, draft, agents: agents.data?.items ?? [], agentsError: agents.isError, error, notice, conflict, pending, save, approve, discard, reload };
}
