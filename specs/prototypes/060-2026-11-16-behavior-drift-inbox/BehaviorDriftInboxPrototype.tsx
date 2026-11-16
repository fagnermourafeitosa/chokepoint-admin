import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { SelectMenu } from '../../../src/components/ui/dropdown/SelectMenu';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import '../../../src/features/attention/attention.css';
import './prototype.css';
import { items, slackChoices } from './data';

// Admin 060 prototype: the Inbox (a copy of src/features/attention/AttentionInbox.tsx on 2026-11-16,
// fixed data) with Behavior drift rows of Backend 099, and the "What to send" section of the Slack
// settings (src/features/externalapps/SlackForm.tsx) with the new type, off by default.

const severityLabel = { high: 'High', medium: 'Medium', low: 'Low' } as const;

export function BehaviorDriftInboxPrototype() {
  const [type, setType] = useState('all');
  const [severity, setSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [on, setOn] = useState<string[]>(slackChoices.filter(c => c.on).map(c => c.type));
  const shown = items.filter(i => (type === 'all' || i.type === type) && (severity === 'all' || i.severity === severity));
  const types = [...new Map(items.map(i => [i.type, i.label])).entries()];
  return <main className="admin-page cp-admin-container drift-prototype" aria-label="Behavior drift prototype">
    <section className="cp-admin-panel attention-inbox" aria-labelledby="drift-inbox-heading">
      <header className="attention-inbox-header"><div><span className="attention-kicker">Inbox</span><h2 id="drift-inbox-heading">{items.filter(i => i.status === 'Open').length} items need attention</h2></div>
        <div className="attention-filters">
          <SelectMenu group="inbox-filters" label="Filter by status" value="active" onChange={() => undefined} options={[{ value: 'active', label: 'Open and reviewed' }]} />
          <SelectMenu group="inbox-filters" label="Filter by severity" value={severity} onChange={v => setSeverity(v as typeof severity)} options={[{ value: 'all', label: 'All severities' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
          <SelectMenu group="inbox-filters" label="Filter by type" value={type} onChange={setType} options={[{ value: 'all', label: 'All types' }, ...types.map(([value, label]) => ({ value, label }))]} />
        </div>
      </header>
      <div className="attention-table" role="table" aria-label="Inbox items">
        <div className="attention-row attention-head" role="row">{['Severity', 'Type', 'Subject', 'Context', 'When', 'Action'].map(v => <span role="columnheader" key={v}>{v}</span>)}</div>
        {shown.map(item => <div key={item.id} className={`attention-row attention-row--${item.status.toLowerCase()}`} role="row">
          <span role="cell"><span className={`severity-chip severity-chip--${item.severity}`}>{severityLabel[item.severity]}</span></span>
          <span role="cell"><span className={`attention-tag attention-tag--${item.type}`}>{item.label}</span>{item.drift ? <WaitingBackend spec="099" tip="Shows that an agent left its usage pattern: a spike, a new tool or a new order of calls." /> : null}</span>
          <span role="cell" className="attention-main"><strong>{item.subject}</strong><small>{item.note}</small></span>
          <span role="cell" className="attention-main attention-context"><code>{item.primary}</code><small>{item.secondary}</small></span>
          <span role="cell" className="attention-when"><time>{item.when}</time><small className="attention-status-chip">{item.status}</small></span>
          <span role="cell" className="attention-action"><button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small">{item.action}<ArrowRight size={14} /></button></span>
        </div>)}
      </div>
    </section>

    <section className="cp-admin-panel drift-slack" aria-labelledby="drift-slack-heading">
      <header><span className="attention-kicker">Integrations · External apps · Slack</span><h2 id="drift-slack-heading">What to send</h2><p className="cp-admin-muted">Choose which Inbox signals become a Slack message. Each new signal sends one message with a link to it.</p></header>
      <div className="drift-slack-choices">
        {slackChoices.map(c => <label key={c.type} className="cp-admin-choice"><input className="cp-admin-switch" type="checkbox" role="switch" checked={on.includes(c.type)} onChange={e => setOn(cur => e.target.checked ? [...cur, c.type] : cur.filter(t => t !== c.type))} /><span className="cp-admin-choice-copy"><strong>{c.label}{'isNew' in c ? <WaitingBackend spec="099" tip="Sends a Slack message for each Behavior drift signal, off by default." /> : null}</strong><small>{c.description}</small></span></label>)}
      </div>
    </section>
  </main>;
}
