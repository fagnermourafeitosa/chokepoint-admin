import './lists.css';
import { ClipboardList } from 'lucide-react';
import { Dialog } from '../../../components/ui/dialog/Dialog';
import { EmptyState } from '../../../components/ui/empty-state/EmptyState';
import type { PreviewChange } from '../types';

type ReviewChangesDialogProps = {
  changes: readonly PreviewChange[];
  onClose: () => void;
  onApply: () => void;
};

export function ReviewChangesDialog({ changes, onClose, onApply }: ReviewChangesDialogProps) {
  return (
    <Dialog title="Review changes" onClose={onClose}>
      <div className="admin-dialog-body">
        <p className="cp-admin-muted">Changes apply only to this local preview.</p>
        {changes.length ? (
          <ul className="access-change-list">
            {changes.map((change) => (
              <li key={change.id}>
                <strong>{change.title}</strong>
                <span>{change.detail}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={ClipboardList} title="No changes to review" />
        )}
      </div>
      <div className="admin-dialog-actions">
        <button
          className="cp-admin-button cp-admin-button--secondary"
          type="button"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="cp-admin-button cp-admin-button--dark"
          type="button"
          onClick={onApply}
          disabled={!changes.length}
        >
          Apply preview
        </button>
      </div>
    </Dialog>
  );
}
