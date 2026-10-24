import { Bot } from 'lucide-react';
import { EmptyState } from '../../../components/ui/empty-state/EmptyState';
import { AccessActions } from '../components/AccessActions';
import { AgentList } from '../components/AgentList';
import { AgentDetails } from '../components/AgentDetails';
import { NewAgentDialog } from '../components/NewAgentDialog';
import { ReviewChangesDialog } from '../components/ReviewChangesDialog';
import { useAgentWorkbench } from '../hooks/useAgentWorkbench';

export function PermissionsPage() {
  const workbench = useAgentWorkbench();
  return (
    <section aria-label="Permissions">
      <div className="access-page-heading">
        <div>
          <span className="cp-admin-label">ACCESS WORKBENCH</span>
          <h1 className="cp-admin-title">Configure. Teste. Publique.</h1>
        </div>
        <AccessActions
          onNewAgent={workbench.openNewAgent}
          onReview={workbench.openReview}
          changeCount={workbench.changes.length}
        />
      </div>
      <div className="access-workbench">
        <AgentList
          agents={workbench.visibleAgents}
          total={workbench.agents.length}
          search={workbench.search}
          onSearch={workbench.setSearch}
          selectedId={workbench.selectedAgent?.id}
          onSelect={workbench.selectAgent}
        />
        {workbench.selectedAgent ? (
          <AgentDetails
            key={workbench.selectedAgent.id}
            agent={workbench.selectedAgent}
            onToggleTool={workbench.toggleSelectedTool}
          />
        ) : (
          <section
            className="cp-admin-panel access-agent-details access-agent-details--empty"
            aria-label="Selected agent"
          >
            <EmptyState
              icon={Bot}
              title="No agents available"
              description="Agent details will appear here."
            />
          </section>
        )}
      </div>
      {workbench.dialog === 'new-agent' ? (
        <NewAgentDialog onClose={workbench.closeDialog} onCreate={workbench.createAgent} />
      ) : null}
      {workbench.dialog === 'review' ? (
        <ReviewChangesDialog
          changes={workbench.changes}
          onClose={workbench.closeDialog}
          onApply={workbench.applyPreview}
        />
      ) : null}
    </section>
  );
}
