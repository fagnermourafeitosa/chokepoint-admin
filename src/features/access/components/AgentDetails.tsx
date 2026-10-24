import './agent-details.css';
import { Layers, Search, Users } from 'lucide-react';
import { EmptyState } from '../../../components/ui/empty-state/EmptyState';
import { useAgentDetails } from '../hooks/useAgentDetails';
import { AgentPeople } from './AgentPeople';
import { ToolGroup } from './ToolGroup';
import type { AgentSummary } from '../types';

type AgentDetailsProps = {
  agent: AgentSummary;
  onToggleTool: (id: string) => void;
};

export function AgentDetails({ agent, onToggleTool }: AgentDetailsProps) {
  const details = useAgentDetails(agent);
  return (
    <section className="cp-admin-panel access-agent-details" aria-label="Selected agent">
      <div className="access-agent-heading">
        <div>
          <div className="access-agent-title">
            <h2>{agent.name}</h2>
            <span className="access-status" data-status={agent.status}>
              {agent.status}
            </span>
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
      </div>
      <div className="access-detail-tabs" role="group" aria-label="Agent details">
        <button
          type="button"
          aria-pressed={details.tab === 'tools'}
          onClick={() => details.setTab('tools')}
        >
          Tools <span>{agent.tools.length}</span>
        </button>
        <button
          type="button"
          aria-pressed={details.tab === 'people'}
          onClick={() => details.setTab('people')}
        >
          People <span>{agent.people.length}</span>
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
                <ToolGroup key={group.server} {...group} onToggle={onToggleTool} />
              ))
            ) : (
              <EmptyState
                icon={Layers}
                title={agent.tools.length ? 'No matching tools' : 'No tools associated'}
              />
            )}
          </>
        ) : (
          <AgentPeople people={agent.people} />
        )}
      </div>
    </section>
  );
}
