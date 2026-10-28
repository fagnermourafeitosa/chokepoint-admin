import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EnvironmentScope } from '../access/environment-scope';
import { identityApi, identityError, identityKey } from './api';
import type { IdentityConnection, IdentityFields } from './api';
export function useIdentityConnections(scope: EnvironmentScope) {
 const client = useQueryClient();
 const query = useInfiniteQuery({ queryKey: identityKey(scope), initialPageParam: 0, queryFn: ({ pageParam, signal }) => identityApi.list(scope, pageParam, signal), getNextPageParam: last => last.next_offset ?? undefined, retry: false });
 const providerQuery = useQuery({ queryKey: [...identityKey(scope), 'providers'], queryFn: ({ signal }) => identityApi.providers(scope, signal), retry: false });
 const [editor, setEditor] = useState<IdentityConnection | 'new' | null>(null);
 const [deleting, setDeleting] = useState<IdentityConnection | null>(null);
 const [pending, setPending] = useState(false);
 const [error, setError] = useState('');
 const [notice, setNotice] = useState('');
 const controller = useRef<AbortController | null>(null);
 useEffect(() => () => controller.current?.abort(), []);
 const refresh = () => client.invalidateQueries({ queryKey: identityKey(scope) });
 async function run<T>(operation: (signal: AbortSignal) => Promise<T>): Promise<T | undefined> {
  if (controller.current) return;
  const request = new AbortController(); controller.current = request; setPending(true); setError(''); setNotice('');
  try { const result = await operation(request.signal); if (!request.signal.aborted) return result; }
  catch (reason) { if (!request.signal.aborted) { setError(identityError(reason)); void refresh(); } }
  finally { if (!request.signal.aborted) { controller.current = null; setPending(false); } }
 }
 async function save(id: string | undefined, fields: IdentityFields) {
  const saved = await run(signal => identityApi.save(scope, id, fields, signal));
  if (saved) { setEditor(null); setNotice('Identity connection saved.'); await refresh(); }
 }
 async function toggle(connection: IdentityConnection) { await save(connection.id, { provider: connection.provider, name: connection.name, issuer: connection.issuer, audiences: connection.audiences, groups_claim: connection.groups_claim, directory: connection.directory, revision: connection.revision, enabled: !connection.enabled }); }
 async function check(connection: IdentityConnection) {
  const checked = await run(signal => identityApi.check(scope, connection.id, connection, signal));
  if (checked) { setNotice(checked.check_status === 'verified' ? 'Issuer metadata and public keys verified.' : 'Configuration check failed. Check the issuer and network access.'); await refresh(); }
 }
 async function remove() {
  if (!deleting) return;
  const target = deleting;
  const removed = await run(async signal => { await identityApi.remove(scope, target, signal); return true; });
  if (removed) { setDeleting(null); setNotice('Identity connection deleted.'); await refresh(); }
 }
 return { ...query, providerQuery, connections: query.data?.pages.flatMap(page => page.items) ?? [], editor, setEditor, deleting, setDeleting, pending, error, notice, save, toggle, check, remove, run };
}
