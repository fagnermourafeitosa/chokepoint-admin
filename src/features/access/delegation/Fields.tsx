import { CircleHelp } from 'lucide-react';
import { Tooltip } from '../../../components/ui/tooltip/Tooltip';
import type { SubjectKind } from './model';

const kindHelp = 'People are employees who sign in to the identity provider and use an agent. Services are service accounts: a system that runs the agent by itself with its own token, for example a Keycloak client with a service account or a Google service account.';

// Which subjects of an identity provider are included: people, services or both.
export function IncludesField({ value, onChange }: { value: SubjectKind[]; onChange: (v: SubjectKind[]) => void }) {
  const toggle = (k: SubjectKind) => onChange(value.includes(k) ? value.filter(x => x !== k) : [...value, k]);
  return <div className="relation-field"><span className="relation-label">Includes<Tooltip content={kindHelp}><CircleHelp size={14} aria-label="About people and services" /></Tooltip></span>
    <div className="relation-choice">
      <label><input type="checkbox" checked={value.includes('person')} onChange={() => toggle('person')} /><span><strong>People</strong><small>Employees who sign in and use an agent, for example in their editor.</small></span></label>
      <label><input type="checkbox" checked={value.includes('service')} onChange={() => toggle('service')} /><span><strong>Services</strong><small>Service accounts. A system runs the agent by itself with its own token, for example a release pipeline.</small></span></label>
    </div>
  </div>;
}
