import { useState } from 'react';
import { CircleCheck, History, RefreshCw } from 'lucide-react';
import type { Configuration } from './api';

type Props = { config: Configuration; changes: number; busy: boolean; blocker?: string; onPublish: (note: string) => Promise<boolean>; onDiscard: () => void; onHistory: () => void };

const utc = (at: string) => new Date(at).toLocaleString('en', { timeZone: 'UTC', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' UTC';

// Draft and runtime state side by side. Reconciliation is automatic; there is no repair action (Backend 033 Solution 5).
// The author, time and note of the latest revision open the history (Admin 032 section 1).
export function PublishBar({ config, changes, busy, blocker, onPublish, onDiscard, onHistory }: Props) {
  const [review, setReview] = useState(false);
  const [note, setNote] = useState('');
  const pending = config.reconciliation.state === 'pending' && config.published_revision > config.effective_revision;
  const hasDraft = changes > 0 || !!config.draft;
  const author = config.published_by_name || config.published_by?.slice(0, 8);
  return <div className="delegation-publish" role="region" aria-label="Publication">
    <div className="delegation-publish-state">
      <span>{changes ? <><strong>Draft</strong> · {changes} unpublished {changes === 1 ? 'change' : 'changes'}</> : 'No unpublished changes'}</span>
      <span className="delegation-publish-sep" aria-hidden="true" />
      {!config.published_revision ? <span className="mcp-badge">Not published yet</span>
        : pending ? <span className="mcp-badge" data-tone="warning" title="Xokepoint is writing this revision to OpenFGA. This takes a moment; no approval is needed."><RefreshCw size={13} aria-hidden="true" /> Applying revision {config.published_revision} · {config.effective_revision ? `revision ${config.effective_revision} still applies` : 'no revision applies yet'}</span>
          : <span className="mcp-badge" data-tone="success"><CircleCheck size={13} aria-hidden="true" /> Revision {config.effective_revision} effective</span>}
      {author && config.published_at ? <button type="button" className="delegation-publish-author" title="Open the revision history" onClick={onHistory}>by <strong>{author}</strong> · {utc(config.published_at)}{config.note ? <> · <em>“{config.note}”</em></> : null}</button> : null}
      {config.published_revision ? <button type="button" className="rule-switch" onClick={onHistory}><History size={14} aria-hidden="true" />History</button> : null}
    </div>
    <div className="delegation-publish-actions">
      {review ? <>
        <label className="delegation-publish-note"><span className="cp-admin-muted">Publish {changes} {changes === 1 ? 'change' : 'changes'}? New calls use them once OpenFGA confirms.</span><input className="cp-admin-input" maxLength={500} placeholder="Why this change? (optional)" value={note} onChange={e => setNote(e.target.value)} /></label>
        <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={busy} onClick={() => setReview(false)}>Back</button>
        <button type="button" className="cp-admin-button cp-admin-button--small" disabled={busy} onClick={() => void onPublish(note).then(ok => { if (ok) { setReview(false); setNote(''); } })}>{busy ? 'Publishing…' : 'Publish'}</button>
      </> : <>
        <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={busy || !hasDraft} onClick={onDiscard}>Discard draft</button>
        <button type="button" className="cp-admin-button cp-admin-button--small" disabled={busy || !changes || !!blocker} title={blocker} onClick={() => setReview(true)}>Review &amp; publish</button>
      </>}
    </div>
  </div>;
}
