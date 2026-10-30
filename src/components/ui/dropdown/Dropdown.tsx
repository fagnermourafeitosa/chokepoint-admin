import type { ReactNode } from 'react';
import { useDropdown } from './useDropdown';
import './dropdown.css';

type DropdownProps = {
  label: string;
  trigger: ReactNode;
  triggerClassName: string;
  children: ReactNode;
  group?: string;
  disabled?: boolean;
};

export function Dropdown({ label, trigger, triggerClassName, children, group, disabled = false }: DropdownProps) {
  const { disclosure, closeOnSelection } = useDropdown();
  return (
    <details
      ref={disclosure}
      name={group}
      className="cp-admin-disclosure admin-dropdown"
      onKeyDown={(event) => {
        // Escape closes only the open menu, not a dialog that contains it.
        if (event.key === 'Escape' && disclosure.current?.open) {
          event.preventDefault();
          event.stopPropagation();
          disclosure.current.removeAttribute('open');
          disclosure.current.querySelector('summary')?.focus();
        }
      }}
    >
      <summary
        className={triggerClassName}
        aria-label={label}
        aria-disabled={disabled || undefined}
        onClick={(event) => {
          // A disabled trigger keeps its focus and name but never opens.
          if (disabled) event.preventDefault();
        }}
      >
        {trigger}
      </summary>
      <div className="cp-admin-disclosure-panel admin-dropdown-panel" onClick={closeOnSelection}>
        {children}
      </div>
    </details>
  );
}
