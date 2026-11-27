import { useState } from 'react';
import { SidePanel } from '../../../components/ui/side-panel/SidePanel';
import type { Loss } from './accessLoss';
import { AccessLossNotice } from './AccessLossNotice';
import { ChangeList, ChangeSummary } from './ChangeList';
import type { Change } from './revisionDiff';

// What both publication steps need: the changes of the draft, its losses, and the publish action.
// conflict: the agent changed in another session; Reload reads it again and drops the edits.
export type DraftReview = { changes: Change[]; losses: Loss[]; base: number; busy: boolean; error?: string; conflict?: boolean; blocker?: string; onPublish: (note: string) => Promise<boolean>; onReload: () => void };

// The error of a failed publication, with Reload when the agent changed in another session.
export function PublishError({ review, onReloaded }: { review: DraftReview; onReloaded: () => void }) {
  if (!review.error) return null;
  return <div role="alert" className="cp-admin-notice cp-admin-notice--danger publish-error">{review.error}{review.conflict ? <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" disabled={review.busy} onClick={() => { review.onReload(); onReloaded(); }}>Reload</button> : null}</div>;
}

export const changesText = (n: number) => `${n} ${n === 1 ? 'change' : 'changes'}`;

// The note of a publication (Backend 038): optional, shown in the history.
export function PublishNote({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <label className="delegation-publish-note"><span className="cp-admin-muted">Why this change? Optional. It shows in the history.</span>
    <input className="cp-admin-input" maxLength={500} placeholder="For example: Finance asked for a lower refund limit" value={value} onChange={e => onChange(e.target.value)} /></label>;
}

// Review & publish (Admin 064 Solution 1): the changes of the draft against the published revision,
// what the publication takes away, the note and Publish.
export function ReviewPanel({ agentName, review, onClose }: { agentName: string; review: DraftReview; onClose: () => void }) {
  const [note, setNote] = useState('');
  const n = review.changes.length;
  return <SidePanel title="Review changes" eyebrow={agentName} width="wide" onClose={onClose}>
    <div className="review-panel">
      <div className="review-panel-body">
        <ChangeSummary title={review.base ? `Draft against revision ${review.base}` : 'Draft · nothing is published yet'} changes={review.changes} />
        <AccessLossNotice losses={review.losses} agentName={agentName} />
        <ChangeList changes={review.changes} />
      </div>
      <footer className="review-panel-footer">
        <PublishError review={review} onReloaded={onClose} />
        <PublishNote value={note} onChange={setNote} />
        <div className="review-panel-actions">
          <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={review.busy} onClick={onClose}>Back to the draft</button>
          <button type="button" className="cp-admin-button cp-admin-button--small" disabled={review.busy || !n || !!review.blocker} title={review.blocker} onClick={() => void review.onPublish(note).then(ok => { if (ok) onClose(); })}>{review.busy ? 'Publishing…' : `Publish ${changesText(n)}`}</button>
        </div>
      </footer>
    </div>
  </SidePanel>;
}
