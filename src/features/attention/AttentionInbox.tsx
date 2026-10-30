import { useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { signalTypeLabels, typeLabel } from './api';
import type { SignalType, StatusFilter } from './api';
import { contextLines, targetPath } from './targets';
import type { useInbox } from './useAttention';
import { QueryError, TracePager, utcTime } from '../investigate/TraceUI';
type Inbox = ReturnType<typeof useInbox>;
export function AttentionInbox({ inbox, headingId }: { inbox: Inbox; headingId: string }) {
  const navigate = useNavigate();
  const { list, counts, type, page, status } = inbox;
  return <section className="cp-admin-panel attention-inbox" aria-labelledby={headingId}>
    <header className="attention-inbox-header"><div><span className="attention-kicker">Inbox</span><h2 id={headingId}>{counts.data ? counts.data.pending === 0 ? 'All clear for now' : `${counts.data.pending} ${counts.data.pending === 1 ? 'item needs' : 'items need'} attention` : 'Items that need attention'}</h2></div>
      <div className="attention-filters"><label><span className="attention-sr-only">Filter by status</span><select className="cp-admin-input" value={status} onChange={e => inbox.setStatus(e.target.value as StatusFilter)}><option value="active">Open and reviewed</option><option value="open">Open</option><option value="reviewed">Reviewed</option><option value="resolved">Resolved</option><option value="all">All statuses</option></select></label><label><span className="attention-sr-only">Filter by type</span><select className="cp-admin-input" value={type} onChange={e => inbox.setType(e.target.value as SignalType | 'all')}><option value="all">All types</option>{(Object.keys(signalTypeLabels) as SignalType[]).map(k => <option key={k} value={k}>{signalTypeLabels[k]}</option>)}</select></label></div>
    </header>
    {counts.isError ? <QueryError text="The attention count could not be loaded." retry={() => void counts.refetch()} /> : null}
    {list.isError ? <QueryError text="The Inbox could not be loaded." retry={() => void list.refetch()} /> : list.isPending ? <p role="status" className="attention-status">Loading Inbox…</p> : list.data.items.length ? <div className="attention-table" role="table" aria-label="Inbox items"><div className="attention-row attention-head" role="row">{['Type', 'Subject', 'Context', 'When', 'Action'].map(v => <span role="columnheader" key={v}>{v}</span>)}</div>{list.data.items.map(item => { const [primary, secondary] = contextLines(item); const path = targetPath(item); return <div key={item.id} className={`attention-row attention-row--${item.status}`} role="row"><span role="cell"><span className={`attention-tag attention-tag--${item.type}`}>{typeLabel(item.type)}</span></span><span role="cell" className="attention-main"><strong>{item.subject}</strong><small>{item.note}</small></span><span role="cell" className="attention-main attention-context"><code>{primary}</code>{secondary ? <small>{secondary}</small> : null}</span><span role="cell" className="attention-when"><time dateTime={item.occurred_at}>{utcTime(item.occurred_at)}</time>{item.status !== 'open' ? <small className="attention-status-chip">{item.status === 'reviewed' ? 'Reviewed' : 'Resolved'}</small> : null}</span><span role="cell" className="attention-action">{path ? <button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => navigate(path)}>{item.target_label}<ArrowRight size={14} /></button> : <small>Target unavailable</small>}</span></div>; })}</div> : <div className="trace-empty"><strong>No items match these filters.</strong><p>Change the status or type to see other Inbox items.</p></div>}
    <TracePager page={page} total={list.data?.total || 0} size={list.data?.page_size || 5} busy={list.isFetching} onPage={inbox.setPage} />
  </section>;
}
