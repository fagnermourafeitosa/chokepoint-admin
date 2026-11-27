import { useState } from 'react';
import { Dialog } from '../../../components/ui/dialog/Dialog';
import { AccessLossNotice } from './AccessLossNotice';
import { changesText, PublishError, PublishNote, type DraftReview } from './ReviewPanel';

// Publish from the history (Admin 064 Solution 5): the history already shows the changes, so the
// confirmation asks only for what the review panel adds, the loss of access and the note.
export function PublishDialog({ agentName, review, onClose, onPublished }: { agentName: string; review: DraftReview; onClose: () => void; onPublished: () => void }) {
  const [note, setNote] = useState('');
  return <Dialog title={`Publish ${changesText(review.changes.length)} to ${agentName}?`} onClose={() => { if (!review.busy) onClose(); }}>
    <div className="admin-dialog-body">
      <AccessLossNotice losses={review.losses} agentName={agentName} />
      <PublishNote value={note} onChange={setNote} />
      <PublishError review={review} onReloaded={onClose} />
    </div>
    <div className="admin-dialog-actions">
      <button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={review.busy} onClick={onClose}>Cancel</button>
      <button type="button" className="cp-admin-button" disabled={review.busy || !!review.blocker} title={review.blocker} onClick={() => void review.onPublish(note).then(ok => { if (ok) onPublished(); })}>{review.busy ? 'Publishing…' : 'Publish'}</button>
    </div>
  </Dialog>;
}
