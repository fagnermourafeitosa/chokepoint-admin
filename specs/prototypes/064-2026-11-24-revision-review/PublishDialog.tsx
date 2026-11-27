import { useState } from 'react';
import { Dialog } from '../../../src/components/ui/dialog/Dialog';
import { AccessLoss } from './AccessLoss';
import { agent, total, type Scenario } from './data';

// Admin 064 prototype: Publish in the history opens this confirmation. The history already shows the
// changes of the draft, so it asks only for what the review panel adds: the loss of access and the note.
export function PublishDialog({ scenario, onClose, onPublished }: { scenario: Scenario; onClose: () => void; onPublished: () => void }) {
  const [note, setNote] = useState('');
  const n = total(scenario.changes);
  return <Dialog title={`Publish ${n} ${n === 1 ? 'change' : 'changes'} to ${agent.name}?`} onClose={onClose}>
    <div className="admin-dialog-body">
      <AccessLoss losses={scenario.losses} />
      <label className="delegation-publish-note"><span className="cp-admin-muted">Why this change? Optional. It shows in the history.</span>
        <input className="cp-admin-input" maxLength={500} placeholder="For example: Finance asked for a lower refund limit" value={note} onChange={e => setNote(e.target.value)} />
      </label>
    </div>
    <div className="admin-dialog-actions">
      <button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={onClose}>Cancel</button>
      <button type="button" className="cp-admin-button" onClick={onPublished}>Publish</button>
    </div>
  </Dialog>;
}
