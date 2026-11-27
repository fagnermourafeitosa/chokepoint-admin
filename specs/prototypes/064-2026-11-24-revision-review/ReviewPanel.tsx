import { useState } from 'react';
import { AccessLoss } from './AccessLoss';
import { SidePanel } from '../../../src/components/ui/side-panel/SidePanel';
import { ChangeList, Summary } from './ChangeList';
import { agent, total, type Scenario } from './data';

// Admin 064 prototype: Review & publish opens this panel. It lists what the draft changes against
// the effective revision, says what the change takes away, and asks for the note. Publishing writes nothing.
export function ReviewPanel({ scenario, onClose, onPublished }: { scenario: Scenario; onClose: () => void; onPublished: () => void }) {
  const [note, setNote] = useState('');
  const n = total(scenario.changes);
  return <SidePanel title="Review changes" eyebrow={agent.name} width="wide" onClose={onClose}>
    <div className="rr-review">
      <div className="rr-review-body">
        <Summary title={`Draft against revision ${agent.effective}`} changes={scenario.changes} />
        <AccessLoss losses={scenario.losses} />
        <ChangeList changes={scenario.changes} />
      </div>
      <footer className="rr-review-footer">
        <label className="delegation-publish-note"><span className="cp-admin-muted">Why this change? Optional. It shows in the history.</span>
          <input className="cp-admin-input" maxLength={500} placeholder="For example: Finance asked for a lower refund limit" value={note} onChange={e => setNote(e.target.value)} />
        </label>
        <div className="rr-review-actions">
          <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" onClick={onClose}>Back to the draft</button>
          <button type="button" className="cp-admin-button cp-admin-button--small" onClick={onPublished}>Publish {n} {n === 1 ? 'change' : 'changes'}</button>
        </div>
      </footer>
    </div>
  </SidePanel>;
}
