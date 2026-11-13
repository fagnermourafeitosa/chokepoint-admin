import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Send } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '../../components/ui/dialog/ConfirmDialog';
import { TracePager } from '../investigate/TraceUI';
import '../investigate/investigate.css';
import { AccountTabs } from './AccountLayout';
import { destinationsKey, eventsExportApi, type Destination, type DestinationStatus } from './events-export-api';
import './events-export.css';

const pageSize = 20;
const typeLabel = { otlp: 'OTLP', webhook: 'Webhook' } as const;
const statusBadge: Record<DestinationStatus, { label: string; tone?: string }> = {
  delivering: { label: 'Delivering', tone: 'success' },
  failing: { label: 'Failing', tone: 'danger' },
  disabled: { label: 'Disabled' },
};
export const environmentLabel = (environment: string) => (environment === 'production' ? 'Production' : 'Sandbox');
export const deliveredAt = (value: string | null) => (value ? `${value.slice(0, 10)} ${value.slice(11, 16)}` : 'never');

// Admin 053, items 2 to 4: the destinations of the signed-in person.
export function EventsExportPage() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<Destination | null>(null);
  const list = useQuery({ queryKey: [...destinationsKey, page], queryFn: ({ signal }) => eventsExportApi.list(page, pageSize, signal) });
  const items = list.data?.items ?? [];
  return (
    <main id="main-content" className="admin-page cp-admin-container" aria-label="Events export" tabIndex={-1}>
      <AccountTabs />
      <header className="access-page-heading">
        <div>
          <h1 className="cp-admin-title">Events export</h1>
          <p className="cp-admin-muted">Send each allowed and denied call of your workspaces to your SIEM or observability tool, by OpenTelemetry (OTLP) or webhook.</p>
        </div>
        <button type="button" className="cp-admin-button access-primary-action" onClick={() => navigate('/account/events-export/new')}><Plus size={16} aria-hidden="true" />Add destination</button>
      </header>
      {list.isPending ? <p role="status">Loading destinations…</p>
        : list.isError ? <div className="cp-admin-notice" role="alert">Could not load the destinations. <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => void list.refetch()}>Retry</button></div>
          : items.length === 0 ? <p className="cp-admin-muted">No destination yet. Add one to send the calls of your workspaces to your SIEM.</p>
            : <div className="cp-admin-table-scroll" role="region" aria-label="Destinations" tabIndex={0}>
              <table className="cp-admin-table events-export-table">
                <thead><tr><th scope="col">Destination</th><th scope="col">Type</th><th scope="col">Workspaces</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
                <tbody>{items.map(destination => (
                  <tr key={destination.id}>
                    <td><div className="events-export-name"><Send size={20} aria-hidden="true" /><span><strong>{destination.name}</strong><small>{destination.endpoint}</small></span></div></td>
                    <td><span className="mcp-badge">{typeLabel[destination.type]}</span></td>
                    <td><div className="events-export-badges">{destination.exports.map(item => <span key={`${item.tenant_id}-${item.environment}`} className="mcp-badge">{item.workspace_name || item.tenant_id} · {environmentLabel(item.environment)}</span>)}</div></td>
                    <td><div className="events-export-status"><span className="mcp-badge" data-tone={statusBadge[destination.status].tone}>{statusBadge[destination.status].label}</span><small>Last delivery {deliveredAt(destination.last_delivery_at)}</small></div></td>
                    <td><div className="events-export-row-actions">
                      <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => navigate(`/account/events-export/${destination.id}`)}>Edit</button>
                      <button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" onClick={() => setDeleting(destination)}>Delete</button>
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>}
      <TracePager page={page} size={pageSize} total={list.data?.total ?? 0} onPage={setPage} />
      {deleting ? <DeleteDestinationDialog destination={deleting} onClose={() => setDeleting(null)} onDeleted={() => { setDeleting(null); void client.invalidateQueries({ queryKey: destinationsKey }); }} /> : null}
    </main>
  );
}

export function DeleteDestinationDialog({ destination, onClose, onDeleted }: { destination: Destination; onClose: () => void; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const workspaces = [...new Set(destination.exports.map(item => item.workspace_name || item.tenant_id))];
  async function remove() {
    setBusy(true);
    setError('');
    try {
      await eventsExportApi.remove(destination.id);
      onDeleted();
    } catch {
      setError('The destination could not be deleted. Try again.');
      setBusy(false);
    }
  }
  return (
    <ConfirmDialog title="Delete destination" confirmLabel="Delete destination" busyLabel="Deleting…" busy={busy} error={error || undefined} onConfirm={() => void remove()} onClose={onClose}
      warning={workspaces.length ? <>Calls of {workspaces.join(', ')} stop going to {destination.endpoint} at once. Events not delivered yet are dropped.</> : <>Events not delivered yet are dropped.</>}>
      <p>Delete <strong>{destination.name}</strong>? This removes its settings and its credentials.</p>
    </ConfirmDialog>
  );
}
