import './agent-list.css';
import { Bot, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { EmptyState } from '../../../components/ui/empty-state/EmptyState';
import { AgentRow } from './AgentRow';
import type { AgentRecord, AgentScope } from '../agent-api';

type AgentListProps = {
  agents: readonly AgentRecord[];
  scope: AgentScope;
  total: number;
  search: string;
  onSearch: (value: string) => void;
  selectedId?: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
};

export function AgentList({
  agents,
  scope,
  total,
  search,
  onSearch,
  selectedId,
  onSelect,
  collapsed,
  onToggle,
}: AgentListProps) {
  return (
    // The collapse button sits on the gap between the list and the content (Admin 048).
    <div className="access-rail-wrap">
      <button type="button" className="access-rail-toggle access-rail-toggle--gap" aria-expanded={!collapsed} aria-label={collapsed ? 'Expand agent list' : 'Collapse agent list'} title={collapsed ? 'Expand' : 'Collapse'} onClick={onToggle}>
        {collapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}
      </button>
    <aside className="cp-admin-panel access-agent-rail" aria-label="Agents" data-collapsed={collapsed}>
      <div className="access-agent-rail-heading">
        <span className="access-agent-rail-label">Agents</span>
        <span className="access-agent-count" aria-label={`${total} agents`}>
          {total}
        </span>
      </div>
      <div className="access-agent-search" hidden={collapsed}>
        <Search size={16} aria-hidden="true" />
        <input
          className="cp-admin-input"
          type="search"
          aria-label="Filter loaded agents"
          placeholder="Filter loaded agents…"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
      </div>
      <ul className="access-agent-list" aria-label="Agents">
        {agents.map((agent) => (
          <AgentRow
            key={agent.id}
            agent={agent}
            scope={scope}
            selected={selectedId === agent.id}
            onSelect={onSelect}
          />
        ))}
      </ul>
      {!agents.length ? (
        <EmptyState icon={Bot} title={total ? 'No matching agents' : 'No agents yet'} />
      ) : null}
    </aside>
    </div>
  );
}
