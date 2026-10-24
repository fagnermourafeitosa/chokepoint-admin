import './agent-list.css';
import { Bot, Search } from 'lucide-react';
import { EmptyState } from '../../../components/ui/empty-state/EmptyState';
import { AgentRow } from './AgentRow';
import type { AgentSummary } from '../types';

type AgentListProps = {
  agents: readonly AgentSummary[];
  total: number;
  search: string;
  onSearch: (value: string) => void;
  selectedId?: string;
  onSelect: (id: string) => void;
};

export function AgentList({
  agents,
  total,
  search,
  onSearch,
  selectedId,
  onSelect,
}: AgentListProps) {
  return (
    <aside className="cp-admin-panel access-agent-rail" aria-label="Agents">
      <div className="access-agent-rail-heading">
        <span>Agents</span>
        <span className="access-agent-count" aria-label={`${total} agents`}>
          {total}
        </span>
      </div>
      <div className="access-agent-search">
        <Search size={16} aria-hidden="true" />
        <input
          className="cp-admin-input"
          type="search"
          aria-label="Find agent"
          placeholder="Find an agent…"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
      </div>
      <ul className="access-agent-list" aria-label="Agents">
        {agents.map((agent) => (
          <AgentRow
            key={agent.id}
            agent={agent}
            selected={selectedId === agent.id}
            onSelect={onSelect}
          />
        ))}
      </ul>
      {!agents.length ? (
        <EmptyState icon={Bot} title={total ? 'No matching agents' : 'No agents yet'} />
      ) : null}
    </aside>
  );
}
