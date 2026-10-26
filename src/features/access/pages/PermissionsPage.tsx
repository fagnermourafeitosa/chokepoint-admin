import { Bot } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { EmptyState } from '../../../components/ui/empty-state/EmptyState';
import { Dialog } from '../../../components/ui/dialog/Dialog';
import { AgentList } from '../components/AgentList';
import { AgentDetails } from '../components/AgentDetails';
import { NewAgentDialog } from '../components/NewAgentDialog';
import { useAgentWorkbench } from '../hooks/useAgentWorkbench';
import type { AgentScope } from '../agent-api';

export function PermissionsPage() {
  const auth = useAuth();
  if (!auth.session || !auth.workspace || !auth.environment) return <p role="status">Select a workspace and environment.</p>;
  const scope = { userId: auth.session.user.id, tenantId: auth.workspace.tenant_id, environmentId: auth.environment.id };
  return <AgentWorkbench key={`${scope.userId}:${scope.tenantId}:${scope.environmentId}`} scope={scope} />;
}
function AgentWorkbench({ scope }: { scope: AgentScope }) {
  const workbench = useAgentWorkbench(scope);
  return <section aria-label="Permissions">
    <div className="access-page-heading">
      <div><span className="cp-admin-label">ACCESS WORKBENCH</span><h1 className="cp-admin-title">Configure user permissions</h1><p className="cp-admin-muted">Associate users with permission groups, grant server/tool access and apply fine-grained policies.</p></div>
      <button className="cp-admin-button" onClick={() => workbench.setDialog('new-agent')}>New agent</button>
    </div>
    {workbench.isPending ? <p role="status" className="agent-inline-status">Loading agents…</p> : workbench.isError ? <div className="agent-inline-status" role="alert">Could not load agents in this environment. <button className="cp-admin-button cp-admin-button--ghost" onClick={() => void workbench.refetch()}>Retry</button></div> : <div className="access-workbench">
      <div>
        <AgentList agents={workbench.visibleAgents} scope={scope} total={workbench.agents.length} search={workbench.search} onSearch={workbench.setSearch} selectedId={workbench.selectedAgent?.id} onSelect={workbench.selectAgent} />
        {workbench.hasNextPage ? <div className="agent-pagination"><button className="cp-admin-button cp-admin-button--secondary" disabled={workbench.isFetchingNextPage} onClick={() => void workbench.fetchNextPage()}>{workbench.isFetchingNextPage ? 'Loading…' : 'Load more agents'}</button></div> : null}
      </div>
      {workbench.selectedAgent ? <AgentDetails agent={workbench.selectedAgent} scope={scope} onEdit={() => workbench.setDialog('edit-agent')} onDelete={() => workbench.setDialog('delete-agent')} /> : <section className="cp-admin-panel access-agent-details access-agent-details--empty" aria-label="Selected agent">
        {workbench.details.isError ? <div role="alert">Agent details are unavailable. <button className="cp-admin-button cp-admin-button--ghost" onClick={() => void workbench.details.refetch()}>Retry</button></div> : workbench.agents.length ? <p role="status">Loading agent…</p> : <EmptyState icon={Bot} title="No agents available" description="Agent details will appear here." />}
      </section>}
    </div>}
    {workbench.isFetchNextPageError ? <p role="alert">Could not load the next page. Use Load more agents to retry.</p> : null}
    {workbench.dialog === 'new-agent' || workbench.dialog === 'edit-agent' && workbench.selectedAgent ? <NewAgentDialog key={workbench.dialog === 'new-agent' ? 'new' : workbench.selectedAgent!.id} scope={scope} agent={workbench.dialog === 'edit-agent' ? workbench.selectedAgent : undefined} onClose={() => workbench.setDialog(null)} onPersisted={workbench.persisted} onSaved={workbench.saved} /> : null}
    {workbench.dialog === 'delete-agent' && workbench.selectedAgent ? <Dialog title="Delete agent" onClose={() => { if (!workbench.deleting) workbench.setDialog(null); }}>
      <div className="admin-dialog-body"><p>Delete “{workbench.selectedAgent.name}”? This permanently removes the grouping, its image, user associations, published permissions and saved permission draft.</p>{workbench.error ? <p role="alert">{workbench.error}</p> : null}</div>
      <div className="admin-dialog-actions"><button className="cp-admin-button cp-admin-button--secondary" disabled={workbench.deleting} onClick={() => workbench.setDialog(null)}>Cancel</button><button className="cp-admin-button cp-admin-button--danger" disabled={workbench.deleting} onClick={() => void workbench.remove()}>{workbench.deleting ? 'Deleting…' : 'Delete agent'}</button></div>
    </Dialog> : null}
  </section>;
}
