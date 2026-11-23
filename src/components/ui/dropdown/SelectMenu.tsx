import { Check, ChevronDown } from 'lucide-react';
import { Dropdown } from './Dropdown';

// status adds the PII filter dot before the option (Admin 063, item 14): green on, red off, with its text for readers.
export type SelectOption = { value: string; label: string; disabled?: boolean; status?: { on: boolean; label: string } };

function StatusDot({ status }: { status: { on: boolean; label: string } }) {
  return <span className="cp-admin-status-dot" data-on={status.on ? 'true' : 'false'} role="img" aria-label={status.label} title={status.label} />;
}

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
  const chosen = options.find((o) => o.value === value);
  const current = chosen?.label ?? value;
  return (
    <span className={`admin-select-field${block ? ' admin-select-field--block' : ''}`}>
      <Dropdown
        group={group}
        disabled={disabled}
        label={`${label}: ${current}${chosen?.status ? `, ${chosen.status.label}` : ''}`}
        triggerClassName={`admin-select${triggerClassName ? ` ${triggerClassName}` : ''}`}
        trigger={
          <>
            <span className={chosen?.status ? 'admin-select-status' : undefined}>{chosen?.status ? <StatusDot status={chosen.status} /> : null}{current}</span>
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
            <span className={option.status ? 'admin-select-status' : undefined}>{option.status ? <StatusDot status={option.status} /> : null}{option.label}</span>
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
