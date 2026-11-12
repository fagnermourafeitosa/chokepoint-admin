import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Building2, Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { TracePager } from '../investigate/TraceUI';
import '../investigate/investigate.css';
import { useAuth, type Workspace } from '../auth/AuthContext';
import { AccountTabs } from './AccountLayout';
import { CreateWorkspaceDialog, DeleteWorkspaceDialog } from './dialogs';
import { previewKey } from './api';

const pageSize = 20;
export const createdDate = (value?: string) => (value ? value.slice(0, 10) : '—');

// Admin 051, items 6 to 9: the workspaces of the signed-in person.
export function WorkspacesPage() {
  const auth = useAuth();
  const client = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Workspace | null>(null);
  const rows = auth.workspaces.slice((page - 1) * pageSize, page * pageSize);
  const open = (workspace: Workspace) => { if (auth.openWorkspace(workspace)) navigate('/'); };
  const changed = async () => {
    await auth.refreshWorkspaces();
    void client.invalidateQueries({ queryKey: previewKey });
  };
  return (
    <main id="main-content" className="admin-page cp-admin-container" aria-label="Workspaces" tabIndex={-1}>
      <AccountTabs />
      <header className="access-page-heading">
        <div>
          <h1 className="cp-admin-title">Workspaces</h1>
          <p className="cp-admin-muted">The workspaces you belong to. Each one has a Sandbox and a Production environment.</p>
        </div>
        <button type="button" className="cp-admin-button" onClick={() => setCreating(true)}><Plus size={16} />Create workspace</button>
      </header>
      {auth.contextLoading ? <p role="status">Loading workspaces…</p>
        : auth.contextFailed ? <div className="cp-admin-notice" role="alert">Could not load your workspaces. <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={auth.retry}>Retry</button></div>
          : rows.length === 0 ? <p className="cp-admin-muted">You do not belong to a workspace yet. Create one to start.</p>
            : <div className="cp-admin-table-scroll" role="region" aria-label="Workspaces" tabIndex={0}>
              <table className="cp-admin-table account-table">
                <thead><tr><th scope="col">Workspace</th><th scope="col">Environments</th><th scope="col">Your role</th><th scope="col">Created</th><th scope="col">Actions</th></tr></thead>
                <tbody>{rows.map(workspace => (
                  <tr key={workspace.tenant_id}>
                    <td><div className="account-name"><Building2 size={22} aria-hidden="true" /><span><strong>{workspace.name}</strong><small>{workspace.tenant_id}</small></span></div></td>
                    <td><div className="account-badges"><span className="mcp-badge">Sandbox</span><span className="mcp-badge">Production</span></div></td>
                    <td><span className="mcp-badge">Admin</span></td>
                    <td>{createdDate(workspace.created_at)}</td>
                    <td><div className="account-row-actions">
                      <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => open(workspace)}>Open Admin</button>
                      <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => navigate(`/account/workspaces/${workspace.tenant_id}`)}>Edit</button>
                      <button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" onClick={() => setDeleting(workspace)}>Delete</button>
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>}
      <TracePager page={page} size={pageSize} total={auth.workspaces.length} onPage={setPage} />
      {/* Admin 052: the first workspace opens in the Admin, where the tour of its Sandbox starts. */}
      {creating ? <CreateWorkspaceDialog first={auth.workspaces.length === 0} onClose={() => setCreating(false)} onCreated={workspace => {
        const first = auth.workspaces.length === 0;
        setCreating(false);
        void changed().then(() => { if (first) open(workspace); });
      }} /> : null}
      {deleting ? <DeleteWorkspaceDialog workspace={deleting} onClose={() => setDeleting(null)} onDeleted={() => { setDeleting(null); void changed(); }} /> : null}
    </main>
  );
}
