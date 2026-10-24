import './lists.css';
import { Users } from 'lucide-react';
import { EmptyState } from '../../../components/ui/empty-state/EmptyState';
import type { PersonSummary } from '../types';

export function AgentPeople({ people }: { people: readonly PersonSummary[] }) {
  if (!people.length) return <EmptyState icon={Users} title="No people associated" />;
  return (
    <ul className="access-people-list">
      {people.map((person) => (
        <li key={person.id}>
          <div>
            <strong>{person.name}</strong>
            <small>{person.email}</small>
          </div>
          <span>{person.assigned ? 'Assigned' : 'Not assigned'}</span>
        </li>
      ))}
    </ul>
  );
}
