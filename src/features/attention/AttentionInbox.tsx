import { useNavigate } from 'react-router';
import { ArrowRight, TriangleAlert } from 'lucide-react';
import { EmptyState } from '../../components/ui/empty-state/EmptyState';
import { signalTypeLabels, typeLabel } from './api';
import type { Signal, SignalType } from './api';
import { contextLines, targetPath } from './targets';
import type { useInbox } from './useAttention';

type Inbox = ReturnType<typeof useInbox>;

const time = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// AttentionInbox lists unreviewed signals, five for each page, with a type filter.
export function AttentionInbox({ inbox, headingId }: { inbox: Inbox; headingId: string }) {
  const navigate = useNavigate();
  const { list, counts, type, page } = inbox;
  const total = list.data?.total ?? 0;
  const first = total === 0 ? 0 : (page - 1) * (list.data?.page_size ?? 5) + 1;

  function open(signal: Signal) {
    const path = targetPath(signal);
    if (!path) return;
    // The review call must not block the administrator, so the page opens at once.
    inbox.markReviewed(signal);
    navigate(path);
  }

  return (
    <section className="cp-admin-panel attention-inbox" aria-labelledby={headingId}>
      <header className="attention-inbox-header">
        <div>
          <span className="attention-kicker">Inbox</span>
          <h2 id={headingId}>{counts.data ? (counts.data.pending === 1 ? '1 item needs attention' : `${counts.data.pending} items need attention`) : 'Items that need attention'}</h2>
        </div>
        <label className="attention-filter">
          <span className="attention-sr-only">Filter by type</span>
          <select className="cp-admin-input" value={type} onChange={event => inbox.setType(event.target.value as SignalType | 'all')}>
            <option value="all">All types</option>
            {(Object.keys(signalTypeLabels) as SignalType[]).map(key => <option key={key} value={key}>{signalTypeLabels[key]}</option>)}
          </select>
        </label>
      </header>
      <div className="cp-admin-notice attention-notice">
        <TriangleAlert size={18} aria-hidden="true" />
        <div><strong>Signals are not fully implemented</strong><span>Only identity user signals work today. Signals for new tools and denied requests are not implemented yet, so the Inbox can look empty while those items exist.</span></div>
      </div>
      {inbox.reviewFailed ? <div className="cp-admin-notice cp-admin-notice--danger" role="alert"><div><strong>A signal could not be marked as reviewed</strong><span>It stays in the Inbox. Open it again to retry.</span></div><button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" onClick={inbox.dismissReviewFailed}>Dismiss</button></div> : null}
      {list.isError ? <div className="cp-admin-notice cp-admin-notice--danger" role="alert"><div><strong>The Inbox could not be loaded</strong><span>Check your connection and try again.</span></div><button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" onClick={() => void list.refetch()}>Retry</button></div> : null}
      {list.isPending || (list.data && list.data.items.length === 0 && total > 0) ? <p role="status" className="cp-admin-muted attention-status">Loading signals…</p> : null}
      {list.data && list.data.items.length === 0 && total === 0 ? <EmptyState title={type === 'all' ? 'Nothing needs your attention' : 'No signals for this type'} description={type === 'all' ? 'New items appear here when something needs a decision.' : undefined} /> : null}
      {list.data && list.data.items.length > 0 ? (
        <div className="attention-table" role="table" aria-label="Signals that need attention">
          <div className="attention-row attention-head" role="row">
            <span role="columnheader">Type</span><span role="columnheader">Subject</span><span role="columnheader">Context</span><span role="columnheader">When</span><span role="columnheader"><span className="attention-sr-only">Action</span></span>
          </div>
          {list.data.items.map(signal => {
            const [primary, secondary] = contextLines(signal);
            const linked = targetPath(signal) !== undefined;
            return (
              <div className="attention-row" role="row" key={signal.id}>
                <span role="cell"><span className={`attention-tag attention-tag--${signal.type}`}>{typeLabel(signal.type)}</span></span>
                <span role="cell" className="attention-main"><strong>{signal.subject}</strong></span>
                <span role="cell" className="attention-main attention-context"><code>{primary}</code>{secondary ? <small>{secondary}</small> : null}</span>
                <span role="cell" className="attention-when"><time dateTime={signal.occurred_at}>{time.format(new Date(signal.occurred_at))}</time></span>
                <span role="cell" className="attention-action">{linked ? <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => open(signal)}>{signal.target_label}<ArrowRight size={14} aria-hidden="true" /></button> : null}</span>
              </div>
            );
          })}
        </div>
      ) : null}
      <footer className="attention-pager">
        <span>{total === 0 ? '0 of 0' : `${first}–${first + (list.data?.items.length ?? 1) - 1} of ${total}`}</span>
        <span>
          <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={page <= 1} onClick={() => inbox.setPage(page - 1)}>Previous</button>
          <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={page >= inbox.lastPage} onClick={() => inbox.setPage(page + 1)}>Next</button>
        </span>
      </footer>
    </section>
  );
}
