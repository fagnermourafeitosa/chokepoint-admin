import { useQuery } from '@tanstack/react-query';
import { Dialog } from '../../components/ui/dialog/Dialog';
import type { EnvironmentScope } from '../access/environment-scope';
import { mcpApi, mcpError, type MCPServer } from './api';

// Turning a server off cuts every agent off its tools at once, and only a review turns it on again,
// so the switch asks first and shows what stops (Admin 057, Backend 096 decision 13).
export function DisableDialog({ scope, server, pending, error, onCancel, onConfirm }: { scope: EnvironmentScope; server: MCPServer; pending: boolean; error: string; onCancel: () => void; onConfirm: () => void }) {
  const impact = useQuery({ queryKey: ['mcp-impact', scope.userId, scope.tenantId, scope.environmentId, server.id], queryFn: ({ signal }) => mcpApi.impact(scope, server.id, signal), staleTime: 0 });
  const agents = impact.data?.agents ?? [];
  return <Dialog title={`Disable ${server.name}`} onClose={() => { if (!pending) onCancel(); }}>
    <div className="admin-dialog-body">
      <p>Agents lose access to its tools at once: every call to them is denied. To enable it again, you review its tools.</p>
      {impact.isPending ? <p role="status" className="cp-admin-muted">Reading what stops…</p>
        : impact.isError ? <p role="alert">{mcpError(impact.error)}</p>
          : <ul className="mcp-impact">
            <li><strong>{impact.data.tools} managed {impact.data.tools === 1 ? 'tool' : 'tools'}</strong> stop answering.</li>
            <li><strong>{agents.length ? `${agents.length} ${agents.length === 1 ? 'agent has' : 'agents have'} grants on them` : 'No agent has grants on them'}</strong>{agents.length ? <span className="cp-admin-muted">{agents.map(a => a.name).join(', ')}</span> : null}</li>
            <li><strong>{impact.data.allowed_calls_24h} allowed {impact.data.allowed_calls_24h === 1 ? 'call' : 'calls'}</strong> in the last 24 hours</li>
          </ul>}
      {error ? <p role="alert">{error}</p> : null}
    </div>
    <div className="admin-dialog-actions"><button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={pending} onClick={onCancel}>Cancel</button><button type="button" className="cp-admin-button cp-admin-button--danger" disabled={pending} onClick={onConfirm}>{pending ? 'Disabling…' : 'Disable server'}</button></div>
  </Dialog>;
}
