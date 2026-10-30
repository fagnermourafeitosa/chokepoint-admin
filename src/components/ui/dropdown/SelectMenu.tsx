import { Check, ChevronDown } from 'lucide-react';
import { Dropdown } from './Dropdown';

export type SelectOption = { value: string; label: string; disabled?: boolean };

type SelectMenuProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  group?: string;
  disabled?: boolean;
  // Required keeps native form validation through a hidden constraint field.
  required?: boolean;
  // Block fills its field, as form controls do.
  block?: boolean;
  triggerClassName?: string;
};

// The admin's only select: the header selectors' outlined trigger and option panel.
// Native selects are not used because their platform chrome ignores the design system.
export function SelectMenu({
  label,
  value,
  options,
  onChange,
  group,
  disabled = false,
  required = false,
  block = false,
  triggerClassName,
}: SelectMenuProps) {
  const current = options.find((o) => o.value === value)?.label ?? value;
  return (
    <span className={`admin-select-field${block ? ' admin-select-field--block' : ''}`}>
      <Dropdown
        group={group}
        disabled={disabled}
        label={`${label}: ${current}`}
        triggerClassName={`admin-select${triggerClassName ? ` ${triggerClassName}` : ''}`}
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
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
          >
            <span>{option.label}</span>
            {option.value === value ? <Check size={15} aria-hidden="true" /> : null}
          </button>
        ))}
      </Dropdown>
      {required ? (
        <input
          className="admin-select-constraint"
          tabIndex={-1}
          aria-hidden="true"
          required
          disabled={disabled}
          value={value}
          onChange={() => undefined}
        />
      ) : null}
    </span>
  );
}
