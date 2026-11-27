import { Database, FileCode2, User, Wrench } from 'lucide-react';
import type { Change, Section } from './revisionDiff';

// The changes of a draft or a revision (Admin 032, Admin 064): one list for the review panel and the history.
// A change shows the changes it causes under it, and a changed rule shows its sentence before and after.
const sections: { key: Section; label: string; Icon: typeof User }[] = [
  { key: 'delegator', label: 'Who can delegate', Icon: User },
  { key: 'tool', label: 'Servers and tools', Icon: Wrench },
  { key: 'resource', label: 'Allowed values', Icon: Database },
  { key: 'rule', label: 'Rules', Icon: FileCode2 },
];
const sign = { added: '+', removed: '−', changed: '~' };

function Item({ change }: { change: Change }) {
  return <li data-kind={change.kind}>
    <div className="change-row">
      <span className="history-sign" aria-label={change.kind}>{sign[change.kind]}</span>
      <strong>{change.label}</strong>
      {change.detail ? <code>{change.detail}</code> : null}
    </div>
    {change.before || change.after ? <div className="change-values">
      {change.before ? <span className="change-before">{change.before}</span> : null}
      {change.before && change.after ? <span aria-hidden="true">→</span> : null}
      {change.after ? <span className="change-after">{change.after}</span> : null}
    </div> : null}
    {change.children?.length ? <ul className="change-children">{change.children.map((c, i) => <Item key={i} change={c} />)}</ul> : null}
  </li>;
}

export function ChangeSummary({ title, changes }: { title: string; changes: Change[] }) {
  const count = (k: Change['kind']) => changes.filter(c => c.kind === k).length;
  return <div className="history-summary"><span>{title}</span>
    <span className="history-count" data-kind="added">+{count('added')} added</span>
    <span className="history-count" data-kind="removed">−{count('removed')} removed</span>
    <span className="history-count" data-kind="changed">~{count('changed')} changed</span>
  </div>;
}

export function ChangeList({ changes }: { changes: Change[] }) {
  return <div className="history-diff change-list">{sections.map(({ key, label, Icon }) => {
    const rows = changes.filter(c => c.section === key);
    if (!rows.length) return null;
    return <section key={key}>
      <h5><Icon size={14} aria-hidden="true" />{label}</h5>
      <ul>{rows.map((c, i) => <Item key={i} change={c} />)}</ul>
    </section>;
  })}</div>;
}
