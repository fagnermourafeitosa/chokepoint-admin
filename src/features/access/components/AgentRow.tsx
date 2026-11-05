import { ChevronRight } from 'lucide-react';
import { AgentVisual } from './AgentVisual';
import { ReportOnlyChip, ReviewOverdueChip, reviewOverdue } from '../../../components/report-only/ReportOnlyChip';
import type { AgentRecord, AgentScope } from '../agent-api';

type AgentRowProps = { agent: AgentRecord; scope: AgentScope; selected: boolean; onSelect: (id: string) => void };
export function AgentRow({ agent, scope, selected, onSelect }: AgentRowProps) {
  return <li><button className="access-agent-row" type="button" aria-label={agent.name} aria-describedby={`agent-description-${agent.id}`} aria-pressed={selected} onClick={() => onSelect(agent.id)}>
    <AgentVisual agent={agent} scope={scope} />
    <span className="access-agent-row-copy"><strong>{agent.name}</strong><small id={`agent-description-${agent.id}`}>{agent.description}</small>{agent.enforcement === 'report_only' ? <span className="report-only-tags"><ReportOnlyChip />{reviewOverdue(agent.review_by) ? <ReviewOverdueChip /> : null}</span> : null}</span>
    {selected ? <ChevronRight size={15} aria-hidden="true" /> : null}
  </button></li>;
}
