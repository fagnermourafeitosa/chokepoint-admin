import { useState } from 'react';
import { Bot } from 'lucide-react';
import { SidePanel } from '../../../src/components/ui/side-panel/SidePanel';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import '../../../src/features/mcp/mcp.css';
import '../../../src/features/access/delegation/delegation.css';
import { history, server, type HistoryDecision, type HistoryEvent } from './data';
import './prototype.css';

// Admin 057 prototype: the Review history of a server (Backend 096), opened from its row in
// Integrations (IntegrationsPrototype.tsx), in the pattern of the revision
// history of an agent (src/features/access/delegation/RevisionHistory.tsx): a timeline of the reviews
// and of the automatic disables, and the decisions of the selected one with the text decided on.

const utc = (at: string) => new Date(at).toLocaleString('en', { timeZone: 'UTC', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' UTC';
const initials = (name: string) => name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
const labels: Record<HistoryDecision, { text: string; tone?: 'success' | 'danger' | 'warning' }> = {
  approved: { text: 'Approved', tone: 'success' },
  change_trusted: { text: 'Change trusted', tone: 'success' },
  denied: { text: 'Denied', tone: 'danger' },
  kept_disabled: { text: 'Kept disabled', tone: 'danger' },
  disabled_changed: { text: 'Disabled: changed', tone: 'warning' },
  disabled_removed: { text: 'Disabled: removed', tone: 'warning' },
};
const title = (e: HistoryEvent) => (e.kind === 'review' ? 'Review' : 'Automatic rediscovery');

export function ReviewHistory({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState(history[0].id);
  const current = history.find(e => e.id === selected)!;
  const count = (kind: 'yes' | 'no' | 'auto') => current.decisions.filter(d => (kind === 'yes' ? ['approved', 'change_trusted'] : kind === 'no' ? ['denied', 'kept_disabled'] : ['disabled_changed', 'disabled_removed']).includes(d.decision)).length;
  return <SidePanel title="Review history" eyebrow={server.name} width="wide" onClose={onClose}><section className="history">
    <nav className="history-timeline" aria-label="Reviews">
      <header><span className="cp-admin-label">{history.length} events <WaitingBackend spec="096" tip="One immutable event per confirmed review and per automatic disable, with the reviewer, the time and the decisions." /></span></header>
      <ol>{history.map(e => <li key={e.id} data-state={e.kind === 'rediscovery' ? 'mode' : 'past'} data-kind={e.kind === 'rediscovery' ? 'mode' : undefined}>
        <button type="button" aria-current={e.id === selected || undefined} onClick={() => setSelected(e.id)}>
          {e.kind === 'rediscovery' ? <span className="history-dot history-dot--mode" aria-hidden="true"><Bot size={12} /></span> : <span className="history-dot" aria-hidden="true" />}
          <span className="history-entry">
            <span className="history-entry-head"><strong>{title(e)}</strong><span className="mcp-badge">Revision {e.revision}</span></span>
            <span className="history-entry-note">{e.decisions.length} {e.decisions.length === 1 ? 'tool' : 'tools'}</span>
            <span className="history-entry-meta">{e.reviewer ? <><span className="history-avatar" aria-hidden="true">{initials(e.reviewer)}</span>{e.reviewer}</> : 'Xokepoint'}</span>
            <time className="history-entry-time" dateTime={e.at}>{utc(e.at)}</time>
          </span>
        </button>
      </li>)}</ol>
    </nav>
    <article className="history-detail" aria-label={title(current)}>
      <header className="history-detail-head">
        <div><span className="cp-admin-label">{current.kind === 'review' ? 'Review' : 'Automatic'}</span><h4>{title(current)} · revision {current.revision}</h4></div>
        <dl className="history-facts">
          <div><dt>{current.kind === 'review' ? 'Reviewed by' : 'Done by'}</dt><dd>{current.reviewer ? <><span className="history-avatar" aria-hidden="true">{initials(current.reviewer)}</span>{current.reviewer}</> : 'Xokepoint, automatic rediscovery'}</dd></div>
          <div><dt>When</dt><dd>{utc(current.at)}</dd></div>
        </dl>
      </header>
      {current.kind === 'rediscovery' ? <p className="history-note history-note--empty">The server changed or stopped returning these tools. Xokepoint disabled them until a review.</p> : null}
      <div className="history-summary">
        {count('yes') ? <span className="history-count" data-kind="added">{count('yes')} approved</span> : null}
        {count('no') ? <span className="history-count" data-kind="removed">{count('no')} denied</span> : null}
        {count('auto') ? <span className="history-count" data-kind="changed">{count('auto')} disabled</span> : null}
      </div>
      <ul className="rh-decisions">{current.decisions.map(d => <li key={d.tool}>
        <details>
          <summary><code>{d.tool}</code><span className="mcp-badge" data-tone={labels[d.decision].tone}>{labels[d.decision].text}</span></summary>
          <div className="rh-contract"><span className="cp-admin-label">Text at that time</span><p>{d.description}</p></div>
        </details>
      </li>)}</ul>
    </article>
  </section></SidePanel>;
}

