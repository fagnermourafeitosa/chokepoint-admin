import type { ReactNode } from 'react';
import type { PiiGroup, PiiType } from './pii-terms';

// Admin 063, item 3: the masked types as one design-system accordion per category, only the first
// open. The page and the agent side panel share it, each with its own columns.
export function PiiTypeGroups({ groups, columns, cells, masked }: {
  groups: PiiGroup[];
  columns: [string, string, string];
  cells: (type: PiiType) => [ReactNode, ReactNode];
  masked: (key: string) => boolean;
}) {
  return <div className="pii-groups">
    {groups.map((g, i) => {
      const on = g.types.filter(t => masked(t.key)).length;
      return <details key={g.key} className="cp-admin-accordion pii-group" open={i === 0}>
        <summary><span className="pii-group-title"><span>{g.label} <span className="cp-admin-muted pii-group-count">{on} of {g.types.length} masked</span></span><small className="cp-admin-muted">{g.description}</small></span></summary>
        <div className="cp-admin-table-scroll cp-admin-switch-table pii-switch-table">
          <table className="cp-admin-table">
            <thead><tr><th scope="col">{columns[0]}</th><th scope="col">{columns[1]}</th><th scope="col">{columns[2]}</th></tr></thead>
            <tbody>{g.types.map(t => {
              const [middle, last] = cells(t);
              return <tr key={t.key}>
                <td><strong>{t.label}</strong>{t.detail ? <small className="cp-admin-muted pii-detail">{t.detail}</small> : null}</td>
                <td>{middle}</td>
                <td>{last}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </details>;
    })}
  </div>;
}
