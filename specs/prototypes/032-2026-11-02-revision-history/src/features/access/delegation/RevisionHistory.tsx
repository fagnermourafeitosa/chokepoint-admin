import { useState } from 'react';
import { Database, FileCode2, User, Wrench } from 'lucide-react';
import { SidePanel } from '../../../components/ui/side-panel/SidePanel';
import { WaitingBackend } from './WaitingBackend';

// Layout prototype (Backend 038): the published revisions of the agent as a timeline, and
// what each one changed from the revision before. The data is fixed until the backend serves it.
type Section = 'delegator' | 'tool' | 'resource' | 'rule';
type Change = { section: Section; kind: 'added' | 'removed' | 'changed'; label: string; detail?: string };
type Revision = { revision: number; action: 'publish' | 'revoke'; by: string; at: string; ago: string; effectiveAt?: string; note?: string; changes: Change[] };

export const prototypeRevisions: Revision[] = [
  { revision: 7, action: 'publish', by: 'Admin A', at: 'Nov 2, 14:32 UTC', ago: '2 hours ago', effectiveAt: 'Nov 2, 14:32 UTC', note: 'Finance needs list access for the month close (FIN-123).', changes: [
    { section: 'tool', kind: 'added', label: 'list_test_items', detail: 'Catalog' },
    { section: 'rule', kind: 'changed', label: 'Only own items', detail: 'resource.owner == subject.id' },
  ] },
  { revision: 6, action: 'publish', by: 'Dev B', at: 'Oct 31, 18:05 UTC', ago: '2 days ago', effectiveAt: 'Oct 31, 18:05 UTC', changes: [
    { section: 'delegator', kind: 'added', label: 'carol', detail: 'Keycloak · person' },
    { section: 'resource', kind: 'removed', label: 'item-42', detail: 'test_item · Catalog' },
  ] },
  { revision: 5, action: 'revoke', by: 'Admin A', at: 'Oct 30, 09:12 UTC', ago: '3 days ago', effectiveAt: 'Oct 30, 09:12 UTC', note: 'Suspicious denies on echo. Cut access while we check.', changes: [
    { section: 'delegator', kind: 'removed', label: 'alice', detail: 'Keycloak · person' },
    { section: 'delegator', kind: 'removed', label: 'bob', detail: 'Keycloak · person' },
    { section: 'tool', kind: 'removed', label: 'echo', detail: 'Catalog' },
    { section: 'tool', kind: 'removed', label: 'current_time', detail: 'Catalog' },
  ] },
  { revision: 4, action: 'publish', by: 'Dev B', at: 'Oct 29, 16:40 UTC', ago: '4 days ago', changes: [
    { section: 'tool', kind: 'added', label: 'echo', detail: 'Catalog' },
  ] },
  { revision: 3, action: 'publish', by: 'Dev B', at: 'Oct 29, 16:38 UTC', ago: '4 days ago', effectiveAt: 'Oct 29, 16:41 UTC', changes: [
    { section: 'tool', kind: 'added', label: 'current_time', detail: 'Catalog' },
    { section: 'tool', kind: 'added', label: 'get_test_item', detail: 'Catalog' },
  ] },
];

const sections: { key: Section; label: string; Icon: typeof User }[] = [
  { key: 'delegator', label: 'Who can delegate', Icon: User },
  { key: 'tool', label: 'Servers and tools', Icon: Wrench },
  { key: 'resource', label: 'Resources', Icon: Database },
  { key: 'rule', label: 'Rules', Icon: FileCode2 },
];
const sign = { added: '+', removed: '−', changed: '~' };
const initials = (name: string) => name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
const state = (r: Revision, latest: number) => r.action === 'revoke' ? 'revoked' : !r.effectiveAt ? 'skipped' : r.revision === latest ? 'current' : 'past';

export function RevisionHistory({ agentName, initial, onClose }: { agentName: string; initial?: number; onClose: () => void }) {
  const latest = prototypeRevisions[0].revision;
  const [selected, setSelected] = useState(initial ?? latest);
  const r = prototypeRevisions.find(x => x.revision === selected)!;
  const count = (k: Change['kind']) => r.changes.filter(c => c.kind === k).length;
  return <SidePanel title="Revision history" eyebrow={agentName} width="wide" onClose={onClose} actions={<WaitingBackend spec="038" tip="The published revisions with author, time, note and snapshot." />}><section className="history">
    <nav className="history-timeline" aria-label="Published revisions">
      <header><span className="cp-admin-label">{prototypeRevisions.length} published revisions</span></header>
      <ol>{prototypeRevisions.map(x => <li key={x.revision} data-state={state(x, latest)}>
        <button type="button" aria-current={x.revision === selected || undefined} onClick={() => setSelected(x.revision)}>
          <span className="history-dot" aria-hidden="true" />
          <span className="history-entry">
            <span className="history-entry-head"><strong>Revision {x.revision}</strong>{x.action === 'revoke' ? <span className="mcp-badge" data-tone="danger">Revoked</span> : x.revision === latest ? <span className="mcp-badge" data-tone="success">Effective</span> : !x.effectiveAt ? <span className="mcp-badge">Never applied</span> : null}</span>
            <span className="history-entry-meta"><span className="history-avatar" aria-hidden="true">{initials(x.by)}</span>{x.by} · {x.ago}</span>
            {x.note ? <span className="history-entry-note">{x.note}</span> : null}
          </span>
        </button>
      </li>)}</ol>
      <p className="history-sample">Sample revisions. The numbers do not match this agent yet.</p>
    </nav>
    <article className="history-detail" aria-label={`Revision ${r.revision}`}>
      <header className="history-detail-head">
        <div><span className="cp-admin-label">{r.action === 'revoke' ? 'Revocation' : 'Publication'}</span><h4>Revision {r.revision}</h4></div>
        <dl className="history-facts">
          <div><dt>{r.action === 'revoke' ? 'Revoked by' : 'Published by'}</dt><dd><span className="history-avatar" aria-hidden="true">{initials(r.by)}</span>{r.by}</dd></div>
          <div><dt>When</dt><dd>{r.at}</dd></div>
          <div><dt>Applied</dt><dd>{r.effectiveAt ?? <span className="cp-admin-muted">Never. A newer revision replaced it before OpenFGA confirmed it.</span>}</dd></div>
        </dl>
      </header>
      {r.note ? <blockquote className="history-note"><span className="cp-admin-label">Why</span><p>{r.note}</p></blockquote> : <p className="history-note history-note--empty">No note was added to this revision.</p>}
      <div className="history-summary"><span>Changes from revision {r.revision - 1}</span><span className="history-count" data-kind="added">+{count('added')} added</span><span className="history-count" data-kind="removed">−{count('removed')} removed</span><span className="history-count" data-kind="changed">~{count('changed')} changed</span></div>
      <div className="history-diff">{sections.map(({ key, label, Icon }) => {
        const rows = r.changes.filter(c => c.section === key);
        if (!rows.length) return null;
        return <section key={key}>
          <h5><Icon size={14} aria-hidden="true" />{label}</h5>
          <ul>{rows.map((c, i) => <li key={i} data-kind={c.kind}><span className="history-sign" aria-label={c.kind}>{sign[c.kind]}</span><strong>{c.label}</strong>{c.detail ? <code>{c.detail}</code> : null}</li>)}</ul>
        </section>;
      })}</div>
    </article>
  </section></SidePanel>;
}
