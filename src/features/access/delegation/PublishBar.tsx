import { useState } from 'react';
import { CircleCheck, RefreshCw } from 'lucide-react';
import type { Configuration } from './api';

type Props = { config: Configuration; changes: number; busy: boolean; onPublish: () => Promise<boolean>; onDiscard: () => void };

// Draft and runtime state side by side. Reconciliation is automatic; there is no repair action (Backend 033 Solution 5).
export function PublishBar({ config, changes, busy, onPublish, onDiscard }: Props) {
  const [review, setReview] = useState(false);
  const pending = config.reconciliation.state === 'pending' && config.published_revision > config.effective_revision;
  const hasDraft = changes > 0 || !!config.draft;
  return <div className="delegation-publish" role="region" aria-label="Publication">
    <div className="delegation-publish-state">
      <span>{changes ? <><strong>Draft</strong> · {changes} unpublished {changes === 1 ? 'change' : 'changes'}</> : 'No unpublished changes'}</span>
      <span className="delegation-publish-sep" aria-hidden="true" />
      {!config.published_revision ? <span className="mcp-badge">Not published yet</span>
        : pending ? <span className="mcp-badge" data-tone="warning"><RefreshCw size={13} aria-hidden="true" /> Revision {config.published_revision} pending · {config.effective_revision ? `revision ${config.effective_revision} still applies` : 'no revision applies yet'}</span>
          : <span className="mcp-badge" data-tone="success"><CircleCheck size={13} aria-hidden="true" /> Revision {config.effective_revision} effective</span>}
    </div>
    <div className="delegation-publish-actions">
      {review ? <>
        <span className="cp-admin-muted">Publish {changes} {changes === 1 ? 'change' : 'changes'}? New calls use them once OpenFGA confirms.</span>
        <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={busy} onClick={() => setReview(false)}>Back</button>
        <button type="button" className="cp-admin-button cp-admin-button--small" disabled={busy} onClick={() => void onPublish().then(ok => { if (ok) setReview(false); })}>{busy ? 'Publishing…' : 'Publish'}</button>
      </> : <>
        <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={busy || !hasDraft} onClick={onDiscard}>Discard draft</button>
        <button type="button" className="cp-admin-button cp-admin-button--small" disabled={busy || !changes} onClick={() => setReview(true)}>Review &amp; publish</button>
      </>}
    </div>
  </div>;
}
