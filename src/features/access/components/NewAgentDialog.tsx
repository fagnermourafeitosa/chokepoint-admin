import { Dialog } from '../../../components/ui/dialog/Dialog';
import { useAgentForm } from '../hooks/useAgentForm';
import { AgentAppearance } from './AgentAppearance';
import type { AgentRecord, AgentScope } from '../agent-api';

type Props = { scope: AgentScope; agent?: AgentRecord; onClose: () => void; onPersisted: (agent: AgentRecord) => void; onSaved: (agent: AgentRecord) => void };
export function NewAgentDialog({ scope, agent, onClose, onPersisted, onSaved }: Props) {
  const form = useAgentForm({ scope, agent, onPersisted, onSaved });
  const busy = form.pending || form.checkingFile;
  return <Dialog title={agent ? 'Edit agent' : 'New agent'} onClose={() => { if (!busy) onClose(); }}>
    <form onSubmit={event => void form.submit(event)} aria-busy={busy}>
      <div className="admin-dialog-body">
        <div className="agent-form-appearance-row">
        <AgentAppearance value={form.appearance} onChange={form.setAppearance} agent={form.persisted} scope={scope} disabled={busy} hint="PNG or JPEG · up to 256 KiB · maximum 512 × 512 pixels. Images are saved as PNG; the saved file must also fit within 256 KiB." onFile={form.chooseFile} />
          <p className="cp-admin-muted">Saved to the current workspace and environment.</p>
        </div>
        <label>Agent name<input className="cp-admin-input" name="name" required value={form.name} disabled={busy} onChange={event => form.setName(event.target.value)} aria-describedby="agent-name-limit" /></label>
        <small id="agent-name-limit" className="cp-admin-muted">Up to 50 characters.</small>
        <label>Description<textarea className="cp-admin-input" name="description" rows={3} value={form.description} disabled={busy} onChange={event => form.setDescription(event.target.value)} aria-describedby="agent-description-limit" /></label>
        <small id="agent-description-limit" className="cp-admin-muted">Up to 200 characters.</small>
        {form.checkingFile ? <p role="status">Checking image…</p> : null}
        {form.error ? <p role="alert" className="cp-admin-notice" data-tone="danger">{form.error}</p> : null}
      </div>
      <div className="admin-dialog-actions">
        <button className="cp-admin-button cp-admin-button--secondary" type="button" disabled={busy} onClick={onClose}>{form.partial ? 'Close' : 'Cancel'}</button>
        <button className="cp-admin-button" type="submit" disabled={busy}>{form.pending ? 'Saving…' : form.partial ? 'Retry save' : agent ? 'Save changes' : 'Create agent'}</button>
      </div>
    </form>
  </Dialog>;
}
