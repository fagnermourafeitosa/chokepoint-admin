import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useDialog } from '../dialog/useDialog';

type SidePanelProps = { title: ReactNode; eyebrow?: string; actions?: ReactNode; width?: 'default' | 'wide'; onClose: () => void; children: ReactNode };

// A modal panel on the right edge of the window. Escape, the close button and a click on the backdrop close it.
export function SidePanel({ title, eyebrow, actions, width = 'default', onClose, children }: SidePanelProps) {
  const { ref, titleId } = useDialog();
  return (
    <dialog
      ref={ref}
      className="cp-admin-side-panel"
      data-width={width}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="cp-admin-side-panel-frame">
        <header className="cp-admin-side-panel-header">
          <div>
            {eyebrow ? <span className="cp-admin-label">{eyebrow}</span> : null}
            <h2 id={titleId}>{title}</h2>
          </div>
          <div className="cp-admin-side-panel-actions">
            {actions}
            <button className="cp-admin-side-panel-close" type="button" aria-label="Close panel" onClick={onClose}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </header>
        <div className="cp-admin-side-panel-body">{children}</div>
      </div>
    </dialog>
  );
}
