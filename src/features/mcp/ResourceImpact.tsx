import { TriangleAlert } from 'lucide-react';
import type { ResourceAgent, ResourceMap } from './resource-api';

// The agents with values of the active resource type, before a change or a removal (Admin 027 section 2.5).
export function ResourceImpact({ active, next, agents, error }: { active?: ResourceMap; next?: ResourceMap; agents: ResourceAgent[]; error: boolean }) {
  if (!active || next?.type === active.type) return null;
  if (error) return <p className="resource-warning" role="alert"><TriangleAlert size={14} aria-hidden="true" />Could not load the agents with values of {active.type}. Check them before you approve.</p>;
  if (!agents.length) return null;
  const names = agents.map(a => `${a.name} (${a.values} ${a.values === 1 ? 'value' : 'values'})`).join(', ');
  return <p className="resource-warning"><TriangleAlert size={14} aria-hidden="true" />{agents.length === 1 ? '1 agent has' : `${agents.length} agents have`} values of {active.type}: {names}. {next ? 'Those values do not apply to this tool after the change.' : 'After the removal, this tool has no resource check for those agents.'}</p>;
}
