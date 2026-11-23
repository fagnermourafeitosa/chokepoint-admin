import { useState } from 'react';
import { Building2, Plus, Send, UserRound } from 'lucide-react';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import { BarricadeIcon } from '../../../src/features/account/BarricadeIcon';
import { TracePager } from '../../../src/features/investigate/TraceUI';
import '../../../src/features/investigate/investigate.css';
import '../../../src/features/account/account.css';
import { environments, workspaces as initial, type Workspace } from './data';
import './prototype.css';

// Admin 063 prototype: the Workspaces list of the account area (Admin 051, WorkspacesPage) with the
// PII filter switch of each environment, as the agents table of PII Policies has one per
// environment. The workspace has no switch of its own.
// Rendered under /account/prototype/pii-workspaces. Switching writes nothing.
export function WorkspacesPrototype() {
  const [rows, setRows] = useState<Workspace[]>(initial);
  const set = (value: string, change: (w: Workspace) => Workspace) => setRows(list => list.map(w => (w.value === value ? change(w) : w)));
  return <main id="main-content" className="admin-page cp-admin-container" aria-label="Workspaces" tabIndex={-1}>
    <div className="cp-admin-inner-tabs account-tabs" role="group" aria-label="Account sections">
      <button type="button" aria-current="page"><Building2 size={17} aria-hidden="true" />Workspaces</button>
      <button type="button"><Send size={17} aria-hidden="true" />Events export</button>
      <button type="button"><BarricadeIcon />Barricade</button>
      <button type="button"><UserRound size={17} aria-hidden="true" />Account info</button>
    </div>
    <header className="access-page-heading">
      <div>
        <h1 className="cp-admin-title">Workspaces</h1>
        <p className="cp-admin-muted">The workspaces you belong to. Each one has a Sandbox and a Production environment.</p>
      </div>
      <button type="button" className="cp-admin-button"><Plus size={16} />Create workspace</button>
    </header>
    <div className="cp-admin-table-scroll" role="region" aria-label="Workspaces" tabIndex={0}>
      <table className="cp-admin-table account-table">
        <thead><tr><th scope="col">Workspace</th><th scope="col">PII filter by environment <WaitingBackend spec="105" tip="Turns the PII filter of each environment on or off; off in a new workspace." /></th><th scope="col">Your role</th><th scope="col">Created</th><th scope="col">Actions</th></tr></thead>
        <tbody>{rows.map(w => <tr key={w.value}>
          <td><div className="account-name"><Building2 size={22} aria-hidden="true" /><span><strong>{w.label}</strong><small>{w.tenantId}</small></span></div></td>
          
          <td><div className="pii-env-toggles">{environments.map(e => <span key={e.value} className="pii-toggle">
            <input className="cp-admin-switch cp-admin-switch--status" type="checkbox" role="switch" aria-label={`PII filter of ${w.label} ${e.label}`} checked={w.environments[e.value]} onChange={ev => { const on = ev.target.checked; set(w.value, x => ({ ...x, environments: { ...x.environments, [e.value]: on } })); }} />
            {e.label}
          </span>)}</div></td>
          <td><span className="mcp-badge">Admin</span></td>
          <td>{w.created}</td>
          <td><div className="account-row-actions">
            <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small">Open Admin</button>
            <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small">Edit</button>
            <button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small">Delete</button>
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>
    <TracePager page={1} size={10} total={rows.length} onPage={() => undefined} />
  </main>;
}
