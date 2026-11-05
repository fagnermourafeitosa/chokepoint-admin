import { useState } from 'react';
import { Bot, ChevronRight, Eye, Pencil, Power, ShieldCheck, Trash2 } from 'lucide-react';
import { Dialog } from '../../../src/components/ui/dialog/Dialog';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import { agents, BACKEND_SPEC, day, overdue, TODAY, utc, type Mode, type ProtoAgent } from './data';

export function ModeChip({ mode }: { mode: Mode }) {
  return mode === 'report_only' ? <span className="mcp-badge report-only-chip" data-tone="warning"><Eye size={12} aria-hidden="true" />Report-only</span> : null;
}

function ModeDialog({ agent, onClose, onDone }: { agent: ProtoAgent; onClose: () => void; onDone: (mode: Mode, reviewBy?: string) => void }) {
  const toEnforce = agent.mode === 'report_only';
  const [note, setNote] = useState('');
  const [reviewBy, setReviewBy] = useState('');
  return <Dialog title={toEnforce ? 'Enforce access' : 'Switch to Report-only'} onClose={onClose}>
    <div className="admin-dialog-body report-only-dialog">
      {toEnforce
        ? <><p><strong>{agent.name}</strong> starts to block each call that its tool grants, resources and call rules deny.</p><p className="cp-admin-muted">{agent.wouldDeny24h ? `${agent.wouldDeny24h} calls would have been denied in the last 24 hours. After this change, those calls fail with a reference code.` : 'No call would have been denied in the last 7 days.'}</p></>
        : <><p><strong>{agent.name}</strong> runs each call. Chokepoint still evaluates the tool grants, resources and call rules and records a denied call as <em>Would deny</em>, but it does not block it.</p>
          <ul className="report-only-always"><li><ShieldCheck size={14} aria-hidden="true" />Always enforced: delegation, a valid token, an enabled identity connection and the kill switch.</li></ul>
          <p className="cp-admin-notice" data-tone="danger">In Production, this agent is not protected by its policy until you switch it back to Enforce.</p>
          <label className="report-only-note"><span className="cp-admin-muted">Review by (optional)</span><input className="cp-admin-input report-only-date" type="date" min={TODAY} value={reviewBy} onChange={e => setReviewBy(e.target.value)} /><small className="cp-admin-muted">On this date, the Inbox reminds you to review the mode. The agent stays in Report-only until you change it.</small></label></>}
      <label className="report-only-note"><span className="cp-admin-muted">Why this change? (optional)</span><input className="cp-admin-input" maxLength={500} value={note} onChange={e => setNote(e.target.value)} placeholder={toEnforce ? 'Pilot finished, no unexpected denials.' : 'Pilot with the Finance team.'} /></label>
      <p className="cp-admin-muted">The change is recorded in the revision history with your name and the note.</p>
    </div>
    <div className="admin-dialog-actions"><button className="cp-admin-button cp-admin-button--secondary" onClick={onClose}>Cancel</button><button className="cp-admin-button" onClick={() => onDone(toEnforce ? 'enforce' : 'report_only', reviewBy || undefined)}>{toEnforce ? 'Enforce access' : 'Switch to Report-only'}</button></div>
  </Dialog>;
}

// Change only the review date of an agent in Report-only. The mode does not change. The change is an event in the history.
function ReviewDateDialog({ agent, onClose, onDone }: { agent: ProtoAgent; onClose: () => void; onDone: (reviewBy?: string) => void }) {
  const [reviewBy, setReviewBy] = useState(agent.reviewBy && !overdue(agent) ? agent.reviewBy : '');
  const [note, setNote] = useState('');
  const had = !!agent.reviewBy;
  return <Dialog title={had ? 'Change review date' : 'Set a review date'} onClose={onClose}>
    <div className="admin-dialog-body report-only-dialog">
      <p><strong>{agent.name}</strong> stays in Report-only. On the review date, the Inbox reminds you to review the mode.</p>
      {had ? <p className="cp-admin-muted">Current date: {day(agent.reviewBy!)}{overdue(agent) ? ' (overdue)' : ''}.</p> : null}
      <label className="report-only-note"><span className="cp-admin-muted">Review by</span><input className="cp-admin-input report-only-date" type="date" min={TODAY} value={reviewBy} onChange={e => setReviewBy(e.target.value)} /></label>
      <label className="report-only-note"><span className="cp-admin-muted">Why this change? (optional)</span><input className="cp-admin-input" maxLength={500} value={note} onChange={e => setNote(e.target.value)} placeholder="Finance needs one more week." /></label>
      <p className="cp-admin-muted">The change is recorded in the revision history with your name and the note.</p>
    </div>
    <div className="admin-dialog-actions">
      {had ? <button className="cp-admin-button cp-admin-button--ghost report-only-remove" onClick={() => onDone(undefined)}>Remove date</button> : null}
      <button className="cp-admin-button cp-admin-button--secondary" onClick={onClose}>Cancel</button>
      <button className="cp-admin-button" disabled={!reviewBy} onClick={() => onDone(reviewBy)}>Save date</button>
    </div>
  </Dialog>;
}

export function AccessScreen({ onHistory }: { onHistory: () => void }) {
  const [state, setState] = useState<Record<string, { mode: Mode; reviewBy?: string }>>(() => Object.fromEntries(agents.map(a => [a.id, { mode: a.mode, reviewBy: a.reviewBy }])));
  const [selected, setSelected] = useState('refunds');
  const [dialog, setDialog] = useState(false);
  const [dateDialog, setDateDialog] = useState(false);
  const list = agents.map(a => ({ ...a, ...state[a.id] }));
  const agent = list.find(a => a.id === selected)!;
  const report = agent.mode === 'report_only';
  return <section aria-label="Agents">
    <div className="access-page-heading"><div><span className="cp-admin-label">ACCESS WORKBENCH</span><h1 className="cp-admin-title">Agents</h1><p className="cp-admin-muted">Choose who can delegate to each agent, the tools it can call, the resources it can act on and the rules of each call.</p></div></div>
    <div className="access-workbench">
      <div><aside className="cp-admin-panel access-agent-rail" aria-label="Agents">
        <div className="access-agent-rail-heading"><span className="access-agent-rail-label">Agents</span><span className="access-agent-count">{list.length}</span></div>
        <ul className="access-agent-list">{list.map(a => <li key={a.id}><button className="access-agent-row" type="button" aria-pressed={a.id === selected} onClick={() => setSelected(a.id)}>
          <span className="agent-visual" aria-hidden="true"><Bot size={20} /></span>
          <span className="access-agent-row-copy"><strong>{a.name}</strong><small>{a.description}</small>{a.mode === 'report_only' ? <span className="report-only-row-tags"><ModeChip mode={a.mode} />{overdue(a) ? <span className="mcp-badge" data-tone="danger">Review overdue</span> : null}</span> : null}</span>
          {a.id === selected ? <ChevronRight size={15} aria-hidden="true" /> : null}
        </button></li>)}</ul>
        <div className="report-only-rail-tag"><WaitingBackend spec={BACKEND_SPEC} tip="Shows the enforcement mode of each agent in the list." /></div>
      </aside></div>
      <section className="cp-admin-panel access-agent-details" aria-label="Selected agent">
        <div className="access-agent-heading"><span className="agent-visual" aria-hidden="true"><Bot size={20} /></span>
          <div className="agent-detail-copy"><div className="access-agent-title"><h2>{agent.name}</h2><span className="mcp-badge" data-tone="success">Active</span><ModeChip mode={agent.mode} /></div><p>{agent.description}</p>
            <p className="cp-admin-muted">{report ? 'Report-only: its calls run, and Chokepoint records the calls that its policy would deny.' : 'Acts for the subjects that delegate to it'}</p></div>
          <div className="agent-detail-actions">
            <button className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" type="button" onClick={() => setDialog(true)}>{report ? <><ShieldCheck size={15} aria-hidden="true" />Enforce access</> : <><Eye size={15} aria-hidden="true" />Report-only</>}</button>
            <button className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" type="button"><Power size={15} aria-hidden="true" />Disable agent</button>
            <button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" type="button"><Pencil size={15} aria-hidden="true" />Edit</button>
            <button className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" type="button"><Trash2 size={15} aria-hidden="true" />Delete</button>
          </div></div>
        {report ? <div className="cp-admin-notice report-only-agent-notice" data-tone="warning" data-overdue={overdue(agent) || undefined}><Eye size={18} aria-hidden="true" /><div><strong>Report-only since {utc(agent.since ?? '2026-11-04T18:00:00Z')} · by {agent.by ?? 'Beatriz Nunes'}</strong>
          <span className="report-only-review">{agent.reviewBy ? overdue(agent) ? <span className="mcp-badge" data-tone="danger">Review overdue since {day(agent.reviewBy)}</span> : <>Review by <strong>{day(agent.reviewBy)}</strong></> : 'No review date'} · <button type="button" className="rule-switch" onClick={() => setDateDialog(true)}>{agent.reviewBy ? 'Change date' : 'Set a review date'}</button></span>
          {agent.wouldDeny24h ? <>{agent.wouldDeny24h} calls would have been denied in the last 24 hours. Last at {utc(agent.lastWouldDeny!)}. </> : <>No call would have been denied in 7 days. </>}
          <button type="button" className="rule-switch">View would-deny calls</button> · <button type="button" className="rule-switch" onClick={onHistory}>History</button></div>
          <WaitingBackend spec={BACKEND_SPEC} tip="Shows when the agent entered Report-only, who changed it, its optional review date and its would-deny calls." /></div> : null}
        <div className="cp-admin-inner-tabs agent-views" role="group" aria-label="Agent view">{['Delegation and access', 'Identity', 'Harness sessions'].map((l, i) => <button key={l} type="button" aria-pressed={i === 0}>{l}</button>)}</div>
        <p className="cp-admin-muted report-only-placeholder">The Delegation and access editor stays as it is. The mode does not change the permission document.</p>
      </section>
    </div>
    {dateDialog ? <ReviewDateDialog agent={agent} onClose={() => setDateDialog(false)} onDone={reviewBy => { setState(s => ({ ...s, [agent.id]: { ...s[agent.id], reviewBy } })); setDateDialog(false); }} /> : null}
    {dialog ? <ModeDialog agent={agent} onClose={() => setDialog(false)} onDone={(mode, reviewBy) => { setState(s => ({ ...s, [agent.id]: { mode, reviewBy: mode === 'report_only' ? reviewBy : undefined } })); setDialog(false); }} /> : null}
  </section>;
}
