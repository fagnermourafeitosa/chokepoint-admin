import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useDialog } from './useDialog';
import './dialog.css';

type DialogProps = { title: string; onClose: () => void; children: ReactNode };

export function Dialog({ title, onClose, children }: DialogProps) {
  const { ref, titleId } = useDialog();
  return (
    <dialog
      ref={ref}
      className="cp-admin-dialog admin-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="admin-dialog-header">
        <h2 id={titleId}>{title}</h2>
        <button
          className="admin-dialog-close"
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
