import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UserRound } from 'lucide-react';
import { SelectMenu } from '../../components/ui/dropdown/SelectMenu';
import { ConfirmDialog } from '../../components/ui/dialog/ConfirmDialog';
import { TracePager } from '../investigate/TraceUI';
import type { EnvironmentScope } from '../access/environment-scope';
import { identityApi, identityError, identityKey } from './api';
import type { ConnectionPerson, IdentityConnection, PersonStatus } from './api';
import { Help } from './Help';
import '../mcp/mcp.css';
import '../investigate/investigate.css';
import './identity.css';

// People of a Generic OIDC connection (Admin 065 Solution 3, Backend 106 Protocol contract 7). A person
// appears after the first harness login or token exchange. Approval and its revocation are for the whole
// connection; blocking one agent stays in that agent, under Harness sessions (Admin 036).
const label: Record<PersonStatus, string> = { pending: 'Pending approval', approved: 'Approved', revoked: 'Approval revoked', seen: 'Seen' };
const tone: Partial<Record<PersonStatus, string>> = { pending: 'warning', approved: 'success', revoked: 'danger' };
const modeLabel = { groups: 'People in chosen groups', everyone: 'Everyone who signs in', approved: 'Approved people only' };
const when = (at: string) => new Date(at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });

export function ConnectionPeople({ scope, connection, onBack }: { scope: EnvironmentScope; connection: IdentityConnection; onBack: () => void }) {
 const client = useQueryClient();
 const key = [...identityKey(scope), 'people', connection.id] as const;
 const pendingQuery = useQuery({ queryKey: [...key, 'pending'], queryFn: ({ signal }) => identityApi.people(scope, connection.id, { status: 'pending' }, signal), retry: false });
 const [status, setStatus] = useState<string | null>(null);
 const [search, setSearch] = useState('');
 const [cursors, setCursors] = useState<string[]>(['']);
 const [selected, setSelected] = useState<string[]>([]);
 const [revoking, setRevoking] = useState<ConnectionPerson | null>(null);
 const pending = pendingQuery.data?.items.length ?? 0;
 // Opens on the pending people when some wait, else on everyone.
 const filter = status ?? (pendingQuery.isSuccess ? (pending ? 'pending' : 'all') : null);
 const page = cursors.length;
 const list = useQuery({ queryKey: [...key, filter, search, cursors[page - 1]], enabled: filter !== null, retry: false,
  queryFn: ({ signal }) => identityApi.people(scope, connection.id, { status: filter === 'all' ? '' : filter ?? '', q: search.trim(), cursor: cursors[page - 1] }, signal) });
 const refresh = () => client.invalidateQueries({ queryKey: key });
 const approve = useMutation({ mutationFn: (subjects: string[]) => identityApi.approve(scope, connection.id, subjects, new AbortController().signal), onSuccess: () => { setSelected([]); void refresh(); } });
 const revoke = useMutation({ mutationFn: (subject: string) => identityApi.revokeApproval(scope, connection.id, subject, new AbortController().signal), onSuccess: () => { setRevoking(null); void refresh(); } });
 const rows = list.data?.items ?? [];
 const selectable = rows.filter(p => p.status === 'pending' || p.status === 'revoked').map(p => p.subject);
 const allSelected = selectable.length > 0 && selectable.every(s => selected.includes(s));
 const error = approve.error ?? revoke.error ?? list.error;
 const changeFilter = (next: () => void) => { next(); setSelected([]); setCursors(['']); };

 return <section className="identity-registry" aria-label="People of the connection">
  <button className="cp-admin-button cp-admin-button--secondary identity-people-back" type="button" onClick={onBack}><ArrowLeft size={16} />Back to Identity providers</button>
  <header className="access-page-heading"><div><h1 className="cp-admin-title identity-people-title">{connection.name} <Help text={'People of this Generic OIDC connection. The provider has no directory: a person appears here after the first harness login or token exchange.\n\nA person is the issuer and the sub of the token. The email is shown only when the provider marks it verified.'} /></h1><p className="cp-admin-muted">People who signed in with this provider</p></div></header>
  <div className="identity-list-title"><h2>People</h2>{connection.eligibility ? <span className="cp-admin-muted">Who can log in from a harness: <span className="mcp-badge">{modeLabel[connection.eligibility]}</span></span> : null}</div>
  {pending ? <div className="cp-admin-notice identity-people-notice" role="status"><strong>{pending} {pending === 1 ? 'person is' : 'people are'} waiting for approval</strong><span>They can not log in from a harness until you approve them. Approval is for this connection; each agent still limits the tools, resources and rules. Revoke an approval to stop someone in every agent of this connection.</span></div> : null}
  {error ? <p className="cp-admin-notice cp-admin-notice--danger" role="alert">{identityError(error)}</p> : null}
  <div className="identity-list-toolbar">
   <label><span className="identity-sr-only">Search people</span><input type="search" className="cp-admin-input" placeholder="Search by name, email or sub" value={search} onChange={e => changeFilter(() => setSearch(e.target.value))} /></label>
   <label><span className="identity-sr-only">Status</span><SelectMenu label="Filter by status" value={filter ?? 'all'} onChange={v => changeFilter(() => setStatus(v))} options={[{ value: 'all', label: 'All statuses' }, { value: 'pending', label: `Pending approval (${pending})` }, { value: 'approved', label: 'Approved' }, { value: 'revoked', label: 'Approval revoked' }, { value: 'seen', label: 'Seen in token exchanges' }]} /></label>
   <span className="identity-people-bulk"><button className="cp-admin-button cp-admin-button--small" type="button" disabled={!selected.length || approve.isPending} onClick={() => approve.mutate(selected)}>Approve selected{selected.length ? ` (${selected.length})` : ''}</button></span>
  </div>
  {list.isPending ? <p role="status">Loading people…</p> : rows.length === 0 ? <p className="cp-admin-muted">{search || filter !== 'all' ? 'No people match these filters.' : 'Nobody signed in with this provider yet.'}</p> :
   <div className="cp-admin-table-scroll identity-table-region" role="region" aria-label="People" tabIndex={0}>
    <table className="cp-admin-table identity-table identity-people-table">
     <thead><tr>
      <th className="identity-people-check"><input type="checkbox" aria-label="Select all people waiting for approval" checked={allSelected} disabled={!selectable.length} onChange={e => setSelected(e.target.checked ? selectable : [])} /></th>
      <th>Person</th><th>Groups</th><th>Status</th><th>First seen</th><th>Last sign-in</th><th className="identity-actions-head">Actions</th>
     </tr></thead>
     <tbody>{rows.map(p => <tr key={p.subject}>
      <td className="identity-people-check">{p.status === 'pending' || p.status === 'revoked' ? <input type="checkbox" aria-label={`Select ${p.name || p.subject}`} checked={selected.includes(p.subject)} onChange={e => setSelected(s => e.target.checked ? [...s, p.subject] : s.filter(x => x !== p.subject))} /> : null}</td>
      <td><div className="identity-name"><UserRound size={22} /><span><strong>{p.name || p.subject}</strong><small className="cp-admin-muted identity-mono">{p.email || `sub ${p.subject}`}</small></span></div></td>
      <td><div className="identity-people-groups">{p.groups.length ? p.groups.map(g => <span key={g} className="mcp-badge">{g}</span>) : <span className="cp-admin-muted">None</span>}</div></td>
      <td><span className="mcp-badge" data-tone={tone[p.status]}>{label[p.status]}</span></td>
      <td>{when(p.first_seen_at)}<small className="identity-check-date cp-admin-muted">{p.first_seen_via === 'harness_login' ? 'Harness login' : 'Token exchange'}</small></td>
      <td>{when(p.last_seen_at)}</td>
      <td><div className="identity-row-actions">
       {p.status === 'pending' || p.status === 'revoked' ? <button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" type="button" disabled={approve.isPending} onClick={() => approve.mutate([p.subject])}>Approve</button> : null}
       {p.status === 'approved' ? <button className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" type="button" onClick={() => setRevoking(p)}>Revoke approval</button> : null}
      </div></td>
     </tr>)}</tbody>
    </table>
   </div>}
  <TracePager page={page} size={25} total={list.data?.total ?? 0} busy={list.isFetching}
   onPage={n => setCursors(c => n > c.length && list.data?.next_cursor ? [...c, list.data.next_cursor] : c.slice(0, Math.max(1, n)))} />
  {revoking ? <ConfirmDialog title="Revoke approval" confirmLabel="Revoke approval" busy={revoke.isPending} onClose={() => setRevoking(null)} onConfirm={() => revoke.mutate(revoking.subject)}
   warning="Their harness sessions stop at once in every agent of this connection, also with an unexpired token.">
   <p>Revoke the approval of {revoking.name || revoking.subject}? They can not log in from a harness until you approve them again.</p>
  </ConfirmDialog> : null}
 </section>;
}
