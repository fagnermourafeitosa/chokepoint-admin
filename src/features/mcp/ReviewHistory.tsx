import { useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Bot } from 'lucide-react';
import { SidePanel } from '../../components/ui/side-panel/SidePanel';
import type { EnvironmentScope } from '../access/environment-scope';
import { mcpApi, mcpError, type MCPServer, type ReviewDecision, type ReviewEvent } from './api';
import '../access/delegation/delegation.css';

// The review history of a server (Admin 057, Backend 096), in the pattern of the revision history of
// an agent (src/features/access/delegation/RevisionHistory.tsx): a timeline of the reviews and of the
// discoveries that disabled tools, and the decisions of the selected one with the text decided on.
const utc = (at: string) => new Date(at).toLocaleString('en', { timeZone: 'UTC', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' UTC';
const initials = (name: string) => name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
const labels: Record<ReviewDecision['decision'], { text: string; tone: 'success' | 'danger' | 'warning' }> = {
  approved: { text: 'Approved', tone: 'success' },
  change_trusted: { text: 'Change trusted', tone: 'success' },
  denied: { text: 'Denied', tone: 'danger' },
  kept_disabled: { text: 'Kept disabled', tone: 'danger' },
  disabled_changed: { text: 'Disabled: changed', tone: 'warning' },
  disabled_removed: { text: 'Disabled: removed', tone: 'warning' },
};
// A rediscovery event comes from a manual Discover or from the automatic rediscovery (Backend 096):
// the backend records both the same way, so the title names what happened, not who started it.
const title = (e: ReviewEvent) => (e.kind === 'review' ? 'Review' : 'Tools disabled');
const reviewer = (e: ReviewEvent) => e.reviewer_name || e.reviewer_id?.slice(0, 8) || '';
const group = (d: ReviewDecision) => (['approved', 'change_trusted'].includes(d.decision) ? 'yes' : ['denied', 'kept_disabled'].includes(d.decision) ? 'no' : 'auto');

export function ReviewHistory({ scope, server, onClose }: { scope: EnvironmentScope; server: MCPServer; onClose: () => void }) {
  const list = useInfiniteQuery({
    queryKey: ['mcp-review-history', scope.userId, scope.tenantId, scope.environmentId, server.id],
    queryFn: ({ pageParam, signal }) => mcpApi.reviewHistory(scope, server.id, pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: last => last.next_offset ?? undefined,
  });
  const items = useMemo(() => list.data?.pages.flatMap(p => p.items) ?? [], [list.data]);
  const [chosen, setChosen] = useState<number>();
  const current = items.find(e => e.id === chosen) ?? items[0];
  const count = (kind: 'yes' | 'no' | 'auto') => current?.decisions.filter(d => group(d) === kind).length ?? 0;
  return <SidePanel title="Review history" eyebrow={server.name} width="wide" onClose={onClose}><section className="history">
    <nav className="history-timeline" aria-label="Reviews">
      <header><span className="cp-admin-label">{list.data ? `${items.length}${list.hasNextPage ? '+' : ''} ${items.length === 1 ? 'event' : 'events'}` : 'History'}</span></header>
      {list.isError ? <p role="alert" className="history-sample">{mcpError(list.error)} <button type="button" className="rule-switch" onClick={() => void list.refetch()}>Retry</button></p>
        : list.isPending ? <p role="status" className="history-sample">Loading the history…</p>
          : !items.length ? <p className="history-sample">No review was confirmed yet.</p>
            : <ol>{items.map(e => <li key={e.id} data-state={e.kind === 'rediscovery' ? 'mode' : 'past'} data-kind={e.kind === 'rediscovery' ? 'mode' : undefined}>
              <button type="button" aria-current={e.id === current?.id || undefined} onClick={() => setChosen(e.id)}>
                {e.kind === 'rediscovery' ? <span className="history-dot history-dot--mode" aria-hidden="true"><Bot size={12} /></span> : <span className="history-dot" aria-hidden="true" />}
                <span className="history-entry">
                  <span className="history-entry-head"><strong>{title(e)}</strong><span className="mcp-badge">Revision {e.server_revision}</span></span>
                  <span className="history-entry-note">{e.decisions.length} {e.decisions.length === 1 ? 'tool' : 'tools'}</span>
                  <span className="history-entry-meta">{e.kind === 'review' ? <><span className="history-avatar" aria-hidden="true">{initials(reviewer(e))}</span>{reviewer(e)}</> : 'Xokepoint'}</span>
                  <time className="history-entry-time" dateTime={e.occurred_at}>{utc(e.occurred_at)}</time>
                </span>
              </button>
            </li>)}</ol>}
      {list.hasNextPage ? <p className="history-sample"><button type="button" className="rule-switch" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>{list.isFetchingNextPage ? 'Loading…' : 'Load older events'}</button></p> : null}
    </nav>
    {current ? <article className="history-detail" aria-label={title(current)}>
      <header className="history-detail-head">
        <div><span className="cp-admin-label">{current.kind === 'review' ? 'Review' : 'Discovery'}</span><h4>{title(current)} · revision {current.server_revision}</h4></div>
        <dl className="history-facts">
          <div><dt>{current.kind === 'review' ? 'Reviewed by' : 'Done by'}</dt><dd>{current.kind === 'review' ? <><span className="history-avatar" aria-hidden="true">{initials(reviewer(current))}</span>{reviewer(current)}</> : 'Xokepoint, after a discovery'}</dd></div>
          <div><dt>When</dt><dd>{utc(current.occurred_at)}</dd></div>
        </dl>
      </header>
      {current.kind === 'rediscovery' ? <p className="history-note history-note--empty">The server changed or stopped returning these tools. Xokepoint disabled them until a review.</p> : null}
      <div className="history-summary">
        {count('yes') ? <span className="history-count" data-kind="added">{count('yes')} approved</span> : null}
        {count('no') ? <span className="history-count" data-kind="removed">{count('no')} denied</span> : null}
        {count('auto') ? <span className="history-count" data-kind="changed">{count('auto')} disabled</span> : null}
      </div>
      <ul className="mcp-history-decisions">{current.decisions.map(d => <li key={d.tool}>
        <details>
          <summary><code>{d.tool}</code><span className="mcp-badge" data-tone={labels[d.decision].tone}>{labels[d.decision].text}</span></summary>
          <div className="mcp-history-contract"><span className="cp-admin-label">Text at that time</span><p>{d.contract.description || <span className="cp-admin-muted">No description.</span>}</p></div>
        </details>
      </li>)}</ul>
    </article> : <article className="history-detail" />}
  </section></SidePanel>;
}
