import { SidePanel } from '../../../src/components/ui/side-panel/SidePanel';
import { TracePager } from '../../../src/features/investigate/TraceUI';
import { history } from './data';

// Admin 063 prototype: the Change history of Barricade (Admin 062, BarricadeHistory) with the
// changes of PII Policies beside those of Behavior drift. Same panel, table and pager; each line
// starts with its module. A change without an author was made by the platform (a migration).
export function HistoryPanel({ scope, onClose }: { scope: string; onClose: () => void }) {
  return <SidePanel eyebrow={scope} title="Change history" width="wide" onClose={onClose}>
    <div className="barricade-history-body">
      <p className="cp-admin-muted">Every change of this environment's Barricade setting, newest first. The history cannot be edited.</p>
      <table className="cp-admin-table barricade-history">
        <thead><tr><th scope="col">When</th><th scope="col">Who</th><th scope="col">Change</th></tr></thead>
        <tbody>{history.map(item => <tr key={item.when}>
          <td>{item.when}</td>
          <td>{item.who ? <span className="barricade-author"><strong>{item.who.name}</strong><small className="cp-admin-muted">{item.who.email}</small></span> : 'Platform'}</td>
          <td><ul className="barricade-change">{item.lines.map(line => <li key={line}>{line}</li>)}</ul></td>
        </tr>)}</tbody>
      </table>
      <TracePager page={1} size={20} total={history.length} onPage={() => undefined} />
    </div>
  </SidePanel>;
}
