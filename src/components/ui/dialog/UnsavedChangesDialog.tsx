import { Dialog } from './Dialog';

type UnsavedChangesDialogProps = {
  // What changed, as "the masked types of Production".
  what: string;
  busy?: boolean;
  // The error of a failed save; the dialog stays open.
  error?: string;
  onSave: () => void;
  onDiscard: () => void;
  onKeep: () => void;
};

// The question before an editor with unsaved changes closes or the person leaves it (design system
// "Unsaved changes dialog", Admin 063 item 13). It is not a destructive confirmation: Save is the
// primary action, Discard drops the changes, and Keep editing, Escape or the close button return to
// the editor.
export function UnsavedChangesDialog({ what, busy = false, error, onSave, onDiscard, onKeep }: UnsavedChangesDialogProps) {
  return (
    <Dialog title="Save your changes?" onClose={() => { if (!busy) onKeep(); }}>
      <div className="admin-dialog-body">
        <p>You changed {what} and did not save. Save the changes before you leave, or discard them.</p>
        {error ? <p role="alert" className="cp-admin-notice cp-admin-notice--danger">{error}</p> : null}
      </div>
      <div className="admin-dialog-actions">
        <button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={busy} onClick={onKeep}>Keep editing</button>
        <button type="button" className="cp-admin-button cp-admin-button--danger-soft" disabled={busy} onClick={onDiscard}>Discard</button>
        <button type="button" className="cp-admin-button" disabled={busy} onClick={onSave}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </Dialog>
  );
}
