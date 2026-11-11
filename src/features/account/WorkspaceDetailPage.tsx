import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient, HttpError } from '../../api/http-client';
import { useAuth, type EnvironmentRecord, type Workspace } from '../auth/AuthContext';
import { agentClientApi } from '../access/agent-client-api';
import { AccountTabs } from './AccountLayout';
import { DeleteWorkspaceDialog } from './dialogs';
import { accountApi, previewKey } from './api';

const environmentLabel = (name: EnvironmentRecord['name']) => (name === 'production' ? 'Production' : 'Sandbox');

// Admin 051, items 10 to 13: the name and the environments of one workspace.
export function WorkspaceDetailPage() {
  const auth = useAuth();
  const { tenantId } = useParams();
  const workspace = auth.workspaces.find(item => item.tenant_id === tenantId);
  if (auth.contextLoading) return <main id="main-content" className="admin-page cp-admin-container"><AccountTabs /><p role="status">Loading the workspace…</p></main>;
  if (!workspace) return <Navigate to="/account/workspaces" replace />;
  return <WorkspaceForm key={workspace.tenant_id} workspace={workspace} />;
}

function WorkspaceForm({ workspace }: { workspace: Workspace }) {
  const auth = useAuth();
  const client = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState(workspace.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const userId = auth.session?.user.id ?? '';
  const environments = useQuery({
    queryKey: ['account', 'environments', userId, workspace.tenant_id],
    queryFn: ({ signal }) => httpClient<{ items: EnvironmentRecord[] }>(`/v1/workspaces/${workspace.tenant_id}/environments`, { signal }),
  });
  const items = [...(environments.data?.items ?? [])].sort((a, b) => a.name.localeCompare(b.name)).reverse();
  const issuers = useQueries({
    queries: items.map(environment => ({
      queryKey: ['account', 'issuer', userId, workspace.tenant_id, environment.id],
      queryFn: ({ signal }: { signal: AbortSignal }) => agentClientApi.authorizationServer({ userId, tenantId: workspace.tenant_id, environmentId: environment.id }, signal),
    })),
  });
  const back = () => navigate('/account/workspaces');
  const open = (environmentId: string) => { if (auth.openWorkspace(workspace, environmentId)) navigate('/'); };
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await accountApi.renameWorkspace(workspace.tenant_id, name.trim());
      await auth.refreshWorkspaces();
      void client.invalidateQueries({ queryKey: previewKey });
      back();
    } catch (e) {
      setError(e instanceof HttpError && e.status === 403 ? 'Only an admin of this workspace can rename it.' : e instanceof HttpError && e.status === 400 ? 'Use a name of 1 to 100 characters.' : 'The name could not be saved. Try again.');
      setBusy(false);
    }
  }
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
      <form className="account-form" onSubmit={event => void save(event)}>
        <section className="account-section" aria-labelledby="account-name-title">
          <h2 id="account-name-title">Name</h2>
          <p className="cp-admin-muted">The name that people see in the Admin and on the login pages.</p>
          <label className="cp-admin-field account-name-field">Workspace name<input className="cp-admin-input" value={name} required maxLength={100} disabled={busy} onChange={event => setName(event.target.value)} /></label>
          <small className="cp-admin-muted">Up to 100 characters. Workspace ID <span className="account-mono">{workspace.tenant_id}</span></small>
          {error ? <p role="alert" className="cp-admin-notice cp-admin-notice--danger">{error}</p> : null}
        </section>
        <section className="account-section" aria-labelledby="account-environments-title">
          <h2 id="account-environments-title">Environments</h2>
          <p className="cp-admin-muted">Every workspace has these two environments. Nothing is shared between them.</p>
          {environments.isPending ? <p role="status">Loading environments…</p>
            : environments.isError ? <div className="cp-admin-notice" role="alert">Could not load the environments. <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => void environments.refetch()}>Retry</button></div>
              : <div className="cp-admin-table-scroll" role="region" aria-label="Environments" tabIndex={0}>
                <table className="cp-admin-table account-table">
                  <thead><tr><th scope="col">Environment</th><th scope="col">Authorization server issuer</th><th scope="col">Actions</th></tr></thead>
                  <tbody>{items.map((environment, i) => (
                    <tr key={environment.id}>
                      <td><div className="account-name"><span><strong>{environmentLabel(environment.name)}</strong><small>{environment.id}</small></span></div></td>
                      <td><span className="account-mono">{issuers[i]?.data?.issuer ?? (issuers[i]?.isError ? 'Could not load the issuer' : 'Loading…')}</span></td>
                      <td><div className="account-row-actions"><button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => open(environment.id)}>Open Admin</button></div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>}
        </section>
        <div className="account-actions">
          <button type="submit" className="cp-admin-button" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
          <span>
            <button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={busy} onClick={back}>Cancel</button>
            <button type="button" className="cp-admin-button cp-admin-button--danger-soft" disabled={busy} onClick={() => setDeleting(true)}>Delete workspace</button>
          </span>
        </div>
      </form>
      {deleting ? <DeleteWorkspaceDialog workspace={workspace} onClose={() => setDeleting(false)} onDeleted={() => { void auth.refreshWorkspaces(); void client.invalidateQueries({ queryKey: previewKey }); back(); }} /> : null}
    </main>
  );
}
