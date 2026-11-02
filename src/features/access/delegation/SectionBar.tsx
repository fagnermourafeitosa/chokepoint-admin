import { Database, Plus, User, Wrench } from 'lucide-react';
import type { Doc } from './model';
import { sameSelection, type Adding, type Selection } from './layout';

const sections: { what: Adding; label: string; add: string; Icon: typeof User; count: (d: Doc) => number }[] = [
  { what: 'delegator', label: 'Who can delegate', add: 'Add identity provider', Icon: User, count: d => d.scopes.length },
  { what: 'tool', label: 'Servers and tools', add: 'Add tools', Icon: Wrench, count: d => d.capabilities.length },
  { what: 'resource', label: 'Resources', add: 'Add resource', Icon: Database, count: d => d.resources.length },
];

// The sections of the agent, with their add actions. Shared by the graph and the list.
export function SectionBar({ doc, selected, onSelect, readOnly }: { doc: Doc; selected?: Selection; onSelect: (s: Selection) => void; readOnly: boolean }) {
  return <div className="delegation-sections" role="group" aria-label="Agent sections">
    {sections.map(({ what, label, add, Icon, count }) => <div key={what} className="delegation-section">
      <Icon size={16} aria-hidden="true" /><span>{label}</span><strong>{count(doc)}</strong>
      {readOnly ? null : <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" aria-pressed={sameSelection(selected, { type: 'add', what })} onClick={() => onSelect({ type: 'add', what })}><Plus size={14} aria-hidden="true" />{add}</button>}
    </div>)}
  </div>;
}
