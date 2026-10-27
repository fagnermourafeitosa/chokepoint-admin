import { Link } from 'react-router';
import type { PermissionDocument } from '../../permissions/api';
import type { GraphNode } from './layout';
export function GraphDetails({ node, published }: { node: GraphNode; published?: PermissionDocument }) {
  if (node.kind === 'agent') return null;
  return <aside className="agent-graph-details" aria-label="Selected graph node" aria-live="polite">
    <h4>{node.title}</h4>
    {node.kind === 'users' ? <><p>Users associated with this Agent's published permission group.</p>{published?.members.map(m => <div className="agent-graph-member" key={`${m.issuer}:${m.subject}`}><strong>{m.subject}</strong><small>{m.issuer}</small></div>)}</> : <>
      <p>{node.server?.connection_type === 'enterprise' ? `Enterprise MCP · ${node.server.account || 'Account unavailable'}` : 'Custom MCP'}</p>
      <p>{node.server ? node.server.enabled ? 'Connection enabled' : 'Connection disabled' : 'Connection state unavailable'}{node.server?.review_required ? ' · Tool review required' : ''}{node.server?.authentication_status === 'reauthorization_required' ? ' · Reconnect required' : ''}</p>
      <strong>{node.tools?.length ?? 0} granted tools</strong><ul>{node.tools?.map(tool => <li key={tool}><code>{tool}</code></li>)}</ul>
      {node.server ? <Link className="cp-admin-button cp-admin-button--secondary" to={`/access/integrations?type=${node.server.connection_type === 'enterprise' ? 'enterprise' : 'custom'}&server=${node.id}`}>Open connection</Link> : null}
    </>}
  </aside>;
}
