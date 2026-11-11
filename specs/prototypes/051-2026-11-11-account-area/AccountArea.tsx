import { useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router';
import { Building2, Plus, TriangleAlert, UserRound } from 'lucide-react';
import '../../../src/layouts/admin-layout.css';
import '../../../src/components/header/admin-header.css';
import '../../../src/features/investigate/investigate.css';
import { Wordmark } from '../../../src/components/brand/Wordmark';
import { Dropdown } from '../../../src/components/ui/dropdown/Dropdown';
import { Dialog } from '../../../src/components/ui/dialog/Dialog';
import { TracePager } from '../../../src/features/investigate/TraceUI';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import { account, workspaces, type WorkspaceRow } from './data';
import './account-area.css';

// Admin 051 prototype: the account area. A layout of its own, separate from the Admin layout,
// with the same design system. Fixed data; no API call writes data.
const base = '/prototype/account';

function AccountHeader() {
  return (
    <header className="cp-admin-topbar">
      <div className="cp-admin-topbar-inner admin-topbar-inner">
        <Link className="cp-admin-brand" to={`${base}/workspaces`} aria-label="Account home"><Wordmark /></Link>
        <span className="admin-nav-divider" aria-hidden="true" />
        <span className="account-topbar-title">Account</span>
        <div className="admin-nav-actions">
          <Dropdown group="account-header" label="Open profile" triggerClassName="admin-account" trigger={account.email.charAt(0).toUpperCase()}>
            <div className="admin-profile"><strong>Account</strong><span>{account.email}</span></div>
            <button type="button" className="admin-dropdown-option">Sign out</button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}

// The sections of the account area, with the design-system inner tabs.
function AccountTabs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const info = pathname.startsWith(`${base}/info`);
  return (
    <div className="cp-admin-inner-tabs account-tabs" role="group" aria-label="Account sections">
      <button type="button" aria-current={info ? undefined : 'page'} onClick={() => navigate(`${base}/workspaces`)}><Building2 size={17} aria-hidden="true" />Workspaces</button>
      <button type="button" aria-current={info ? 'page' : undefined} onClick={() => navigate(`${base}/info`)}><UserRound size={17} aria-hidden="true" />Account info</button>
    </div>
  );
}

const agentCount = (workspace: WorkspaceRow) => workspace.environments.reduce((sum, environment) => sum + environment.agents, 0);

function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const [typed, setTyped] = useState('');
  return (
    <Dialog title="Delete account" onClose={onClose}>
      <div className="admin-dialog-body">
        <div className="cp-admin-notice cp-admin-notice--danger" role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          <div className="cp-admin-notice-body">
            <strong>This permanently deletes your account. You cannot undo it.</strong>
            <span>You lose access to every workspace at once.</span>
          </div>
        </div>
        <div className="account-cell-chip"><p>These workspaces have no other admin. They are deleted with their Sandbox and Production environments, agents, keys, connections, permissions and records:</p><WaitingBackend spec="084" tip="Lists the workspaces that are deleted with the account, because it is their only admin, with the agent count of each one." /></div>
        <ul className="account-delete-list">{workspaces.map(workspace => <li key={workspace.tenantId}><Building2 size={16} aria-hidden="true" /><strong>{workspace.name}</strong><span className="cp-admin-muted">{agentCount(workspace)} {agentCount(workspace) === 1 ? "agent" : "agents"} in Sandbox and Production</span></li>)}</ul>
        <p>Agents of these workspaces get no token after this, and their calls are refused.</p>
        <label className="cp-admin-field"><span>Type <strong>{account.email}</strong> to confirm</span><input className="cp-admin-input" value={typed} onChange={event => setTyped(event.target.value)} autoComplete="off" /></label>
      </div>
      <div className="admin-dialog-actions">
        <button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="cp-admin-button cp-admin-button--danger" disabled={typed !== account.email} onClick={onClose}>Delete account permanently</button>
      </div>
    </Dialog>
  );
}

function AccountInfo() {
  const [name, setName] = useState(account.name);
  const [deleting, setDeleting] = useState(false);
  return (
    <main id="main-content" className="admin-page cp-admin-container" aria-label="Account info" tabIndex={-1}>
      <AccountTabs />
      <header className="access-page-heading">
        <div>
          <h1 className="cp-admin-title">Account info</h1>
          <p className="cp-admin-muted">Your name and the email you sign in with.</p>
        </div>
      </header>
      <form className="account-form" onSubmit={event => event.preventDefault()}>
        <section className="account-section" aria-labelledby="account-profile-title">
          <h2 id="account-profile-title">Profile</h2>
          <p className="cp-admin-muted">People of your workspaces see this name in the revision history and the Inbox.</p>
          <div className="account-cell-chip">
            <label className="cp-admin-field account-name-field">Name<input className="cp-admin-input" value={name} required maxLength={100} onChange={event => setName(event.target.value)} /></label>
            <WaitingBackend spec="084" tip="Changes the name of your account." />
          </div>
          <div className="account-cell-chip">
            <label className="cp-admin-field account-name-field">Email<input className="cp-admin-input" value={account.email} readOnly /></label>
            <WaitingBackend spec="084" tip="Shows the email you sign in with. Today the backend does not store it." />
          </div>
          <small className="cp-admin-muted">You sign in with this email.</small>
        </section>
        <div className="account-actions">
          <button type="submit" className="cp-admin-button">Save changes</button>
        </div>
      </form>
      <section className="account-section account-danger" aria-labelledby="account-delete-title">
        <h2 id="account-delete-title">Delete account</h2>
        <p className="cp-admin-muted">Deletes your account and your access to every workspace.</p>
        <div className="account-cell-chip">
          <button type="button" className="cp-admin-button cp-admin-button--danger-soft" onClick={() => setDeleting(true)}>Delete account</button>
          <WaitingBackend spec="084" tip="Deletes the account, its memberships and the workspaces where it is the only admin." />
        </div>
      </section>
      {deleting ? <DeleteAccountDialog onClose={() => setDeleting(false)} /> : null}
    </main>
  );
}

function CreateWorkspaceDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  return (
    <Dialog title="Create workspace" onClose={onClose}>
      <form onSubmit={event => { event.preventDefault(); onClose(); }}>
        <div className="admin-dialog-body">
          <label className="cp-admin-field">Workspace name<input className="cp-admin-input" value={name} required maxLength={100} onChange={event => setName(event.target.value)} /></label>
          <small className="cp-admin-muted">Up to 100 characters. The workspace starts with a Sandbox and a Production environment.</small>
        </div>
        <div className="admin-dialog-actions">
          <button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="cp-admin-button">Create workspace</button>
        </div>
      </form>
    </Dialog>
  );
}

function DeleteWorkspaceDialog({ workspace, onClose, onDeleted }: { workspace: WorkspaceRow; onClose: () => void; onDeleted: () => void }) {
  const [typed, setTyped] = useState('');
  return (
    <Dialog title="Delete workspace" onClose={onClose}>
      <div className="admin-dialog-body">
        <div className="account-cell-chip"><p>Delete <strong>{workspace.name}</strong> with its Sandbox and Production environments?</p><WaitingBackend spec="084" tip="Deletes the workspace with its Sandbox and Production environments, their OpenFGA stores and keys." /></div>
        <div className="cp-admin-notice cp-admin-notice--warning confirm-dialog-warning" role="note">
          <TriangleAlert size={18} aria-hidden="true" />
          <div>Every agent, key, connection, permission and record of both environments is deleted. Agents of this workspace get no token after this. You cannot undo it.</div>
        </div>
        <label className="cp-admin-field">Type the workspace name to confirm<input className="cp-admin-input" value={typed} onChange={event => setTyped(event.target.value)} autoComplete="off" /></label>
      </div>
      <div className="admin-dialog-actions">
        <button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="cp-admin-button cp-admin-button--danger" disabled={typed !== workspace.name} onClick={onDeleted}>Delete workspace</button>
      </div>
    </Dialog>
  );
}

function WorkspaceList() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<WorkspaceRow | null>(null);
  return (
    <main id="main-content" className="admin-page cp-admin-container" aria-label="Workspaces" tabIndex={-1}>
      <AccountTabs />
      <header className="access-page-heading">
        <div>
          <h1 className="cp-admin-title">Workspaces</h1>
          <p className="cp-admin-muted">The workspaces you belong to. Each one has a Sandbox and a Production environment.</p>
        </div>
        <span className="account-cell-chip">
          <WaitingBackend spec="084" tip="Creates another workspace for this account. Today only the first workspace can be created, at signup." />
          <button type="button" className="cp-admin-button" onClick={() => setCreating(true)}><Plus size={16} />Create workspace</button>
        </span>
      </header>
      <div className="cp-admin-table-scroll" role="region" aria-label="Workspaces" tabIndex={0}>
        <table className="cp-admin-table account-table">
          <thead><tr><th scope="col">Workspace</th><th scope="col">Environments</th><th scope="col">Your role</th><th scope="col">Created</th><th scope="col">Actions</th></tr></thead>
          <tbody>{workspaces.map(workspace => (
            <tr key={workspace.tenantId}>
              <td><div className="account-name"><Building2 size={22} aria-hidden="true" /><span><strong>{workspace.name}</strong><small>{workspace.tenantId}</small></span></div></td>
              <td><div className="account-badges">{workspace.environments.map(environment => <span key={environment.id} className="mcp-badge">{environment.name}</span>)}</div></td>
              <td><div className="account-cell-chip"><span className="mcp-badge">{workspace.role}</span><WaitingBackend spec="084" tip="Your role in the workspace. The person who creates a workspace is its Admin." /></div></td>
              <td><div className="account-cell-chip"><span>{workspace.createdAt}</span><WaitingBackend spec="084" tip="The date the workspace was created." /></div></td>
              <td><div className="account-row-actions">
                <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => navigate('/')}>Open Admin</button>
                <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => navigate(`${base}/workspaces/${workspace.tenantId}`)}>Edit</button>
                <button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" onClick={() => setDeleting(workspace)}>Delete</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <TracePager page={1} size={20} total={workspaces.length} onPage={() => undefined} />
      {creating ? <CreateWorkspaceDialog onClose={() => setCreating(false)} /> : null}
      {deleting ? <DeleteWorkspaceDialog workspace={deleting} onClose={() => setDeleting(null)} onDeleted={() => setDeleting(null)} /> : null}
    </main>
  );
}

function WorkspaceDetail() {
  const navigate = useNavigate();
  const { tenantId } = useParams();
  const workspace = workspaces.find(item => item.tenantId === tenantId) ?? workspaces[0];
  const [name, setName] = useState(workspace.name);
  const [deleting, setDeleting] = useState(false);
  const back = () => navigate(`${base}/workspaces`);
  return (
    <main id="main-content" className="admin-page cp-admin-container" aria-label={workspace.name} tabIndex={-1}>
      <AccountTabs />
      <header className="access-page-heading">
        <div>
          <h1 className="cp-admin-title">{workspace.name}</h1>
          <p className="cp-admin-muted">The name and the environments of this workspace.</p>
        </div>
        <button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={back}>Back to workspaces</button>
      </header>
      <form className="account-form" onSubmit={event => { event.preventDefault(); back(); }}>
        <section className="account-section" aria-labelledby="account-name-title">
          <h2 id="account-name-title">Name</h2>
          <p className="cp-admin-muted">The name that people see in the Admin and on the login pages.</p>
          <div className="account-cell-chip">
            <label className="cp-admin-field account-name-field">Workspace name<input className="cp-admin-input" value={name} required maxLength={100} onChange={event => setName(event.target.value)} /></label>
            <WaitingBackend spec="084" tip="Renames the workspace. The workspace ID does not change." />
          </div>
          <small className="cp-admin-muted">Up to 100 characters. Workspace ID <span className="account-mono">{workspace.tenantId}</span></small>
        </section>
        <section className="account-section" aria-labelledby="account-environments-title">
          <h2 id="account-environments-title">Environments</h2>
          <p className="cp-admin-muted">Every workspace has these two environments. Nothing is shared between them.</p>
          <div className="cp-admin-table-scroll" role="region" aria-label="Environments" tabIndex={0}>
            <table className="cp-admin-table account-table">
              <thead><tr><th scope="col">Environment</th><th scope="col">Authorization server issuer</th><th scope="col">Actions</th></tr></thead>
              <tbody>{workspace.environments.map(environment => (
                <tr key={environment.id}>
                  <td><div className="account-name"><span><strong>{environment.name}</strong><small>{environment.id}</small></span></div></td>
                  <td><span className="account-mono">{environment.issuer}</span></td>
                  <td><div className="account-row-actions"><button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => navigate('/')}>Open Admin</button></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
        <div className="account-actions">
          <button type="submit" className="cp-admin-button">Save changes</button>
          <span>
            <button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={back}>Cancel</button>
            <WaitingBackend spec="084" tip="Deletes the workspace with its Sandbox and Production environments, their OpenFGA stores and keys." />
            <button type="button" className="cp-admin-button cp-admin-button--danger-soft" onClick={() => setDeleting(true)}>Delete workspace</button>
          </span>
        </div>
      </form>
      {deleting ? <DeleteWorkspaceDialog workspace={workspace} onClose={() => setDeleting(false)} onDeleted={back} /> : null}
    </main>
  );
}

// A new workspace page for each workspace, so that the form starts from its name.
function WorkspaceDetailRoute() {
  const { tenantId } = useParams();
  return <WorkspaceDetail key={tenantId} />;
}

export function AccountArea() {
  return (
    <div className="admin-layout">
      <title>Account | Xokepoint</title>
      <a className="admin-skip-link" href="#main-content">Skip to content</a>
      <AccountHeader />
      <Routes>
        <Route index element={<WorkspaceList />} />
        <Route path="workspaces" element={<WorkspaceList />} />
        <Route path="workspaces/:tenantId" element={<WorkspaceDetailRoute />} />
        <Route path="info" element={<AccountInfo />} />
      </Routes>
    </div>
  );
}
