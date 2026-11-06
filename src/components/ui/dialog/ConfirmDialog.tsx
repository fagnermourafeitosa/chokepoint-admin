import { TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Dialog } from './Dialog';

type ConfirmDialogProps = {
  title: string;
  // What the action does: one or two paragraphs.
  children: ReactNode;
  // A consequence the person must read before confirming. Shown as a warning notice.
  warning?: ReactNode;
  confirmLabel: string;
  busyLabel?: string;
  busy?: boolean;
  // The error of a failed action; the dialog stays open.
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
};

// The confirmation of a destructive action (design system "Confirmation dialog"):
// Cancel keeps everything; the danger button runs the action.
export function ConfirmDialog({ title, children, warning, confirmLabel, busyLabel, busy = false, error, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Dialog title={title} onClose={() => { if (!busy) onClose(); }}>
      <div className="admin-dialog-body">
        {children}
        {warning ? (
          <div className="cp-admin-notice cp-admin-notice--warning confirm-dialog-warning" role="note">
            <TriangleAlert size={18} aria-hidden="true" />
            <div>{warning}</div>
          </div>
        ) : null}
        {error ? <p role="alert" className="cp-admin-notice cp-admin-notice--danger">{error}</p> : null}
      </div>
      <div className="admin-dialog-actions">
        <button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={busy} onClick={onClose}>Cancel</button>
        <button type="button" className="cp-admin-button cp-admin-button--danger" disabled={busy} onClick={onConfirm}>{busy && busyLabel ? busyLabel : confirmLabel}</button>
      </div>
    </Dialog>
  );
}
