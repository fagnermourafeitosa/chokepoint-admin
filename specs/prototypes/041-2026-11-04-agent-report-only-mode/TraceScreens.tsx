import { useState } from 'react';
import { ArrowRight, Eye, X } from 'lucide-react';
import { SelectMenu } from '../../../src/components/ui/dropdown/SelectMenu';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import { BACKEND_SPEC, decisions, inbox, reportOnly, subjectIssuer, utc, type Outcome, type ProtoInboxItem } from './data';
import { ModeChip } from './AccessScreen';
import { WouldDenyInspector } from './WouldDenyInspector';

const outcomeText: Record<Outcome, string> = { allow: 'ALLOW', deny: 'DENY', would_deny: 'WOULD DENY' };

// Investigate, All decisions, as the banner CTA opens it: Result = Would deny and the Report-only agents.
export function InvestigateScreen({ fromBanner }: { fromBanner: boolean }) {
  const [result, setResult] = useState(fromBanner ? 'would_deny' : 'all');
  const [agentFilter, setAgentFilter] = useState(fromBanner);
  const names = reportOnly.map(a => a.name);
  const [open, setOpen] = useState<string>();
  const opened = decisions.find(d => d.id === open);
  if (opened) return <section aria-label="Investigate"><WouldDenyInspector decision={opened} onBack={() => setOpen(undefined)} /></section>;
  const rows = decisions.filter(d => (result === 'all' || d.outcome === result) && (!agentFilter || names.includes(d.agent)));
  return <section aria-label="Investigate">
    <header className="trace-page-heading"><div><span className="attention-kicker">Investigate</span><h1 className="cp-admin-title">Investigate</h1></div></header>
    <section className="cp-admin-panel trace-list">
      <div className="trace-toolbar">
        <div className="trace-segments" role="group" aria-label="Investigation view"><button aria-pressed={false}>By problem</button><button aria-pressed>All decisions</button><button aria-pressed={false}>Token exchanges</button></div>
        <SelectMenu group="proto-filters" label="Period" value="1" onChange={() => undefined} options={[{ value: '1', label: 'Last 24 hours' }, { value: '7', label: 'Last 7 days' }]} />
        <SelectMenu group="proto-filters" label="Result" value={result} onChange={setResult} options={[{ value: 'all', label: 'All results' }, { value: 'deny', label: 'Deny' }, { value: 'would_deny', label: 'Would deny' }, { value: 'allow', label: 'Allow' }]} />
        <WaitingBackend spec={BACKEND_SPEC} tip="Filters the decisions that the policy would deny for an agent in Report-only." />
      </div>
      {agentFilter ? <div className="report-only-filter-row"><span className="report-only-filter-chip">Agents in Report-only: {names.join(', ')}<button type="button" aria-label="Remove the agent filter" onClick={() => setAgentFilter(false)}><X size={13} aria-hidden="true" /></button></span></div> : null}
      <div className="trace-list-title"><span className="attention-kicker">Recent decisions</span><span>{rows.length} decisions</span></div>
      <div className="trace-table" role="table" aria-label="Recorded decisions">
        <div className="trace-list-row trace-list-head trace-row-decision" role="row">{['Result', 'Agent', 'On behalf of', 'MCP server / tool', 'Resource', ''].map((n, i) => <span role="columnheader" key={i}>{n}</span>)}</div>
        {rows.map(d => <div key={d.id} className="trace-list-row trace-list-row--open trace-row-decision" role="row">
          <div role="cell"><span className={`trace-outcome ${d.outcome === 'allow' ? 'trace-allow' : d.outcome === 'deny' ? 'trace-deny' : 'trace-would-deny'}`}>{d.outcome === 'would_deny' ? <Eye size={12} aria-label="Report-only" /> : null}{outcomeText[d.outcome]}</span>{d.reason ? <small className="trace-reason">{d.reason}</small> : null}{d.outcome === 'would_deny' ? <small className="trace-reason">The call ran</small> : null}</div>
          <div role="cell"><button className="trace-filter-link">{d.agent}</button><ModeChip mode={d.mode} /></div>
          <div role="cell"><strong className="trace-subject"><span>{d.subject}</span><span className="people-kind-chip" data-kind="person">Person</span></strong><small>{subjectIssuer}</small></div>
          <div role="cell"><small>{d.server}</small><button className="trace-filter-link trace-mono">{d.tool}</button><small className="trace-repeat">{utc(d.at)}</small></div>
          <div role="cell">{d.resource ? <><small>{d.resource.type}</small><strong className="trace-mono">{d.resource.id}</strong></> : <small>No resource check</small>}</div>
          <div role="cell"><button className="trace-row-open" aria-label="Open the decision details" title={d.outcome === 'would_deny' ? 'Open the decision details' : 'The inspector of this outcome does not change'} onClick={() => { if (d.outcome === 'would_deny') setOpen(d.id); }}><ArrowRight size={17} aria-hidden="true" /></button></div>
        </div>)}
      </div>
      <p className="cp-admin-muted report-only-foot">The <em>By problem</em> view and the Deny filter never include Would deny. The detail of a Would deny call shows the same path (Delegation, Tool, Resource, Rules) and says that the call ran because the agent was in Report-only.</p>
    </section>
  </section>;
}

const kindText: Record<ProtoInboxItem['kind'], string> = { 'report-only': 'Would deny', 'review-due': 'Review due', 'requests-denied': 'Requests denied', 'tool-discovery': 'Tool discovery' };

// The Inbox with the two new kinds. The open count includes them; Requests denied never includes would-deny calls.
export function InboxScreen({ onOpen }: { onOpen: (item: ProtoInboxItem) => void }) {
  const [type, setType] = useState('all');
  const rows = inbox.filter(i => type === 'all' || i.kind === type);
  return <section className="cp-admin-panel attention-inbox" aria-label="Inbox">
    <header className="attention-inbox-header"><div><span className="attention-kicker">Inbox</span><h2>{inbox.length} items need attention</h2></div>
      <div className="attention-filters"><SelectMenu group="proto-inbox" label="Filter by status" value="active" onChange={() => undefined} options={[{ value: 'active', label: 'Open and reviewed' }]} /><SelectMenu group="proto-inbox" label="Filter by type" value={type} onChange={setType} options={[{ value: 'all', label: 'All types' }, ...(Object.keys(kindText) as ProtoInboxItem['kind'][]).map(k => ({ value: k, label: kindText[k] }))]} /><WaitingBackend spec={BACKEND_SPEC} tip="Two new Inbox item kinds: would-deny calls of an agent in Report-only, grouped by agent, tool, reason and UTC hour; and the review date of the mode." /></div>
    </header>
    <div className="attention-table" role="table" aria-label="Inbox items">
      <div className="attention-row attention-head" role="row">{['Type', 'Subject', 'Context', 'When', 'Action'].map(v => <span role="columnheader" key={v}>{v}</span>)}</div>
      {rows.map(item => <div key={item.id} className="attention-row attention-row--open" role="row">
        <span role="cell"><span className={`attention-tag attention-tag--${item.kind}`}>{item.kind === 'report-only' || item.kind === 'review-due' ? <Eye size={12} aria-label="Report-only" /> : null}{kindText[item.kind]}</span></span>
        <span role="cell" className="attention-main"><strong>{item.subject}</strong><small>{item.note}</small></span>
        <span role="cell" className="attention-main attention-context"><code>{item.context}</code>{item.secondary ? <small>{item.secondary}</small> : null}</span>
        <span role="cell" className="attention-when"><time>{utc(item.at)}</time></span>
        <span role="cell" className="attention-action"><button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => onOpen(item)}>{item.target}<ArrowRight size={14} /></button></span>
      </div>)}
    </div>
  </section>;
}
