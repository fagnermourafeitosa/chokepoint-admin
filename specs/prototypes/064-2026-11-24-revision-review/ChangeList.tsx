import { FileCode2, User, Wrench } from 'lucide-react';
import { count, type Change, type Section } from './data';

// Admin 064 prototype: the changes of a draft or a revision, one list for the review and the history.
// A change shows the changes it causes under it, and a changed rule shows its value before and after.
const sections: { key: Section; label: string; Icon: typeof User }[] = [
  { key: 'delegator', label: 'Who can delegate', Icon: User },
  { key: 'tool', label: 'Servers and tools', Icon: Wrench },
  { key: 'rule', label: 'Rules', Icon: FileCode2 },
];
const sign = { added: '+', removed: '−', changed: '~' };

function Item({ change }: { change: Change }) {
  return <li data-kind={change.kind}>
    <div className="rr-change">
      <span className="history-sign" aria-label={change.kind}>{sign[change.kind]}</span>
      <strong>{change.label}</strong>
      {change.detail ? <code>{change.detail}</code> : null}
    </div>
    {change.before || change.after ? <div className="rr-values">
      {change.before ? <span className="rr-before">{change.before}</span> : null}
      {change.before && change.after ? <span aria-hidden="true">→</span> : null}
      {change.after ? <span className="rr-after">{change.after}</span> : null}
    </div> : null}
    {change.children?.length ? <ul className="rr-children">{change.children.map(c => <Item key={c.label} change={c} />)}</ul> : null}
  </li>;
}

// The diff of today (revisionDiff): each change on its own row, with no value before and after,
// so the people of a removed identity provider count as changes of their own.
export const flat = (changes: Change[]): Change[] => changes.flatMap(c => [{ ...c, before: undefined, after: undefined, children: undefined }, ...flat(c.children ?? [])]);

export function Summary({ title, changes }: { title: string; changes: Change[] }) {
  return <div className="history-summary"><span>{title}</span>
    <span className="history-count" data-kind="added">+{count(changes, 'added')} added</span>
    <span className="history-count" data-kind="removed">−{count(changes, 'removed')} removed</span>
    <span className="history-count" data-kind="changed">~{count(changes, 'changed')} changed</span>
  </div>;
}

export function ChangeList({ changes }: { changes: Change[] }) {
  return <div className="history-diff rr-diff">{sections.map(({ key, label, Icon }) => {
    const rows = changes.filter(c => c.section === key);
    if (!rows.length) return null;
    return <section key={key}>
      <h5><Icon size={14} aria-hidden="true" />{label}</h5>
      <ul>{rows.map(c => <Item key={c.label} change={c} />)}</ul>
    </section>;
  })}</div>;
}
