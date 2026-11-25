import { useState } from 'react';
import { ArrowLeft, UserRound } from 'lucide-react';
import { SelectMenu } from '../../../src/components/ui/dropdown/SelectMenu';
import { ConfirmDialog } from '../../../src/components/ui/dialog/ConfirmDialog';
import { TracePager } from '../../../src/features/investigate/TraceUI';
import { Help } from '../../../src/features/identity/Help';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import '../../../src/features/identity/identity.css';
import '../../../src/features/access/delegation/delegation.css';
import { people as initialPeople, workspaceLabel, type Person, type PersonStatus } from './data';
import '../../../src/features/mcp/mcp.css';
import '../../../src/features/investigate/investigate.css';
import './prototype.css';

// Admin 065 layout prototype: People of a Generic OIDC connection. A person exists after the first
// harness login or token exchange; with "Approved people only", a harness login waits for approval.
// Approval and its revocation live here, for the whole connection; blocking one agent stays in that
// agent, under Harness sessions (Admin 036).
const label: Record<PersonStatus, string> = { pending: 'Pending approval', approved: 'Approved', revoked: 'Approval revoked', seen: 'Seen' };
const tone: Partial<Record<PersonStatus, string>> = { pending: 'warning', approved: 'success', revoked: 'danger' };

export function PeoplePrototype() {
  const [people, setPeople] = useState(initialPeople);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [revoking, setRevoking] = useState<Person | null>(null);
  const pending = people.filter(p => p.status === 'pending').length;
  const rows = people.filter(p => (status === 'all' || p.status === status) && `${p.name} ${p.email ?? ''} ${p.sub}`.toLowerCase().includes(search.toLowerCase()));
  const set = (subs: string[], next: PersonStatus) => { setPeople(list => list.map(p => subs.includes(p.sub) ? { ...p, status: next } : p)); setSelected(s => s.filter(x => !subs.includes(x))); };
  const selectable = rows.filter(p => p.status === 'pending').map(p => p.sub);
  const allSelected = selectable.length > 0 && selectable.every(s => selected.includes(s));

  return <section className="identity-registry" aria-label="People of the connection">
    <button className="cp-admin-button cp-admin-button--secondary identity-people-back" type="button"><ArrowLeft size={16} />Back to Identity providers</button>
    <header className="access-page-heading"><div><h1 className="cp-admin-title">Acme login <Help text={'People of this Generic OIDC connection. The provider has no directory: a person appears here after the first harness login or token exchange.\n\nA person is the issuer and the sub of the token. The email is shown only when the provider marks it verified.'} /></h1><p className="cp-admin-muted">People who signed in with this provider · {workspaceLabel}</p></div></header>
    <div className="identity-list-title"><h2>People <WaitingBackend spec="106" tip="Lists the people of a connection without a directory, as first seen in a harness login or a token exchange, with their approval state." /></h2><span className="cp-admin-muted">Who can log in from a harness: <span className="mcp-badge">Approved people only</span></span></div>
    {pending ? <div className="cp-admin-notice identity-people-notice" role="status"><strong>{pending} people are waiting for approval</strong><span>They can not log in from a harness until you approve them. Approval is for this connection; each agent still limits the tools, resources and rules. Revoke an approval to stop someone in every agent of this connection.</span></div> : null}
    <div className="identity-list-toolbar">
      <label><span className="identity-sr-only">Search people</span><input type="search" className="cp-admin-input" placeholder="Search by name, email or sub" value={search} onChange={e => setSearch(e.target.value)} /></label>
      <label><span className="identity-sr-only">Status</span><SelectMenu label="Filter by status" value={status} onChange={v => { setStatus(v); setSelected([]); }} options={[{ value: 'all', label: 'All statuses' }, { value: 'pending', label: `Pending approval (${pending})` }, { value: 'approved', label: 'Approved' }, { value: 'revoked', label: 'Approval revoked' }, { value: 'seen', label: 'Seen in token exchanges' }]} /></label>
      <span className="identity-people-bulk"><button className="cp-admin-button cp-admin-button--small" type="button" disabled={!selected.length} onClick={() => set(selected, 'approved')}>Approve selected{selected.length ? ` (${selected.length})` : ''}</button></span>
    </div>
    <div className="cp-admin-table-scroll identity-table-region" role="region" aria-label="People" tabIndex={0}>
      <table className="cp-admin-table identity-table identity-people-table">
        <thead><tr>
          <th className="identity-people-check"><input type="checkbox" aria-label="Select all pending people" checked={allSelected} disabled={!selectable.length} onChange={e => setSelected(e.target.checked ? selectable : [])} /></th>
          <th>Person</th><th>Groups</th><th>Status</th><th>First seen</th><th>Last sign-in</th><th className="identity-actions-head">Actions</th>
        </tr></thead>
        <tbody>{rows.map(p => <tr key={p.sub}>
          <td className="identity-people-check">{p.status === 'pending' ? <input type="checkbox" aria-label={`Select ${p.name}`} checked={selected.includes(p.sub)} onChange={e => setSelected(s => e.target.checked ? [...s, p.sub] : s.filter(x => x !== p.sub))} /> : null}</td>
          <td><div className="identity-name"><UserRound size={22} /><span><strong>{p.name}</strong><small className="cp-admin-muted identity-mono">{p.email ?? `sub ${p.sub}`}</small></span></div></td>
          <td><div className="identity-people-groups">{p.groups.length ? p.groups.map(g => <span key={g} className="mcp-badge">{g}</span>) : <span className="cp-admin-muted">None</span>}</div></td>
          <td><span className="mcp-badge" data-tone={tone[p.status]}>{label[p.status]}</span></td>
          <td>{p.firstSeen}<small className="identity-check-date cp-admin-muted">{p.via}</small></td>
          <td>{p.lastSignIn}</td>
          <td><div className="identity-row-actions">
            {p.status === 'pending' || p.status === 'revoked' ? <button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" type="button" onClick={() => set([p.sub], 'approved')}>Approve</button> : null}
            {p.status === 'approved' ? <button className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" type="button" onClick={() => setRevoking(p)}>Revoke approval</button> : null}
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>
    <TracePager page={1} size={25} total={rows.length} onPage={() => undefined} />
    {revoking ? <ConfirmDialog title="Revoke approval" confirmLabel="Revoke approval" onClose={() => setRevoking(null)} onConfirm={() => { set([revoking.sub], 'revoked'); setRevoking(null); }}
      warning="Their harness sessions stop at once in every agent of this connection, also with an unexpired token.">
      <p>Revoke the approval of {revoking.name}? They can not log in from a harness until you approve them again.</p>
    </ConfirmDialog> : null}
  </section>;
}
