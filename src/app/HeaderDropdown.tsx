import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

type HeaderDropdownProps = {
  label: string;
  trigger: ReactNode;
  triggerClassName: string;
  children: ReactNode;
};

export function HeaderDropdown({ label, trigger, triggerClassName, children }: HeaderDropdownProps) {
  const disclosure = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !disclosure.current?.contains(event.target)) {
        disclosure.current?.removeAttribute('open');
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && disclosure.current?.open) {
        disclosure.current.removeAttribute('open');
        disclosure.current.querySelector('summary')?.focus();
      }
    }
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <details ref={disclosure} name="admin-header" className="cp-admin-disclosure admin-header-dropdown">
      <summary className={triggerClassName} aria-label={label}>{trigger}</summary>
      <div
        className="cp-admin-disclosure-panel admin-dropdown-panel"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest('button')) {
            disclosure.current?.removeAttribute('open');
          }
        }}
      >
        {children}
      </div>
    </details>
  );
}
