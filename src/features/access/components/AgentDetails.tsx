import './agent-details.css';
import { Layers, Search, Users, Pencil, Trash2 } from 'lucide-react';
import { EmptyState } from '../../../components/ui/empty-state/EmptyState';
import { useAgentDetails } from '../hooks/useAgentDetails';
import { AgentPeople } from './AgentPeople';
import { ToolGroup } from './ToolGroup';
import type { ToolSummary, PersonSummary } from '../types';
import type { AgentRecord, AgentScope } from '../agent-api';
import { AgentVisual } from './AgentVisual';

type AgentDetailsProps = {
  agent: AgentRecord;
  scope: AgentScope;
  onEdit: () => void;
  onDelete: () => void;
};

export function AgentDetails({ agent, scope, onEdit, onDelete }: AgentDetailsProps) {
  const tools: readonly ToolSummary[] = [];
  const people: readonly PersonSummary[] = [];
  const details = useAgentDetails({ tools, people });
  return (
    <section className="cp-admin-panel access-agent-details" aria-label="Selected agent">
      <div className="access-agent-heading">
        <AgentVisual agent={agent} scope={scope} />
        <div className="agent-detail-copy">
          <div className="access-agent-title">
            <h2>{agent.name}</h2>
          </div>
          <p>{agent.description}</p>
          <div className="access-agent-meta">
            <span>
              <Users size={14} aria-hidden="true" />
              {details.assignedPeople} people
            </span>
            <span>
              <Layers size={14} aria-hidden="true" />
              {details.enabledTools} tools
            </span>
          </div>
        </div>
        <div className="agent-detail-actions">
          <button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" type="button" onClick={onEdit}><Pencil size={15} aria-hidden="true" />Edit</button>
          <button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" type="button" onClick={onDelete}><Trash2 size={15} aria-hidden="true" />Delete</button>
        </div>
      </div>
      <div className="access-detail-tabs" role="group" aria-label="Agent details">
        <button
          type="button"
          aria-pressed={details.tab === 'tools'}
          onClick={() => details.setTab('tools')}
        >
          Tools <span>{tools.length}</span>
        </button>
        <button
          type="button"
          aria-pressed={details.tab === 'people'}
          onClick={() => details.setTab('people')}
        >
          People <span>{people.length}</span>
        </button>
      </div>
      <div className="access-detail-content">
        {details.tab === 'tools' ? (
          <>
            <h3>What can this agent do?</h3>
            <p className="cp-admin-muted">Tools available through connected MCP servers.</p>
            <div className="access-tool-search">
              <Search size={16} aria-hidden="true" />
              <input
                className="cp-admin-input"
                type="search"
                aria-label="Find tool"
                placeholder="Search across every tool…"
                value={details.search}
                onChange={(event) => details.setSearch(event.target.value)}
              />
            </div>
            {details.groups.length ? (
              details.groups.map((group) => (
                <ToolGroup key={group.server} {...group} onToggle={() => {}} />
              ))
            ) : (
              <EmptyState
                icon={Layers}
                title={tools.length ? 'No matching tools' : 'No tools associated'}
              />
            )}
          </>
        ) : (
          <AgentPeople people={people} />
        )}
      </div>
    </section>
  );
}
