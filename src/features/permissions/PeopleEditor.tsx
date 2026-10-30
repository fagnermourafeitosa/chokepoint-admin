import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Dialog } from '../../components/ui/dialog/Dialog';
import type { AgentScope } from '../access/agent-api';
import { identityApi, identityError, type DirectoryPage, type DirectoryUser, type IdentityConnection, type LifecycleUserState } from '../identity/api';
import type { Member } from './api';

type Props = { scope: AgentScope; members: Member[]; identities: IdentityConnection[]; disabled: boolean; focusPrincipal?: Member; onChange: (members: Member[]) => void };
const key = (member: Member) => JSON.stringify([member.issuer, member.subject]);
const lookupLimit = 200;
function lifecycleStatus(state?: LifecycleUserState): string {
 if (!state) return 'No lifecycle events';
 if (state.source_deleted) return 'Deleted in identity provider · access blocked';
 if (state.disabled) return `Disabled since ${state.disabled_at ? new Date(state.disabled_at).toLocaleString() : 'unknown time'} · access blocked`;
 return 'Active';
}
export function PeopleEditor({ scope, members, identities, disabled, focusPrincipal, onChange }: Props) {
 const [connectionId, setConnectionId] = useState('');
 const [search, setSearch] = useState('');
 const [start, setStart] = useState(1), [previous, setPrevious] = useState<number[]>([]);
 const [page, setPage] = useState<DirectoryPage>();
 const [selected, setSelected] = useState<Record<string, Member>>({});
 const [loading, setLoading] = useState(false), [error, setError] = useState(''), [retry, setRetry] = useState(0);
 const [detailId, setDetailId] = useState<string>(), [detail, setDetail] = useState<DirectoryUser>(), [detailError, setDetailError] = useState('');
 const connection = identities.find(i => i.id === connectionId);
 // Associated users show the state retained from lifecycle events, never a live directory read.
 const [lifecycle, setLifecycle] = useState<Record<string, LifecycleUserState>>({}), [lifecycleError, setLifecycleError] = useState('');
 const memberKeys = JSON.stringify(members.map(key));
 useEffect(() => {
  if (!members.length) { setLifecycle({}); setLifecycleError(''); return; }
  const controller = new AbortController(); setLifecycleError('');
  const chunks = Array.from({ length: Math.ceil(members.length / lookupLimit) }, (_, i) => members.slice(i * lookupLimit, (i + 1) * lookupLimit).map(m => ({ issuer: m.issuer, subject: m.subject })));
  Promise.all(chunks.map(chunk => identityApi.lifecycleUsers(scope, chunk, controller.signal))).then(results => {
   if (!controller.signal.aborted) setLifecycle(Object.fromEntries(results.flatMap(r => r.items).map(state => [key(state), state])));
  }).catch(() => { if (!controller.signal.aborted) setLifecycleError('Could not load the lifecycle state of associated users.'); });
  return () => controller.abort();
  // memberKeys tracks the member list by value, so a new array with the same members does not reload.
 }, [scope.userId, scope.tenantId, scope.environmentId, memberKeys]);
 useEffect(() => { setConnectionId(''); setSearch(''); setStart(1); setPrevious([]); setSelected({}); setDetailId(undefined); setError(''); }, [scope.userId, scope.tenantId, scope.environmentId]);
 useEffect(() => {
  if (!connectionId || !connection?.directory) { setPage(undefined); setLoading(false); return; }
  const controller = new AbortController(); setLoading(true); setError(''); setPage(undefined);
  identityApi.users(scope, connectionId, search, start, controller.signal).then(result => { if (!controller.signal.aborted) setPage(result); }).catch(reason => { if (!controller.signal.aborted) setError(identityError(reason)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
  return () => controller.abort();
 }, [scope.userId, scope.tenantId, scope.environmentId, connectionId, connection?.directory, search, start, retry]);
 useEffect(() => {
  if (!connectionId || !detailId) { setDetail(undefined); setDetailError(''); return; }
  const controller = new AbortController(); setDetail(undefined); setDetailError('');
  identityApi.user(scope, connectionId, detailId, controller.signal).then(result => { if (!controller.signal.aborted) setDetail(result); }).catch(reason => { if (!controller.signal.aborted) setDetailError(identityError(reason)); });
  return () => controller.abort();
 }, [scope.userId, scope.tenantId, scope.environmentId, connectionId, detailId]);
 function switchConnection(id: string) { setConnectionId(id); setSearch(''); setStart(1); setPrevious([]); setSelected({}); setDetailId(undefined); setError(''); }
 function updateSearch(value: string) { setSearch(value); setStart(1); setPrevious([]); }
 function addSelected() { const existing = new Set(members.map(key)); onChange([...members, ...Object.values(selected).filter(member => !existing.has(key(member)))]); setSelected({}); }
 function remove(member: Member) { onChange(members.filter(m => key(m) !== key(member))); }
 const selectedCount = Object.keys(selected).length;
 return <section aria-label="User associations" className="people-editor">
  <header className="permission-section-header"><div><h3>Users in this permission group</h3><p className="cp-admin-muted">Select people from an identity provider. Changes take effect after publication.</p></div></header>
  <div className="cp-admin-notice people-lifecycle-warning"><TriangleAlert size={18} aria-hidden="true" /><div><strong>Access follows lifecycle events</strong><span>When Auto sync users is enabled for the identity provider, Chokepoint blocks users that it reports as disabled or deleted, and allows them again after reactivation. The association stays. A change that Chokepoint did not receive is not applied, and providers without Auto sync users keep access until you remove the association and publish.</span></div></div>
  <div className="people-directory-toolbar"><label>Identity provider<select className="cp-admin-input" value={connectionId} onChange={e => switchConnection(e.target.value)} disabled={disabled}><option value="">Select an identity provider</option>{identities.filter(i => i.enabled).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
   <label>Search users<input type="search" className="cp-admin-input" value={search} maxLength={128} onChange={e => updateSearch(e.target.value)} placeholder="Search by name or email" disabled={!connectionId || !connection?.directory || disabled} /></label>
  </div>
  {connection && !connection.directory ? <p className="cp-admin-notice">Configure this provider's user directory in Integrations before selecting users.</p> : null}
  {loading ? <p role="status">Loading users…</p> : null}
  {error ? <p role="alert">{error} <button type="button" className="identity-text-button" onClick={() => setRetry(value => value + 1)}>Retry</button></p> : null}
  {page ? <><div className="cp-admin-table-scroll"><table className="cp-admin-table people-directory-table"><thead><tr><th><span className="identity-sr-only">Select</span></th><th>User</th><th>Email</th><th>Status</th><th>Association</th></tr></thead><tbody>
   {page.items.map(user => { const member = user.identity, memberKey = key(member), associated = members.some(m => key(m) === memberKey); return <tr key={memberKey}>
    <td><input type="checkbox" aria-label={`Select ${user.display_name || user.user_name || user.id}`} checked={associated || !!selected[memberKey]} disabled={disabled || associated} onChange={e => setSelected(value => { const next = { ...value }; if (e.target.checked) next[memberKey] = member; else delete next[memberKey]; return next; })} /></td>
    <td><button type="button" className="people-user-link" onClick={() => setDetailId(user.id)}>{user.display_name || user.user_name || user.id}</button>{user.user_name && user.display_name !== user.user_name ? <small>{user.user_name}</small> : null}</td>
    <td>{user.email || '—'}</td><td>{user.active === false ? 'Inactive' : user.active === true ? 'Active' : 'Unknown'}</td>
    <td>{associated ? <><span>Associated</span> <button type="button" className="identity-text-button" disabled={disabled} onClick={() => remove(member)}>Remove</button></> : 'Not associated'}</td>
   </tr>; })}
  </tbody></table></div>{page.items.length === 0 ? <p>No users found.</p> : null}
  <div className="people-directory-footer"><span>{page.total} users · {selectedCount} selected</span><div><button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={disabled || previous.length === 0} onClick={() => { const next = previous.at(-1); if (next !== undefined) { setStart(next); setPrevious(values => values.slice(0,-1)); } }}>Previous</button><button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={disabled || page.next_start === null} onClick={() => { if (page.next_start !== null) { setPrevious(values => [...values,start]); setStart(page.next_start); } }}>Next</button><button type="button" className="cp-admin-button" disabled={disabled || selectedCount === 0} onClick={addSelected}>Associate selected</button></div></div></> : null}
  {focusPrincipal && !members.some(m => key(m) === key(focusPrincipal)) ? <p className="cp-admin-notice">The selected person is not in this current permission configuration.</p> : null}
  <h4>Associated users</h4>{lifecycleError ? <p role="alert">{lifecycleError}</p> : null}{members.length ? <div className="cp-admin-table-scroll"><table className="cp-admin-table"><thead><tr><th>User</th><th>Identity provider</th><th>Status</th><th>Actions</th></tr></thead><tbody>{members.map(member => { const state = lifecycle[key(member)], name = state?.display_name || state?.user_name; return <tr key={key(member)} tabIndex={focusPrincipal && key(focusPrincipal) === key(member) ? -1 : undefined} data-context-target={focusPrincipal && key(focusPrincipal) === key(member)}><td>{name ? <>{name}<small><code>{member.subject}</code></small></> : <code>{member.subject}</code>}</td><td>{identities.find(i => i.issuer === member.issuer)?.name ?? member.issuer}</td><td>{lifecycleStatus(state)}</td><td><button type="button" className="identity-text-button" disabled={disabled} onClick={() => remove(member)}>Remove</button></td></tr>; })}</tbody></table></div> : <p>No users associated. This grouping grants no user access until associations are published.</p>}
  {detailId ? <Dialog title="User details" onClose={() => setDetailId(undefined)}><div className="admin-dialog-body">{detailError ? <p role="alert">{detailError}</p> : !detail ? <p role="status">Loading user details…</p> : <dl className="people-user-details"><dt>Name</dt><dd>{detail.display_name || '—'}</dd><dt>Username</dt><dd>{detail.user_name || '—'}</dd><dt>Email</dt><dd>{detail.email || '—'}</dd><dt>Status</dt><dd>{detail.active === false ? 'Inactive' : detail.active === true ? 'Active' : 'Unknown'}</dd><dt>Identity provider</dt><dd>{connection?.name}</dd></dl>}</div><div className="admin-dialog-actions"><button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={() => setDetailId(undefined)}>Close</button></div></Dialog> : null}
 </section>;
}
