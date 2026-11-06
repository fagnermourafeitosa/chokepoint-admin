import { Settings2, User, Wrench } from 'lucide-react';
import { Tooltip } from '../../../src/components/ui/tooltip/Tooltip';
import type { Doc } from '../../../src/features/access/delegation/model';
import { sameSelection, type Adding, type Selection } from '../../../src/features/access/delegation/layout';

// Admin 048: the section bar without Allowed values. The allowed values of a tool are set
// from the agent · tool edge, where the tool is already chosen.
// Who can delegate and Servers and tools show only the icon and the count; the label is the tooltip.
// Who can delegate: the icon counts the subjects that delegate; the button counts the identity providers.
const sections: { what: Adding; label: string; compact?: boolean; add?: string; addCount?: (d: Doc) => number; Icon: typeof User; count: (d: Doc) => number }[] = [
  { what: 'delegator', label: 'Subjects who delegate', compact: true, add: 'Manage identity providers', addCount: d => d.scopes.length, Icon: User, count: d => d.delegations.length },
  { what: 'tool', label: 'Servers and tools', compact: true, add: 'Manage tools', Icon: Wrench, count: d => d.capabilities.length },
];

export function SectionBar({ doc, selected, onSelect, readOnly }: { doc: Doc; selected?: Selection; onSelect: (s: Selection) => void; readOnly: boolean }) {
  return <div className="delegation-sections" role="group" aria-label="Agent sections">
    {sections.map(({ what, label, compact, add, addCount, Icon, count }) => <div key={what} className="delegation-section">
      {compact ? <Tooltip content={label}><span className="proto-section-count" aria-label={`${label}: ${count(doc)}`}><Icon size={16} aria-hidden="true" /><strong>{count(doc)}</strong></span></Tooltip>
        : <><Icon size={16} aria-hidden="true" /><span>{label}</span><strong>{count(doc)}</strong></>}
      {readOnly || !add ? null : (() => {
        // Who can delegate opens the panel of the identity provider when the agent has one; Manage tools opens the tool list.
        const target: Selection = what === 'delegator' && doc.scopes.length === 1 ? { type: 'idp', issuer: doc.scopes[0].issuer } : { type: 'add', what };
        return <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" aria-pressed={sameSelection(selected, target)} onClick={() => onSelect(target)}><Settings2 size={14} aria-hidden="true" />{add}{addCount ? <span className="proto-button-count" aria-label={`${addCount(doc)} identity providers`}>{addCount(doc)}</span> : null}</button>;
      })()}
    </div>)}
  </div>;
}
