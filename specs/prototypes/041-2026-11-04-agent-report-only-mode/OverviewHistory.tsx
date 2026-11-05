import { useState } from 'react';
import { ArrowRight, Eye } from 'lucide-react';
import { SidePanel } from '../../../src/components/ui/side-panel/SidePanel';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import { BACKEND_SPEC, day, overview, reportOnly, revisions, utc, type ProtoRevision } from './data';

const n = new Intl.NumberFormat('en-US');

// Overview metrics: Denied today counts enforced denials only; Report-only has its own metric.
export function OverviewScreen({ onReport }: { onReport: () => void }) {
  return <section aria-label="Overview">
    <header className="trace-page-heading"><div><span className="attention-kicker">Overview</span><h1 className="cp-admin-title">Overview</h1></div></header>
    <div className="overview-metrics report-only-metrics">
      <section className="overview-metric"><span>Calls today</span><strong>{n.format(overview.callsToday)}</strong><small>{(overview.deniedToday / overview.callsToday * 100).toFixed(1)}% denied · +4.2% vs yesterday at this time</small></section>
      <button className="overview-metric overview-metric--denied"><span>Denied today</span><strong>{overview.deniedToday}</strong><small>{overview.deniedYesterday} yesterday at this time · blocked calls only <ArrowRight size={14} aria-hidden="true" /></small></button>
      <button className="overview-metric report-only-metric" onClick={onReport}><span><Eye size={13} aria-hidden="true" /> Report-only</span><strong>{reportOnly.length} <em>agents</em></strong><small>{overview.wouldDenyToday} calls would be denied today <ArrowRight size={14} aria-hidden="true" /></small><WaitingBackend spec={BACKEND_SPEC} tip="Counts the agents in Report-only and their would-deny calls today. Denied today does not include them." /></button>
      <button className="overview-metric"><span>Tools reviewed</span><strong>13 <em>of 13</em></strong><meter value={13} max={13} /><small>All current tools reviewed <ArrowRight size={14} aria-hidden="true" /></small></button>
    </div>
  </section>;
}

// The revision history side panel of the agent. A mode change is an event in the same timeline,
// not a numbered revision: it does not change the permissions of the agent (decided 2026-11-04).
export function HistoryPanel({ agentName, onClose }: { agentName: string; onClose: () => void }) {
  const mode = revisions[0];
  const [current, setCurrent] = useState<ProtoRevision>(mode);
  const numbered = revisions.filter(r => r.kind === 'publish').length;
  const title = (r: ProtoRevision) => r.kind === 'mode' ? 'Mode changed' : `Revision ${r.revision}`;
  return <SidePanel title="Revision history" eyebrow={agentName} width="wide" onClose={onClose}>
    <section className="history">
      <nav className="history-timeline" aria-label="History"><header><span className="cp-admin-label">{numbered} revisions · 1 mode change</span></header>
        <ol>{revisions.map(r => <li key={`${r.kind}-${r.revision}`} data-state={r.effective ? 'current' : 'past'} data-kind={r.kind}><button type="button" aria-current={r === current || undefined} onClick={() => setCurrent(r)}>{r.kind === 'mode' ? <span className="history-dot report-only-event-dot" aria-hidden="true"><Eye size={12} /></span> : <span className="history-dot" aria-hidden="true" />}<span className="history-entry">
          <span className="history-entry-head"><strong>{title(r)}</strong>{r.effective ? <span className="mcp-badge" data-tone="success">Effective</span> : null}</span>
          {r.note ? <span className="history-entry-note">{r.note}</span> : null}
          <span className="history-entry-meta"><span className="history-avatar" aria-hidden="true">BN</span>{r.by}</span>
          <time className="report-only-entry-date">{utc(r.at)}</time>
        </span></button></li>)}</ol>
      </nav>
      {current.kind === 'publish' ? <article className="history-detail"><header className="history-detail-head"><div><span className="cp-admin-label">Publication</span><h4>Revision {current.revision}</h4></div>
        <dl className="history-facts"><div><dt>Published by</dt><dd><span className="history-avatar" aria-hidden="true">BN</span>{current.by}</dd></div><div><dt>When</dt><dd>{utc(current.at)}</dd></div></dl></header>
        <blockquote className="history-note"><span className="cp-admin-label">Why</span><p>{current.note}</p></blockquote>
        <p className="cp-admin-muted">The changes of this revision show as they do today.</p>
      </article> : <article className="history-detail"><header className="history-detail-head"><div><span className="cp-admin-label">Event</span><h4>Mode changed</h4></div>
        <dl className="history-facts"><div><dt>Changed by</dt><dd><span className="history-avatar" aria-hidden="true">BN</span>{current.by}</dd></div><div><dt>When</dt><dd>{utc(current.at)}</dd></div><div><dt>Applied</dt><dd>At once</dd></div></dl></header>
        <blockquote className="history-note"><span className="cp-admin-label">Why</span><p>{current.note}</p></blockquote>
        <div className="history-summary"><span>Enforcement mode</span><WaitingBackend spec={BACKEND_SPEC} tip="Records each change of the enforcement mode as an immutable event with its author, time, note and review date." /></div>
        <div className="history-diff"><section><h5><Eye size={14} aria-hidden="true" />Enforcement</h5><ul><li data-kind="changed"><span className="history-sign">~</span><strong>From Enforce to Report-only</strong><code>tool grants, resources and call rules do not block</code></li>{current.reviewBy ? <li data-kind="added"><span className="history-sign">+</span><strong>Review by {day(current.reviewBy)}</strong><code>reminder only</code></li> : null}</ul></section></div>
      </article>}
    </section>
  </SidePanel>;
}
