import { useState } from 'react';
import { SidePanel } from '../../../src/components/ui/side-panel/SidePanel';
import { ChangeList, flat, Summary } from './ChangeList';
import { agent, revisions, type Scenario } from './data';

// Admin 064 prototype: the revision history with the draft at the top of the timeline, so the changes
// that are not published yet read the same way as the published ones.
type Entry = 'draft' | number;

// today: the history of the Admin of today (RevisionHistory): no draft, no numbering note, a flat diff.
export function HistoryPanel({ scenario, hasDraft, today, onClose, onPublish }: { scenario: Scenario; hasDraft: boolean; today: boolean; onClose: () => void; onPublish: () => void }) {
  const [chosen, setChosen] = useState<Entry>(hasDraft ? 'draft' : revisions[0].revision);
  const current = chosen === 'draft' ? undefined : revisions.find(r => r.revision === chosen);
  const before = current ? revisions[revisions.indexOf(current) + 1] : undefined;
  return <SidePanel title="Revision history" eyebrow={agent.name} width="wide" onClose={onClose}><section className="history">
    <nav className="history-timeline" aria-label="Revisions">
      <header><span className="cp-admin-label">{revisions.length} revisions</span></header>
      <ol>
        {hasDraft ? <li data-state="draft"><button type="button" aria-current={chosen === 'draft' || undefined} onClick={() => setChosen('draft')}>
          <span className="history-dot rr-dot-draft" aria-hidden="true" />
          <span className="history-entry"><span className="history-entry-head"><strong>Draft</strong><span className="mcp-badge" data-tone="warning">Not published</span></span>
            <span className="history-entry-note">{scenario.changes.length} unpublished {scenario.changes.length === 1 ? 'change' : 'changes'}</span></span>
        </button></li> : null}
        {revisions.map(r => <li key={r.revision} data-state={r.effective ? 'current' : 'past'}><button type="button" aria-current={chosen === r.revision || undefined} onClick={() => setChosen(r.revision)}>
          <span className="history-dot" aria-hidden="true" />
          <span className="history-entry">
            <span className="history-entry-head"><strong>Revision {r.revision}</strong>{r.effective ? <span className="mcp-badge" data-tone="success">Effective</span> : null}</span>
            <span className="history-entry-note">{r.note}</span>
            <span className="history-entry-meta"><span className="history-avatar" aria-hidden="true">BN</span>{r.by}</span>
            <time className="history-entry-time">{r.at}</time>
          </span>
        </button></li>)}
      </ol>
      {today ? null : <p className="history-sample">Revision numbers skip: saving a draft also takes a number.</p>}
    </nav>
    {chosen === 'draft' ? <article className="history-detail" aria-label="Draft">
      <header className="history-detail-head"><div><span className="cp-admin-label">Not published</span><h4>Draft</h4></div></header>
      <Summary title={`Changes from revision ${agent.effective}`} changes={scenario.changes} />
      <ChangeList changes={scenario.changes} />
      <div><button type="button" className="cp-admin-button cp-admin-button--small" onClick={onPublish}>Publish</button></div>
    </article> : current ? <article className="history-detail" aria-label={`Revision ${current.revision}`}>
      <header className="history-detail-head">
        <div><span className="cp-admin-label">Publication</span><h4>Revision {current.revision}</h4></div>
        <dl className="history-facts">
          <div><dt>Published by</dt><dd><span className="history-avatar" aria-hidden="true">BN</span>{current.by}</dd></div>
          <div><dt>When</dt><dd>{current.at}</dd></div>
          <div><dt>Applied</dt><dd>{current.applied}</dd></div>
        </dl>
      </header>
      <blockquote className="history-note"><span className="cp-admin-label">Why</span><p>{current.note}</p></blockquote>
      <Summary title={before ? `Changes from revision ${before.revision}` : 'First revision'} changes={today ? flat(current.changes) : current.changes} />
      {current.changes.length ? <ChangeList changes={today ? flat(current.changes) : current.changes} /> : <p className="cp-admin-muted">{today ? 'This revision has the same access as the one before it.' : current.same}</p>}
    </article> : null}
  </section></SidePanel>;
}
