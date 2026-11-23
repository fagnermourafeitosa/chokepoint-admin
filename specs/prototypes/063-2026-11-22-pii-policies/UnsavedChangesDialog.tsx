import { Dialog } from '../../../src/components/ui/dialog/Dialog';

// Admin 063 prototype: asks what to do with unsaved changes when an editor is closed or cancelled.
// It is not a destructive confirmation (ConfirmDialog): Save is the primary action, Discard drops the
// changes, and Keep editing, Escape or the close button return to the editor. A new design-system
// dialog, drawn here first; it uses the parts of the design-system Dialog.
export function UnsavedChangesDialog({ what, onSave, onDiscard, onKeep }: {
  what: string; onSave: () => void; onDiscard: () => void; onKeep: () => void;
}) {
  return <Dialog title="Save your changes?" onClose={onKeep}>
    <div className="admin-dialog-body">
      <p>You changed {what} and did not save. Save the changes before you leave, or discard them.</p>
    </div>
    <div className="admin-dialog-actions">
      <button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={onKeep}>Keep editing</button>
      <button type="button" className="cp-admin-button cp-admin-button--danger-soft" onClick={onDiscard}>Discard</button>
      <button type="button" className="cp-admin-button" onClick={onSave}>Save</button>
    </div>
  </Dialog>;
}
