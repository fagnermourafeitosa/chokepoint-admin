import './enforcement.css';
import { useContext, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reportOnlyKey } from '../../../components/report-only/ReportOnlyBanner';
import { Eye, ShieldCheck } from 'lucide-react';
import { HttpError } from '../../../api/http-client';
import { Dialog } from '../../../components/ui/dialog/Dialog';
import { ReviewOverdueChip, reviewDay, reviewOverdue, todayUTC } from '../../../components/report-only/ReportOnlyChip';
import { AdminEnvironmentContext } from '../../../app/context/AdminEnvironmentContext';
import { traceApi, traceKey } from '../../investigate/api';
import { agentApi, agentKey, type AgentRecord, type AgentScope, type EnforcementChange } from '../agent-api';

// The enforcement mode of an agent (Admin 041, Backend 057): its notice, the mode
// dialog and the review date dialog. The mode applies at the next call.

const utc = (at: string) => new Date(at).toLocaleString('en', { timeZone: 'UTC', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' UTC';

// The would-deny calls of one agent since a time: their count and the latest.
export function useWouldDeny(scope: AgentScope, agentId: string, hours: number, enabled: boolean) {
  return useQuery({
    queryKey: [...agentKey(scope), 'would-deny', agentId, hours],
    enabled,
    queryFn: ({ signal }) => traceApi.decisions(scope, { agent: agentId, result: 'would_deny', from: new Date(Date.now() - hours * 3600000).toISOString(), page_size: '1' }, signal),
    select: (page) => ({ total: page.total, last: page.items[0]?.decided_at }),
  });
}

type Changed = { onChanged: (agent: AgentRecord) => void; onReload: () => void };

// send changes the mode or the review date and maps a stale revision to a reload.
function useChange(scope: AgentScope, agent: AgentRecord, { onChanged }: Changed) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; conflict: boolean }>();
  const cache = useQueryClient();
  async function send(change: EnforcementChange) {
    setBusy(true); setError(undefined);
    try {
      onChanged(await agentApi.setEnforcement(scope, agent.id, agent.revision, change));
      // The banner and the Overview show the new mode.
      void cache.invalidateQueries({ queryKey: reportOnlyKey(scope) });
      void cache.invalidateQueries({ queryKey: [...traceKey(scope), 'overview'] });
      return true;
    } catch (cause) {
      const conflict = cause instanceof HttpError && cause.status === 409;
      setError({ conflict, message: conflict ? 'The agent changed in another session. Reload to see its current mode.' : 'Could not save the change. Check the date and retry.' });
      return false;
    } finally { setBusy(false); }
  }
  return { busy, error, send };
}

function ChangeError({ error, onReload }: { error?: { message: string; conflict: boolean }; onReload: () => void }) {
  return error ? <div role="alert" className="cp-admin-notice" data-tone="danger">{error.message}{error.conflict ? <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={onReload}>Reload</button> : null}</div> : null;
}

type DialogProps = { scope: AgentScope; agent: AgentRecord; onClose: () => void } & Changed;

// ModeDialog switches the agent to Report-only or back to Enforce.
export function ModeDialog({ scope, agent, onClose, onChanged, onReload }: DialogProps) {
  const toEnforce = agent.enforcement === 'report_only';
  const production = useContext(AdminEnvironmentContext) === 'Production';
  const [note, setNote] = useState('');
  const [reviewBy, setReviewBy] = useState('');
  const recent = useWouldDeny(scope, agent.id, 24, toEnforce);
  const { busy, error, send } = useChange(scope, agent, { onChanged, onReload });
  async function save() {
    const change: EnforcementChange = { enforcement: toEnforce ? 'enforce' : 'report_only', ...(note.trim() ? { note: note.trim() } : {}), ...(!toEnforce && reviewBy ? { review_by: reviewBy } : {}) };
    if (await send(change)) onClose();
  }
  return <Dialog title={toEnforce ? 'Enforce access' : 'Switch to Report-only'} onClose={onClose}>
    <div className="admin-dialog-body report-only-dialog">
      {toEnforce
        ? <><p><strong>{agent.name}</strong> starts to block each call that its tool grants, resources and call rules deny.</p>
          <p className="cp-admin-muted" role="status">{recent.isPending ? 'Counting the would-deny calls of the last 24 hours…'
            : recent.isError ? 'The would-deny calls of the last 24 hours could not be counted. Check them in Investigate before you enforce.'
              : recent.data.total ? `${recent.data.total} ${recent.data.total === 1 ? 'call' : 'calls'} would have been denied in the last 24 hours. After this change, those calls fail with a reference code.`
                : 'No call would have been denied in the last 24 hours.'}</p></>
        : <><p><strong>{agent.name}</strong> runs each call. Chokepoint still evaluates the tool grants, resources and call rules and records a denied call as <em>Would deny</em>, but it does not block it.</p>
          <p className="report-only-always"><ShieldCheck size={14} aria-hidden="true" />Always enforced: delegation, a valid token, an enabled identity connection and the kill switch.</p>
          {production ? <p className="cp-admin-notice" data-tone="danger">In Production, this agent is not protected by its policy until you switch it back to Enforce.</p> : null}
          <label className="report-only-field"><span className="cp-admin-muted">Review by (optional)</span><input className="cp-admin-input report-only-date" type="date" min={todayUTC()} value={reviewBy} onChange={e => setReviewBy(e.target.value)} /><small className="cp-admin-muted">On this date, the Inbox reminds you to review the mode. The agent stays in Report-only until you change it.</small></label></>}
      <label className="report-only-field"><span className="cp-admin-muted">Why this change? (optional)</span><input className="cp-admin-input" maxLength={500} value={note} onChange={e => setNote(e.target.value)} /></label>
      <p className="cp-admin-muted">The change is recorded in the revision history with your name and the note.</p>
      <ChangeError error={error} onReload={() => { onClose(); onReload(); }} />
    </div>
    <div className="admin-dialog-actions">
      <button className="cp-admin-button cp-admin-button--secondary" disabled={busy} onClick={onClose}>Cancel</button>
      <button className="cp-admin-button" disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : toEnforce ? 'Enforce access' : 'Switch to Report-only'}</button>
    </div>
  </Dialog>;
}

// ReviewDateDialog sets, changes or removes the review date; the mode stays.
export function ReviewDateDialog({ scope, agent, onClose, onChanged, onReload }: DialogProps) {
  const had = !!agent.review_by;
  const [reviewBy, setReviewBy] = useState(agent.review_by && !reviewOverdue(agent.review_by) ? agent.review_by : '');
  const [note, setNote] = useState('');
  const { busy, error, send } = useChange(scope, agent, { onChanged, onReload });
  async function save(date: string | undefined) {
    if (await send({ enforcement: 'report_only', ...(date ? { review_by: date } : {}), ...(note.trim() ? { note: note.trim() } : {}) })) onClose();
  }
  return <Dialog title={had ? 'Change review date' : 'Set a review date'} onClose={onClose}>
    <div className="admin-dialog-body report-only-dialog">
      <p><strong>{agent.name}</strong> stays in Report-only. On the review date, the Inbox reminds you to review the mode.</p>
      {agent.review_by ? <p className="cp-admin-muted">Current date: {reviewDay(agent.review_by)}{reviewOverdue(agent.review_by) ? ' (overdue)' : ''}.</p> : null}
      <label className="report-only-field"><span className="cp-admin-muted">Review by</span><input className="cp-admin-input report-only-date" type="date" min={todayUTC()} value={reviewBy} onChange={e => setReviewBy(e.target.value)} /></label>
      <label className="report-only-field"><span className="cp-admin-muted">Why this change? (optional)</span><input className="cp-admin-input" maxLength={500} value={note} onChange={e => setNote(e.target.value)} /></label>
      <p className="cp-admin-muted">The change is recorded in the revision history with your name and the note.</p>
      <ChangeError error={error} onReload={() => { onClose(); onReload(); }} />
    </div>
    <div className="admin-dialog-actions">
      {had ? <button className="cp-admin-button cp-admin-button--ghost report-only-remove" disabled={busy} onClick={() => void save(undefined)}>Remove date</button> : null}
      <button className="cp-admin-button cp-admin-button--secondary" disabled={busy} onClick={onClose}>Cancel</button>
      <button className="cp-admin-button" disabled={busy || !reviewBy} onClick={() => void save(reviewBy)}>{busy ? 'Saving…' : 'Save date'}</button>
    </div>
  </Dialog>;
}

type NoticeProps = { scope: AgentScope; agent: AgentRecord; onChangeDate: () => void; onViewCalls: () => void; onHistory: () => void };

// ReportOnlyNotice says since when and by whom the agent is in Report-only, its
// review date and its would-deny calls of the last 24 hours.
export function ReportOnlyNotice({ scope, agent, onChangeDate, onViewCalls, onHistory }: NoticeProps) {
  const recent = useWouldDeny(scope, agent.id, 24, true);
  const quiet = useWouldDeny(scope, agent.id, 24 * 7, recent.data?.total === 0);
  const overdue = reviewOverdue(agent.review_by);
  return <div className="cp-admin-notice cp-report-only-notice agent-report-only-notice" data-overdue={overdue || undefined}>
    <Eye size={18} aria-hidden="true" />
    <div>
      <strong>Report-only{agent.enforcement_changed_at ? ` since ${utc(agent.enforcement_changed_at)}` : ''}{agent.enforcement_changed_by_name ? ` · by ${agent.enforcement_changed_by_name}` : ''}</strong>
      <span className="report-only-review">
        {agent.review_by ? overdue ? <ReviewOverdueChip since={reviewDay(agent.review_by)} /> : <>Review by <strong>{reviewDay(agent.review_by)}</strong></> : 'No review date'}
        {' · '}<button type="button" className="rule-switch" onClick={onChangeDate}>{agent.review_by ? 'Change date' : 'Set a review date'}</button>
      </span>
      <span>
        {recent.isError ? 'The would-deny calls could not be loaded. '
          : recent.data?.total ? `${recent.data.total} ${recent.data.total === 1 ? 'call' : 'calls'} would have been denied in the last 24 hours.${recent.data.last ? ` Last at ${utc(recent.data.last)}.` : ''} `
            : quiet.data?.total === 0 ? 'No call would have been denied in 7 days. ' : recent.data ? 'No call would have been denied in the last 24 hours. ' : ''}
        <button type="button" className="rule-switch" onClick={onViewCalls}>View would-deny calls</button>{' · '}<button type="button" className="rule-switch" onClick={onHistory}>History</button>
      </span>
    </div>
  </div>;
}
