import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Database, FileCode2, User, Wrench } from 'lucide-react';
import { SidePanel } from '../../../components/ui/side-panel/SidePanel';
import type { AgentScope } from '../agent-api';
import { permissionApi, revisionsKey, type Revision } from './api';
import { useCatalog } from './catalog';
import { revisionDiff, type Change, type Section } from './revisionDiff';

// The published revisions of an agent as a timeline, and what each one changed from the
// revision before it (Admin 032 section 3, Backend 038). It needs a CatalogProvider for names.
const sections: { key: Section; label: string; Icon: typeof User }[] = [
  { key: 'delegator', label: 'Who can delegate', Icon: User },
  { key: 'tool', label: 'Servers and tools', Icon: Wrench },
  { key: 'resource', label: 'Resources', Icon: Database },
  { key: 'rule', label: 'Rules', Icon: FileCode2 },
];
const sign = { added: '+', removed: '−', changed: '~' };
const utc = (at: string) => new Date(at).toLocaleString('en', { timeZone: 'UTC', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' UTC';
const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
function ago(at: string) {
  const minutes = Math.round((new Date(at).getTime() - Date.now()) / 60000);
  if (Math.abs(minutes) < 60) return relative.format(minutes, 'minute');
  if (Math.abs(minutes) < 60 * 24) return relative.format(Math.round(minutes / 60), 'hour');
  return relative.format(Math.round(minutes / 1440), 'day');
}
const author = (r: Revision) => r.published_by_name || r.published_by.slice(0, 8);
const initials = (r: Revision) => (r.published_by_name ? r.published_by_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : '');

type Props = { scope: AgentScope; agentId: string; agentName: string; initial?: number; onClose: () => void };

export function RevisionHistory({ scope, agentId, agentName, initial, onClose }: Props) {
  const { catalog } = useCatalog();
  const list = useInfiniteQuery({
    queryKey: revisionsKey(scope, agentId),
    queryFn: ({ pageParam, signal }) => permissionApi.revisions(scope, agentId, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: last => (last.page * last.page_size < last.total ? last.page + 1 : undefined),
  });
  const items = useMemo(() => list.data?.pages.flatMap(p => p.items) ?? [], [list.data]);
  const [chosen, setChosen] = useState<number | undefined>(initial);
  const selected = chosen ?? items[0]?.revision;
  const index = items.findIndex(r => r.revision === selected);
  const current = index >= 0 ? items[index] : undefined;
  // The revision before the selected one is the next item of the timeline: revision numbers
  // are not consecutive, because a draft save also advances them.
  const previous = index >= 0 ? items[index + 1] : undefined;
  const effective = items.find(r => r.effective_at)?.revision;
  // Load older pages until the selected revision and the one before it are known.
  useEffect(() => {
    if (!list.hasNextPage || list.isFetchingNextPage) return;
    if ((selected !== undefined && index < 0) || (index >= 0 && index === items.length - 1)) void list.fetchNextPage();
  }, [selected, index, items.length, list]);
  const snapshot = (revision?: number) => ({ queryKey: [...revisionsKey(scope, agentId), revision], queryFn: ({ signal }: { signal: AbortSignal }) => permissionApi.revision(scope, agentId, revision!, signal), enabled: revision !== undefined, staleTime: Infinity });
  const after = useQuery(snapshot(current?.revision));
  const before = useQuery(snapshot(previous?.revision));
  const waitingBefore = index >= 0 && !previous && list.hasNextPage;
  const changes: Change[] | undefined = after.data && (!previous || before.data) && !waitingBefore ? revisionDiff(before.data?.document, after.data.action === 'revoke' ? undefined : after.data.document, catalog) : undefined;
  const count = (k: Change['kind']) => changes?.filter(c => c.kind === k).length ?? 0;

  return <SidePanel title="Revision history" eyebrow={agentName} width="wide" onClose={onClose}><section className="history">
    <nav className="history-timeline" aria-label="Published revisions">
      <header><span className="cp-admin-label">{list.data ? `${list.data.pages[0].total} published ${list.data.pages[0].total === 1 ? 'revision' : 'revisions'}` : 'Published revisions'}</span></header>
      {list.isError ? <p role="alert" className="history-sample">The history could not be loaded. <button type="button" className="rule-switch" onClick={() => void list.refetch()}>Retry</button></p>
        : list.isPending ? <p role="status" className="history-sample">Loading the history…</p>
          : !items.length ? <p className="history-sample">Nothing was published yet.</p>
            : <ol>{items.map(x => <li key={x.revision} data-state={x.action === 'revoke' ? 'revoked' : !x.effective_at ? 'skipped' : x.revision === effective ? 'current' : 'past'}>
              <button type="button" aria-current={x.revision === selected || undefined} onClick={() => setChosen(x.revision)}>
                <span className="history-dot" aria-hidden="true" />
                <span className="history-entry">
                  <span className="history-entry-head"><strong>Revision {x.revision}</strong>{x.action === 'revoke' ? <span className="mcp-badge" data-tone="danger">Revoked</span> : x.revision === effective ? <span className="mcp-badge" data-tone="success">Effective</span> : !x.effective_at ? <span className="mcp-badge">Never applied</span> : null}</span>
                  <span className="history-entry-meta">{initials(x) ? <span className="history-avatar" aria-hidden="true">{initials(x)}</span> : null}{author(x)} · {ago(x.published_at)}</span>
                  {x.note ? <span className="history-entry-note">{x.note}</span> : null}
                </span>
              </button>
            </li>)}</ol>}
      {list.hasNextPage ? <p className="history-sample"><button type="button" className="rule-switch" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>{list.isFetchingNextPage ? 'Loading…' : 'Load older revisions'}</button></p> : null}
    </nav>
    {current ? <article className="history-detail" aria-label={`Revision ${current.revision}`}>
      <header className="history-detail-head">
        <div><span className="cp-admin-label">{current.action === 'revoke' ? 'Revocation' : 'Publication'}</span><h4>Revision {current.revision}</h4></div>
        <dl className="history-facts">
          <div><dt>{current.action === 'revoke' ? 'Revoked by' : 'Published by'}</dt><dd>{initials(current) ? <span className="history-avatar" aria-hidden="true">{initials(current)}</span> : null}{author(current)}</dd></div>
          <div><dt>When</dt><dd>{utc(current.published_at)}</dd></div>
          <div><dt>Applied</dt><dd>{current.effective_at ? utc(current.effective_at) : <span className="cp-admin-muted">{current.revision === items[0]?.revision ? 'Not yet. Chokepoint is writing it to OpenFGA.' : 'Never. A newer revision replaced it before OpenFGA confirmed it.'}</span>}</dd></div>
        </dl>
      </header>
      {current.note ? <blockquote className="history-note"><span className="cp-admin-label">Why</span><p>{current.note}</p></blockquote> : <p className="history-note history-note--empty">No note was added to this revision.</p>}
      {after.isError || before.isError ? <p role="alert">The changes could not be loaded. <button type="button" className="rule-switch" onClick={() => { void after.refetch(); void before.refetch(); }}>Retry</button></p>
        : !changes ? <p role="status" className="cp-admin-muted">Loading the changes…</p>
          : <>
            <div className="history-summary"><span>{previous ? `Changes from revision ${previous.revision}` : 'First revision'}</span><span className="history-count" data-kind="added">+{count('added')} added</span><span className="history-count" data-kind="removed">−{count('removed')} removed</span><span className="history-count" data-kind="changed">~{count('changed')} changed</span></div>
            {changes.length ? <div className="history-diff">{sections.map(({ key, label, Icon }) => {
              const rows = changes.filter(c => c.section === key);
              if (!rows.length) return null;
              return <section key={key}>
                <h5><Icon size={14} aria-hidden="true" />{label}</h5>
                <ul>{rows.map((c, i) => <li key={i} data-kind={c.kind}><span className="history-sign" aria-label={c.kind}>{sign[c.kind]}</span><strong>{c.label}</strong>{c.detail ? <code>{c.detail}</code> : null}</li>)}</ul>
              </section>;
            })}</div> : <p className="cp-admin-muted">This revision has the same access as the one before it.</p>}
          </>}
    </article> : <article className="history-detail">
      {/* A revision published before Backend 038 has no event, so it is not in the timeline. */}
      {selected !== undefined && items.length > 0 && !list.hasNextPage && !list.isFetchingNextPage ? <p className="history-note history-note--empty">Revision {selected} was published before the history existed, so Chokepoint has no author, note or snapshot for it.</p> : null}
    </article>}
  </section></SidePanel>;
}
