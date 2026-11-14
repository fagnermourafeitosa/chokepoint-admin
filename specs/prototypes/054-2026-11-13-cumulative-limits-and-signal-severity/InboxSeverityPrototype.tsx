import { useState } from 'react';
import { ArrowRight, Eye } from 'lucide-react';
import { SelectMenu } from '../../../src/components/ui/dropdown/SelectMenu';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import '../../../src/features/attention/attention.css';
import './limits.css';

// Admin 054 prototype: the Inbox (a copy of src/features/attention/AttentionInbox.tsx on 2026-11-13,
// fixed data) ordered by severity, then by time, with a severity chip on each item (Backend 088).
// Severity 3 is high, 2 medium, 1 and 0 low: 0 and 1 share the label and differ only in the order.

type Item = { id: string; severity: 0 | 1 | 2 | 3; type: string; label: string; reportOnly?: boolean; subject: string; note: string; primary: string; secondary: string; when: string; status: string; action: string };

const items: Item[] = [
  { id: 's1', severity: 3, type: 'mcpserver_disconnected', label: 'Server disconnected', subject: 'Acme Billing', note: 'The last rediscovery got no answer from the server.', primary: 'Acme Billing', secondary: 'reason: unreachable', when: '2026-11-13 22:45 UTC', status: 'Open', action: 'Open server' },
  { id: 's2', severity: 3, type: 'tool-discovery', label: 'Tool discovery', subject: 'Acme Support', note: 'An automatic rediscovery found changes. Review them before the tools run again.', primary: 'Acme Support', secondary: '1 changed', when: '2026-11-13 21:30 UTC', status: 'Open', action: 'Review tools' },
  { id: 's3', severity: 2, type: 'token_exchange_denied', label: 'Token exchange denied', subject: 'support-triage', note: 'Token exchanges of this agent fail.', primary: 'subject_token_expired', secondary: '4 in 15 minutes', when: '2026-11-13 22:10 UTC', status: 'Open', action: 'Open exchanges' },
  { id: 's4', severity: 1, type: 'report-only-would-deny', label: 'Would deny', reportOnly: true, subject: 'analytics-reporter', note: 'Its policy would deny these calls.', primary: 'run_report', secondary: 'reach_limit · 3 calls', when: '2026-11-13 22:40 UTC', status: 'Reviewed', action: 'Open decision' },
  { id: 's5', severity: 0, type: 'requests-denied', label: 'Requests denied', subject: 'refunds-assistant', note: 'Calls of this agent were denied.', primary: 'refund_order', secondary: 'reach_limit · 6 calls', when: '2026-11-13 22:50 UTC', status: 'Open', action: 'Open decision' },
];

const levels = { 3: 'high', 2: 'medium', 1: 'low', 0: 'low' } as const;

export function InboxSeverityPrototype() {
  const [severity, setSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const shown = items.filter(i => severity === 'all' || levels[i.severity] === severity);
  return <main className="admin-page cp-admin-container" aria-label="Inbox severity prototype">
    <section className="cp-admin-panel attention-inbox" aria-labelledby="inbox-heading">
      <header className="attention-inbox-header"><div><span className="attention-kicker">Inbox</span><h2 id="inbox-heading" className="severity-heading">5 items need attention<WaitingBackend spec="088" tip="Lists the items by severity, then by time, and shows the severity of each one. A changed tool or a disconnected server comes before a denied call." /></h2></div>
        <div className="attention-filters"><SelectMenu group="inbox-filters" label="Filter by status" value="active" onChange={() => undefined} options={[{ value: 'active', label: 'Open and reviewed' }, { value: 'all', label: 'All statuses' }]} /><SelectMenu group="inbox-filters" label="Filter by severity" value={severity} onChange={v => setSeverity(v as typeof severity)} options={[{ value: 'all', label: 'All severities' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} /><SelectMenu group="inbox-filters" label="Filter by type" value="all" onChange={() => undefined} options={[{ value: 'all', label: 'All types' }, ...items.map(i => ({ value: i.type, label: i.label }))]} /><WaitingBackend spec="088" tip="Shows only the items of one severity. Low covers severity 1 and 0." /></div>
      </header>
      <div className="attention-table" role="table" aria-label="Inbox items">
        <div className="attention-row attention-head severity-row" role="row">{['Severity', 'Type', 'Subject', 'Context', 'When', 'Action'].map(v => <span role="columnheader" key={v}>{v}</span>)}</div>
        {shown.map(item => <div key={item.id} className={`attention-row severity-row attention-row--${item.status.toLowerCase()}`} role="row">
          <span role="cell"><span className={`severity-chip severity-chip--${levels[item.severity]}`}>{levels[item.severity] === 'high' ? 'High' : levels[item.severity] === 'medium' ? 'Medium' : 'Low'}</span></span>
          <span role="cell"><span className={`attention-tag attention-tag--${item.type}${item.reportOnly ? ' cp-would-deny' : ''}`}>{item.reportOnly ? <Eye size={12} aria-label="Report-only" /> : null}{item.label}</span>{item.type === 'mcpserver_disconnected' ? <WaitingBackend spec="088" tip="A server that the automatic rediscovery cannot reach. It resolves itself when the server answers again." /> : null}</span>
          <span role="cell" className="attention-main"><strong>{item.subject}</strong><small>{item.note}</small></span>
          <span role="cell" className="attention-main attention-context"><code>{item.primary}</code><small>{item.secondary}</small></span>
          <span role="cell" className="attention-when"><time>{item.when}</time><small className="attention-status-chip">{item.status}</small></span>
          <span role="cell" className="attention-action"><button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small">{item.action}<ArrowRight size={14} /></button></span>
        </div>)}
      </div>
    </section>
  </main>;
}
