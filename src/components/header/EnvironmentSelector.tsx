import type { Environment } from '../../app/context/AdminEnvironmentContext';
import { Check, ChevronDown } from 'lucide-react';
import { Dropdown } from '../ui/dropdown/Dropdown';

const environments = ['Sandbox', 'Production'] as const;

type EnvironmentSelectorProps = {
  value: Environment;
  onChange: (environment: Environment) => void;
};

export function EnvironmentSelector({ value, onChange }: EnvironmentSelectorProps) {
  return (
    <Dropdown
      group="admin-header"
      label={`Select environment: ${value}`}
      triggerClassName="admin-environment"
      trigger={
        <>
          <span className="cp-admin-status-dot" aria-hidden="true" />
          {value}
          <ChevronDown size={14} aria-hidden="true" />
        </>
      }
    >
      {environments.map((option) => (
        <button
          key={option}
          type="button"
          className="admin-dropdown-option"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          <span>{option}</span>
          {value === option ? <Check size={15} aria-hidden="true" /> : null}
        </button>
      ))}
    </Dropdown>
  );
}
