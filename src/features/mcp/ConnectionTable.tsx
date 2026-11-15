import { MoreHorizontal, Server } from 'lucide-react';
import type { MCPServer } from './api';

// The Custom MCPs list (Admin 057). A row does not open details: its visible action opens the review
// page (Review when a tool needs review, Discover otherwise), and the More menu has Edit connection and
// Review history, as the rows of Identity providers. The status is a switch: off asks first, on opens
// the review that enables the server again.
export function needsReview(server: MCPServer) {
  return server.tools.some(t => !t.reviewed && (t.change === 'changed' || t.change === 'removed'));
}

type Props = {
  servers: MCPServer[];
  pending: boolean;
  onReview: (s: MCPServer, enable?: boolean) => void;
  onEdit: (s: MCPServer) => void;
  onHistory: (s: MCPServer) => void;
  onDisable: (s: MCPServer) => void;
};

export function ConnectionTable({ servers, pending, onReview, onEdit, onHistory, onDisable }: Props) {
  return <div className="cp-admin-table-scroll identity-table-region" role="region" aria-label="MCP servers table" tabIndex={0}><table className="cp-admin-table mcp-servers">
    <thead><tr><th>Connection</th><th>Managed tools</th><th>Status</th><th className="mcp-actions-head">Actions</th></tr></thead>
    <tbody>{servers.map(item => <tr key={item.id}>
      <td><span className="mcp-server-name"><Server size={24} aria-hidden="true" /><span><strong>{item.name}</strong><small>Custom MCP · {item.transport}</small></span></span></td>
      <td>{item.tools.filter(t => t.selected && t.change !== 'removed').length} tools{needsReview(item) ? <span className="mcp-badge" data-tone="warning">Review required</span> : null}</td>
      <td><label className="cp-admin-choice mcp-status"><input className="cp-admin-switch" type="checkbox" role="switch" checked={item.enabled} disabled={pending} aria-label={`${item.name} enabled`} onChange={e => (e.target.checked ? onReview(item, true) : onDisable(item))} />{item.enabled ? 'Enabled' : 'Disabled'}</label></td>
      <td><div className="identity-row-actions mcp-row-actions">
        <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" disabled={pending} onClick={() => onReview(item)}>{needsReview(item) ? 'Review' : 'Discover'}</button>
        <details className="identity-menu" name="mcp-row-menu"><summary aria-label={`More actions for ${item.name}`}><MoreHorizontal size={18} /></summary><div onClick={e => e.currentTarget.closest('details')?.removeAttribute('open')}>
          <button type="button" disabled={pending} onClick={() => onEdit(item)}>Edit connection</button>
          <button type="button" onClick={() => onHistory(item)}>Review history</button>
        </div></details>
      </div></td>
    </tr>)}</tbody>
  </table></div>;
}
