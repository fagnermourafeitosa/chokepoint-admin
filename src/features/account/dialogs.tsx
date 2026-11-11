import { useRef, useState, type FormEvent } from 'react';
import { Building2, TriangleAlert } from 'lucide-react';
import { Dialog } from '../../components/ui/dialog/Dialog';
import { HttpError } from '../../api/http-client';
import type { Workspace } from '../auth/AuthContext';
import { accountApi, type DeletionPreview } from './api';

const failure = (error: unknown, conflict: string) =>
  error instanceof HttpError && error.status === 409 ? conflict
    : error instanceof HttpError && error.status === 403 ? 'Only an admin of this workspace can do this.'
      : 'The request failed. Try again.';

// Admin 051, item 8. The idempotency key stays while the name stays.
export function CreateWorkspaceDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (workspace: Workspace) => void }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const attempt = useRef({ name: '', key: crypto.randomUUID() });
  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalized = name.trim();
    if (busy || !normalized) return;
    if (attempt.current.name !== normalized) attempt.current = { name: normalized, key: crypto.randomUUID() };
    setBusy(true);
    setError('');
    try {
      onCreated(await accountApi.createWorkspace(normalized, attempt.current.key));
    } catch (e) {
      setError(failure(e, 'This request was already used for another name. Change the name and try again.'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog title="Create workspace" onClose={() => { if (!busy) onClose(); }}>
      <form onSubmit={event => void submit(event)}>
        <div className="admin-dialog-body">
          <label className="cp-admin-field">Workspace name<input className="cp-admin-input" value={name} required maxLength={100} disabled={busy} onChange={event => setName(event.target.value)} /></label>
          <small className="cp-admin-muted">Up to 100 characters. The workspace starts with a Sandbox and a Production environment.</small>
          {error ? <p role="alert" className="cp-admin-notice cp-admin-notice--danger">{error}</p> : null}
        </div>
        <div className="admin-dialog-actions">
          <button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={busy} onClick={onClose}>Cancel</button>
          <button type="submit" className="cp-admin-button" disabled={busy}>{busy ? 'Creating…' : 'Create workspace'}</button>
        </div>
      </form>
    </Dialog>
  );
}

// Admin 051, item 13.
export function DeleteWorkspaceDialog({ workspace, onClose, onDeleted }: { workspace: Workspace; onClose: () => void; onDeleted: () => void }) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function remove() {
    setBusy(true);
    setError('');
    try {
      await accountApi.deleteWorkspace(workspace.tenant_id, typed);
      onDeleted();
    } catch (e) {
      setError(failure(e, 'The name does not match. Type it again.'));
      setBusy(false);
    }
  }
  return (
    <Dialog title="Delete workspace" onClose={() => { if (!busy) onClose(); }}>
      <div className="admin-dialog-body">
        <p>Delete <strong>{workspace.name}</strong> with its Sandbox and Production environments?</p>
        <div className="cp-admin-notice cp-admin-notice--warning confirm-dialog-warning" role="note">
          <TriangleAlert size={18} aria-hidden="true" />
          <div>Every agent, key, connection, permission and record of both environments is deleted. Agents of this workspace get no token after this. You cannot undo it.</div>
        </div>
        <label className="cp-admin-field">Type the workspace name to confirm<input className="cp-admin-input" value={typed} disabled={busy} onChange={event => setTyped(event.target.value)} autoComplete="off" /></label>
        {error ? <p role="alert" className="cp-admin-notice cp-admin-notice--danger">{error}</p> : null}
      </div>
      <div className="admin-dialog-actions">
        <button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={busy} onClick={onClose}>Cancel</button>
        <button type="button" className="cp-admin-button cp-admin-button--danger" disabled={busy || typed !== workspace.name} onClick={() => void remove()}>{busy ? 'Deleting…' : 'Delete workspace'}</button>
      </div>
    </Dialog>
  );
}

// Admin 051, item 17: more urgency than the other confirmations.
export function DeleteAccountDialog({ email, preview, previewFailed, onClose, onDeleted }: { email: string; preview: DeletionPreview['workspaces'] | undefined; previewFailed: boolean; onClose: () => void; onDeleted: () => void }) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function remove() {
    setBusy(true);
    setError('');
    try {
      await accountApi.remove(typed);
      onDeleted();
    } catch (e) {
      setError(e instanceof HttpError && e.status === 503 ? 'Account deletion is not available now. Try again later.' : failure(e, 'The email does not match. Type it again.'));
      setBusy(false);
    }
  }
  const agents = (n: number) => `${n} ${n === 1 ? 'agent' : 'agents'} in Sandbox and Production`;
  return (
    <Dialog title="Delete account" onClose={() => { if (!busy) onClose(); }}>
      <div className="admin-dialog-body">
        <div className="cp-admin-notice cp-admin-notice--danger" role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          <div className="cp-admin-notice-body">
            <strong>This permanently deletes your account. You cannot undo it.</strong>
            <span>You lose access to every workspace at once.</span>
          </div>
        </div>
        {previewFailed ? <p role="alert" className="cp-admin-notice cp-admin-notice--danger">Could not check which workspaces are deleted with your account. Close and try again.</p>
          : preview === undefined ? <p role="status" className="cp-admin-muted">Checking your workspaces…</p>
          : preview.length ? <>
            <p>These workspaces have no other admin. They are deleted with their Sandbox and Production environments, agents, keys, connections, permissions and records:</p>
            <ul className="account-delete-list">{preview.map(w => <li key={w.tenant_id}><Building2 size={16} aria-hidden="true" /><strong>{w.name}</strong><span className="cp-admin-muted">{agents(w.agent_count)}</span></li>)}</ul>
            <p>Agents of these workspaces get no token after this, and their calls are refused.</p>
          </> : <p>Every workspace of yours has another admin, so no workspace is deleted.</p>}
        <label className="cp-admin-field"><span>Type <strong>{email}</strong> to confirm</span><input className="cp-admin-input" value={typed} disabled={busy} onChange={event => setTyped(event.target.value)} autoComplete="off" /></label>
        {error ? <p role="alert" className="cp-admin-notice cp-admin-notice--danger">{error}</p> : null}
      </div>
      <div className="admin-dialog-actions">
        <button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={busy} onClick={onClose}>Cancel</button>
        <button type="button" className="cp-admin-button cp-admin-button--danger" disabled={busy || !email || preview === undefined || typed.trim().toLowerCase() !== email.toLowerCase()} onClick={() => void remove()}>{busy ? 'Deleting…' : 'Delete account permanently'}</button>
      </div>
    </Dialog>
  );
}
