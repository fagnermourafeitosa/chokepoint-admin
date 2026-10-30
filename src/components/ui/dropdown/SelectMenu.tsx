import { Check, ChevronDown } from 'lucide-react';
import { Dropdown } from './Dropdown';

export type SelectOption = { value: string; label: string };

type SelectMenuProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  group?: string;
};

// A filter choice with the same trigger and option panel as the header selectors.
export function SelectMenu({ label, value, options, onChange, group }: SelectMenuProps) {
  const current = options.find((o) => o.value === value)?.label ?? value;
  return (
    <Dropdown
      group={group}
      label={`${label}: ${current}`}
      triggerClassName="admin-select"
      trigger={
        <>
          <span>{current}</span>
          <ChevronDown size={14} aria-hidden="true" />
        </>
      }
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="admin-dropdown-option"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          <span>{option.label}</span>
          {option.value === value ? <Check size={15} aria-hidden="true" /> : null}
        </button>
      ))}
    </Dropdown>
  );
}
