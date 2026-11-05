import { ArrowRight, Search } from 'lucide-react';
import { SelectMenu } from '../../../components/ui/dropdown/SelectMenu';
import { WaitingBackend } from '../../access/delegation/WaitingBackend';
import { useState } from 'react';
import { decisions, denyText, exchanges, exchangeShort, exchangeText, type Decision, type Exchange } from './fixtures';

export type View = 'problems' | 'decisions' | 'exchanges';
export type Filters = { text: string; reason: string };

function SubjectCell({ s }: { s?: Decision['subject'] }) {
  if (!s) return <span className="cp-admin-muted">Not verified</span>;
  return <><strong className="proto-subject">{s.name}<span className="people-kind-chip" data-kind={s.kind === 'person' ? 'person' : 'service'}>{s.kind === 'person' ? 'Person' : 'Service'}</span></strong><small>{s.issuer}</small></>;
}

const match = (q: string, ...v: (string | undefined)[]) => !q || v.some(x => x?.toLowerCase().includes(q));

function DecisionRows({ items, grouped, onOpen }: { items: Decision[]; grouped: boolean; onOpen: (id: string) => void }) {
  return <div className="trace-table" role="table">
    <div className="trace-list-row trace-list-head proto-row" role="row"><div role="columnheader">Result</div><div role="columnheader">Agent</div><div role="columnheader">On behalf of</div><div role="columnheader">MCP server / tool</div><div role="columnheader">Resource</div><div role="columnheader"><span className="attention-sr-only">Open detail</span></div></div>
    {items.map(d => <div key={d.id} className="trace-list-row trace-list-row--open proto-row" role="row" title="Open the decision details" onClick={() => onOpen(d.id)}>
      <div role="cell"><span className={`trace-outcome ${d.permit ? 'trace-allow' : 'trace-deny'}`}>{d.permit ? 'ALLOW' : 'DENY'}</span>{d.reason ? <small className="trace-reason">{denyText[d.reason]}</small> : null}</div>
      <div role="cell"><strong>{d.agent}</strong><small>Verified agent</small></div>
      <div role="cell"><SubjectCell s={d.subject} /></div>
      <div role="cell"><strong>{d.server}</strong><small className="trace-mono">{d.tool}</small>{grouped && d.count > 1 ? <small className="trace-repeat">×{d.count} in window · last {d.at} UTC</small> : <small>{d.at} UTC</small>}</div>
      <div role="cell">{d.resource ? <><small>{d.resource.type}</small><strong className="trace-mono">{d.resource.value}</strong></> : <small>No resource check</small>}</div>
      <div role="cell"><button className="trace-row-open" aria-label={`Open decision ${d.id}`} title="Open the decision details" onClick={e => { e.stopPropagation(); onOpen(d.id); }}><ArrowRight size={16} /></button></div>
    </div>)}
    {!items.length ? <p className="trace-empty">No decision matches the filters.</p> : null}
  </div>;
}

function ExchangeRows({ items, onOpen }: { items: Exchange[]; onOpen: (id: string) => void }) {
  return <div className="trace-table" role="table">
    <div className="trace-list-row trace-list-head proto-row proto-row--exchange" role="row"><div role="columnheader">Result</div><div role="columnheader">Agent</div><div role="columnheader">Subject</div><div role="columnheader">When</div><div role="columnheader"><span className="attention-sr-only">Open detail</span></div></div>
    {items.map(x => <div key={x.id} className="trace-list-row trace-list-row--open proto-row proto-row--exchange" role="row" title="Open the token exchange details" onClick={() => onOpen(x.id)}>
      <div role="cell"><span className={`trace-outcome ${x.issued ? 'trace-allow' : 'trace-deny'}`}>{x.issued ? 'ISSUED' : 'REFUSED'}</span><small className="trace-reason" title={x.reason ? exchangeText[x.reason] : undefined}>{x.reason ? exchangeShort[x.reason] : 'Token for 5 minutes'}</small></div>
      <div role="cell"><strong>{x.agent}</strong></div>
      <div role="cell"><SubjectCell s={x.subject} /></div>
      <div role="cell">{x.count > 1 ? <small className="trace-repeat">×{x.count} in window · last {x.at} UTC</small> : <small>{x.at} UTC</small>}</div>
      <div role="cell"><button className="trace-row-open" aria-label={`Open exchange ${x.id}`} title="Open the token exchange details" onClick={e => { e.stopPropagation(); onOpen(x.id); }}><ArrowRight size={16} /></button></div>
    </div>)}
    {!items.length ? <p className="trace-empty">No token exchange matches the filters.</p> : null}
  </div>;
}

export function ProtoLists({ view, onView, filters, onFilters, onOpen }: { view: View; onView: (v: View) => void; filters: Filters; onFilters: (f: Filters) => void; onOpen: (kind: 'decision' | 'exchange', id: string) => void }) {
  const q = filters.text.trim().toLowerCase();
  const isExchange = view === 'exchanges';
  const reasons = isExchange ? Object.keys(exchangeText) : Object.keys(denyText);
  const ds = decisions.filter(d => (view === 'decisions' || !d.permit) && (!filters.reason || d.reason === filters.reason) && match(q, d.agent, d.subject.name, d.subject.issuer, d.server, d.tool, d.resource?.value));
  const xs = exchanges.filter(x => (!filters.reason || x.reason === filters.reason) && match(q, x.agent, x.subject?.name, x.subject?.issuer));
  const [query, setQuery] = useState(filters.text);
  return <section className="cp-admin-panel trace-list">
    <div className="trace-toolbar">
      <div className="trace-segments" role="group" aria-label="Investigation view">
        <button aria-pressed={view === 'problems'} onClick={() => onView('problems')}>By problem</button>
        <button aria-pressed={view === 'decisions'} onClick={() => onView('decisions')}>All decisions</button>
        <button aria-pressed={isExchange} onClick={() => onView('exchanges')}>Token exchanges</button>
      </div>
      <form className="trace-search" role="search" onSubmit={e => { e.preventDefault(); onFilters({ ...filters, text: query }); }}>
        <label className="attention-sr-only" htmlFor="proto-search">Search</label>
        <input id="proto-search" type="search" className="cp-admin-input" placeholder={isExchange ? 'Search agent, subject or identity provider…' : 'Search agent, subject, server, tool or resource…'} value={query} onChange={e => { setQuery(e.target.value); if (!e.target.value) onFilters({ ...filters, text: '' }); }} />
        <button className="cp-admin-button cp-admin-button--secondary" type="submit">Search</button>
      </form>
      <SelectMenu group="investigate-filters" label="Agent" value="" onChange={() => undefined} options={[{ value: '', label: 'All agents' }, { value: 'issues-manager', label: 'issues-manager' }]} />
      <SelectMenu group="investigate-filters" label="Reason" value={filters.reason} onChange={v => onFilters({ ...filters, reason: v })} options={[{ value: '', label: 'All reasons' }, ...reasons.map(r => ({ value: r, label: isExchange ? exchangeShort[r as keyof typeof exchangeShort] : r }))]} />
    </div>
    <div className="trace-list-title"><span className="proto-kicker"><span className="attention-kicker">{isExchange ? 'Token exchanges' : view === 'problems' ? 'Problems' : 'Decisions'}</span><WaitingBackend spec="034" tip="Shows every token exchange: which agent asked for a token for which subject, and why Chokepoint refused it." /></span><span>{isExchange ? xs.length : ds.length} {isExchange ? 'records' : view === 'problems' ? 'problems' : 'decisions'}</span></div>
    {isExchange ? <ExchangeRows items={xs} onOpen={id => onOpen('exchange', id)} /> : <DecisionRows items={ds} grouped={view === 'problems'} onOpen={id => onOpen('decision', id)} />}
  </section>;
}
