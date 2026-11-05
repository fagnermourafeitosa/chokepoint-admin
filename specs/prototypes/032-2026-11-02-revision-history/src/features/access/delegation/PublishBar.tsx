import { useState } from 'react';
import { CircleCheck, History, RefreshCw } from 'lucide-react';
import type { Configuration } from './api';
import { prototypeRevisions } from './RevisionHistory';
import { WaitingBackend } from './WaitingBackend';

type Props = { config: Configuration; changes: number; busy: boolean; onPublish: () => Promise<boolean>; onDiscard: () => void; onHistory: () => void };

// Draft and runtime state side by side. Reconciliation is automatic; there is no repair action (Backend 033 Solution 5).
// Layout prototype (Backend 038): author, time and note of the latest revision, and a note on publish.
export function PublishBar({ config, changes, busy, onPublish, onDiscard, onHistory }: Props) {
  const [review, setReview] = useState(false);
  const [note, setNote] = useState('');
  const pending = config.reconciliation.state === 'pending' && config.published_revision > config.effective_revision;
  const hasDraft = changes > 0 || !!config.draft;
  const latest = prototypeRevisions[0];
  return <div className="delegation-publish" role="region" aria-label="Publication">
    <div className="delegation-publish-state">
      <span>{changes ? <><strong>Draft</strong> · {changes} unpublished {changes === 1 ? 'change' : 'changes'}</> : 'No unpublished changes'}</span>
      <span className="delegation-publish-sep" aria-hidden="true" />
      {!config.published_revision ? <span className="mcp-badge">Not published yet</span>
        : pending ? <span className="mcp-badge" data-tone="warning" title="Chokepoint is writing this revision to OpenFGA. This takes a moment; no approval is needed."><RefreshCw size={13} aria-hidden="true" /> Applying revision {config.published_revision} · {config.effective_revision ? `revision ${config.effective_revision} still applies` : 'no revision applies yet'}</span>
          : <span className="mcp-badge" data-tone="success"><CircleCheck size={13} aria-hidden="true" /> Revision {config.effective_revision} effective</span>}
      {config.published_revision ? <button type="button" className="delegation-publish-author" title="Open the revision history" onClick={onHistory}>by <strong>{latest.by}</strong> · {latest.at}{latest.note ? <> · <em>“{latest.note}”</em></> : null}</button> : null}
      {config.published_revision ? <WaitingBackend spec="038" tip="Who published the latest revision, when, and the optional note." /> : null}
      <button type="button" className="rule-switch" onClick={onHistory}><History size={14} aria-hidden="true" />History</button>
    </div>
    <div className="delegation-publish-actions">
      {review ? <>
        <label className="delegation-publish-note"><span className="cp-admin-muted">Publish {changes} {changes === 1 ? 'change' : 'changes'}? New calls use them once OpenFGA confirms.</span><input className="cp-admin-input" maxLength={500} placeholder="Why this change? (optional)" value={note} onChange={e => setNote(e.target.value)} /></label>
        <WaitingBackend spec="038" tip="The optional note is stored with the revision." />
        <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={busy} onClick={() => setReview(false)}>Back</button>
        <button type="button" className="cp-admin-button cp-admin-button--small" disabled={busy} onClick={() => void onPublish().then(ok => { if (ok) { setReview(false); setNote(''); } })}>{busy ? 'Publishing…' : 'Publish'}</button>
      </> : <>
        <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={busy || !hasDraft} onClick={onDiscard}>Discard draft</button>
        <button type="button" className="cp-admin-button cp-admin-button--small" disabled={busy || !changes} onClick={() => setReview(true)}>Review &amp; publish</button>
      </>}
    </div>
  </div>;
}
