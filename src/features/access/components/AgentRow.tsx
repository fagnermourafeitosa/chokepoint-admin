import { ChevronRight } from 'lucide-react';
import type { AgentSummary } from '../types';

type AgentRowProps = { agent: AgentSummary; selected: boolean; onSelect: (id: string) => void };

export function AgentRow({ agent, selected, onSelect }: AgentRowProps) {
  return (
    <li>
      <button
        className="access-agent-row"
        type="button"
        aria-label={agent.name}
        aria-describedby={`agent-description-${agent.id}`}
        aria-pressed={selected}
        onClick={() => onSelect(agent.id)}
      >
        <span className="access-agent-row-copy">
          <strong>{agent.name}</strong>
          <small id={`agent-description-${agent.id}`}>{agent.description}</small>
        </span>
        {selected ? <ChevronRight size={15} aria-hidden="true" /> : null}
      </button>
    </li>
  );
}
