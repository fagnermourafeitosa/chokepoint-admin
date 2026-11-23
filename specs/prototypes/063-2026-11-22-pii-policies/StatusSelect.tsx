import { Check, ChevronDown } from 'lucide-react';
import { Dropdown } from '../../../src/components/ui/dropdown/Dropdown';

export type StatusOption = { value: string; label: string; on: boolean };

// A dot with no border in the success or danger color of the design system: green when the PII
// filter is on, red when it is off. The color is never alone: the dot carries its text for readers.
export function StatusDot({ on }: { on: boolean }) {
  return <span className="pii-dot" data-on={on ? 'true' : 'false'} role="img" aria-label={on ? 'PII filter on' : 'PII filter off'} title={on ? 'PII filter on' : 'PII filter off'} />;
}

// Admin 063 prototype: SelectMenu (src/components/ui/dropdown/SelectMenu.tsx) with the PII filter
// dot before each option and before the chosen one. The implementation adds an optional status to
// the options of SelectMenu instead of this copy.
export function StatusSelect({ label, value, options, onChange }: { label: string; value: string; options: StatusOption[]; onChange: (value: string) => void }) {
  const current = options.find(o => o.value === value) ?? options[0];
  return <span className="admin-select-field admin-select-field--block">
    <Dropdown label={`${label}: ${current.label}, PII filter ${current.on ? 'on' : 'off'}`} triggerClassName="admin-select"
      trigger={<><span className="pii-option"><StatusDot on={current.on} />{current.label}</span><ChevronDown size={14} aria-hidden="true" /></>}>
      {options.map(option => <button key={option.value} type="button" className="admin-dropdown-option" aria-pressed={option.value === value} onClick={() => onChange(option.value)}>
        <span className="pii-option"><StatusDot on={option.on} />{option.label}</span>
        {option.value === value ? <Check size={15} aria-hidden="true" /> : null}
      </button>)}
    </Dropdown>
  </span>;
}
