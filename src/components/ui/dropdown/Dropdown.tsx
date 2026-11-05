import type { ReactNode } from 'react';
import { useDropdown } from './useDropdown';

type DropdownProps = {
  label: string;
  trigger: ReactNode;
  triggerClassName: string;
  children: ReactNode;
  group?: string;
  disabled?: boolean;
};

// alignPanel keeps an open panel inside its clipping container: the panel is
// aligned to the end of its trigger, and to its start when the end would cut it
// at the left edge (a trigger at the start of a wrapped toolbar row).
function alignPanel(details: HTMLDetailsElement) {
  const panel = details.querySelector<HTMLElement>('.admin-dropdown-panel');
  if (!panel) return;
  delete panel.dataset.align;
  if (!details.open) return;
  let edge = 0;
  for (let node = details.parentElement; node; node = node.parentElement) {
    if (getComputedStyle(node).overflowX !== 'visible') { edge = node.getBoundingClientRect().left; break; }
  }
  if (panel.getBoundingClientRect().left < edge) panel.dataset.align = 'start';
}

export function Dropdown({ label, trigger, triggerClassName, children, group, disabled = false }: DropdownProps) {
  const { disclosure, closeOnSelection } = useDropdown();
  return (
    <details
      ref={disclosure}
      name={group}
      className="cp-admin-disclosure admin-dropdown"
      onToggle={(event) => alignPanel(event.currentTarget)}
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
