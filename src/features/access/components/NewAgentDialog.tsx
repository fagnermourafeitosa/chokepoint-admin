import { Dialog } from '../../../components/ui/dialog/Dialog';
import { useAgentForm } from '../hooks/useAgentForm';
import type { AgentInput } from '../types';

type NewAgentDialogProps = { onClose: () => void; onCreate: (input: AgentInput) => void };

export function NewAgentDialog({ onClose, onCreate }: NewAgentDialogProps) {
  const { submit, error } = useAgentForm(onCreate);
  return (
    <Dialog title="New agent" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="admin-dialog-body">
          <p className="cp-admin-muted">This draft is saved in the local preview.</p>
          <label>
            Agent name
            <input className="cp-admin-input" name="name" required />
          </label>
          <label>
            Description
            <textarea className="cp-admin-input" name="description" rows={3} />
          </label>
          {error ? <p role="alert">{error}</p> : null}
        </div>
        <div className="admin-dialog-actions">
          <button
            className="cp-admin-button cp-admin-button--secondary"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="cp-admin-button" type="submit">
            Create agent
          </button>
        </div>
      </form>
    </Dialog>
  );
}
