import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SidePanel } from '../../components/ui/side-panel/SidePanel';
import { TracePager } from '../investigate/TraceUI';
import { barricadeApi, barricadeKey } from './barricade-api';
import { describeChange, utc } from './barricade-terms';

// Admin 062, item 5: every change of the environment's Barricade setting, newest first (Backend 101,
// Implementation Decision 2). The page size comes from the backend.
export function BarricadeHistory({ tenantId, environmentId, scope, onClose }: { tenantId: string; environmentId: string; scope: string; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const changes = useQuery({
    queryKey: [...barricadeKey(tenantId, environmentId), 'changes', page],
    queryFn: ({ signal }) => barricadeApi.changes(tenantId, environmentId, page, signal),
  });
  const items = changes.data?.items ?? [];
  return <SidePanel eyebrow={scope} title="Change history" width="wide" onClose={onClose}>
    <div className="barricade-history-body">
      <p className="cp-admin-muted">Every change of this environment's Barricade setting, newest first. The history cannot be edited.</p>
      {changes.isPending ? <p role="status">Loading the history…</p>
        : changes.isError ? <div className="cp-admin-notice" role="alert">Could not load the history. <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => void changes.refetch()}>Retry</button></div>
          : <table className="cp-admin-table barricade-history">
            <thead><tr><th scope="col">When</th><th scope="col">Who</th><th scope="col">Change</th></tr></thead>
            <tbody>{items.map(item => <tr key={item.changed_at + JSON.stringify(item.after)}>
              <td>{utc(item.changed_at)}</td>
              <td>{item.changed_by ? <span className="barricade-author"><strong>{item.changed_by.name}</strong>{item.changed_by.email ? <small className="cp-admin-muted">{item.changed_by.email}</small> : null}</span> : 'Platform'}</td>
              <td><ul className="barricade-change">{describeChange(item.before, item.after).map(line => <li key={line}>{line}</li>)}</ul></td>
            </tr>)}</tbody>
          </table>}
      <TracePager page={page} size={changes.data?.page_size ?? 20} total={changes.data?.total ?? 0} onPage={setPage} busy={changes.isFetching} />
    </div>
  </SidePanel>;
}
