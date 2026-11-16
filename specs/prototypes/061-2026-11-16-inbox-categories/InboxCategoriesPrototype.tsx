import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { SelectMenu } from '../../../src/components/ui/dropdown/SelectMenu';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import '../../../src/features/attention/attention.css';
import '../060-2026-11-16-behavior-drift-inbox/prototype.css';
import { items as driftItems, type Item } from '../060-2026-11-16-behavior-drift-inbox/data';

// Admin 061 prototype: the Inbox of the Admin 060 prototype (fixed data, Acme Production) with tabs by
// category (Backend 100). All is the default; Security comes first after it.

type Category = 'security' | 'access' | 'operations';
const categoryOf: Record<string, Category> = {
  'behavior-drift': 'security', 'lethal-trifecta': 'security', 'tool-discovery': 'security',
  'requests-denied': 'access', 'token_exchange_denied': 'access', 'report-only-would-deny': 'access', 'report-only-review-due': 'access',
  'mcpserver_disconnected': 'operations',
};
const extra: Item[] = [
  { id: 'x1', severity: 'high', type: 'tool-discovery', label: 'Tool discovery', subject: 'Acme Support', note: 'An automatic rediscovery found changes. Review them before the tools run again.', primary: 'Acme Support', secondary: '1 changed', when: '2026-11-16 10:30 UTC', status: 'Open', action: 'Review tools' },
  { id: 'x2', severity: 'high', type: 'mcpserver_disconnected', label: 'Server disconnected', subject: 'Acme Billing', note: 'The last rediscovery got no answer from the server.', primary: 'Acme Billing', secondary: 'No answer from the server', when: '2026-11-16 09:45 UTC', status: 'Open', action: 'Open server' },
  { id: 'x3', severity: 'medium', type: 'token_exchange_denied', label: 'Token exchange denied', subject: 'support-triage', note: 'Token exchanges of this agent fail.', primary: '4 refused · The subject token expired', secondary: 'support-triage for maria@acme.test', when: '2026-11-16 09:10 UTC', status: 'Open', action: 'Open exchanges' },
];
const order = { high: 0, medium: 1, low: 2 } as const;
const items = [...driftItems, ...extra].sort((a, b) => order[a.severity] - order[b.severity]);
const tabs: { value: 'all' | Category; label: string }[] = [{ value: 'all', label: 'All' }, { value: 'security', label: 'Security' }, { value: 'access', label: 'Access' }, { value: 'operations', label: 'Operations' }];
const severityLabel = { high: 'High', medium: 'Medium', low: 'Low' } as const;

export function InboxCategoriesPrototype() {
  const [tab, setTab] = useState<'all' | Category>('all');
  const [type, setType] = useState('all');
  const inTab = items.filter(i => tab === 'all' || categoryOf[i.type] === tab);
  const shown = inTab.filter(i => type === 'all' || i.type === type);
  const open = (t: 'all' | Category) => items.filter(i => i.status === 'Open' && (t === 'all' || categoryOf[i.type] === t)).length;
  const types = [...new Map(inTab.map(i => [i.type, i.label])).entries()];
  return <main className="admin-page cp-admin-container drift-prototype" aria-label="Inbox categories prototype">
    <section className="cp-admin-panel attention-inbox" aria-labelledby="cat-inbox-heading">
      <header className="attention-inbox-header"><div><span className="attention-kicker">Inbox</span><h2 id="cat-inbox-heading">{open('all')} items need attention</h2></div>
        <div className="attention-filters">
          <SelectMenu group="inbox-filters" label="Filter by status" value="active" onChange={() => undefined} options={[{ value: 'active', label: 'Open and reviewed' }]} />
          <SelectMenu group="inbox-filters" label="Filter by severity" value="all" onChange={() => undefined} options={[{ value: 'all', label: 'All severities' }]} />
          <SelectMenu group="inbox-filters" label="Filter by type" value={type} onChange={setType} options={[{ value: 'all', label: 'All types' }, ...types.map(([value, label]) => ({ value, label }))]} />
        </div>
      </header>
      <div className="cat-tabs">
        <div className="cp-admin-segmented" role="radiogroup" aria-label="Category">
          {tabs.map(t => <label key={t.value} className="cp-admin-segment"><input type="radio" name="inbox-category" value={t.value} checked={tab === t.value} onChange={() => { setTab(t.value); setType('all'); }} /><span>{t.label} ({open(t.value)})</span></label>)}
        </div>
        <WaitingBackend spec="100" tip="Splits the Inbox by the category of each signal (Access, Security, Operations), with the open count of each one." />
      </div>
      <div className="attention-table" role="table" aria-label="Inbox items">
        <div className="attention-row attention-head" role="row">{['Severity', 'Type', 'Subject', 'Context', 'When', 'Action'].map(v => <span role="columnheader" key={v}>{v}</span>)}</div>
        {shown.map(item => <div key={item.id} className={`attention-row attention-row--${item.status.toLowerCase()}`} role="row">
          <span role="cell"><span className={`severity-chip severity-chip--${item.severity}`}>{severityLabel[item.severity]}</span></span>
          <span role="cell"><span className={`attention-tag attention-tag--${item.type}`}>{item.label}</span></span>
          <span role="cell" className="attention-main"><strong>{item.subject}</strong><small>{item.note}</small></span>
          <span role="cell" className="attention-main attention-context"><code>{item.primary}</code><small>{item.secondary}</small></span>
          <span role="cell" className="attention-when"><time>{item.when}</time><small className="attention-status-chip">{item.status}</small></span>
          <span role="cell" className="attention-action"><button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small">{item.action}<ArrowRight size={14} /></button></span>
        </div>)}
      </div>
    </section>
  </main>;
}
