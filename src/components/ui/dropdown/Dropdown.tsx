import type { ReactNode } from 'react';
import { useDropdown } from './useDropdown';
import './dropdown.css';

type DropdownProps = {
  label: string;
  trigger: ReactNode;
  triggerClassName: string;
  children: ReactNode;
  group?: string;
};

export function Dropdown({ label, trigger, triggerClassName, children, group }: DropdownProps) {
  const { disclosure, closeOnSelection } = useDropdown();
  return (
    <details ref={disclosure} name={group} className="cp-admin-disclosure admin-dropdown">
      <summary className={triggerClassName} aria-label={label}>
        {trigger}
      </summary>
      <div className="cp-admin-disclosure-panel admin-dropdown-panel" onClick={closeOnSelection}>
        {children}
      </div>
    </details>
  );
}
