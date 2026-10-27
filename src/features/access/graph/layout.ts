import type { PermissionDocument } from '../../permissions/api';
import type { ConnectionSummary } from '../../mcp/enterprise/api';
export type GraphNode = { id: string; kind: 'users' | 'agent' | 'connection'; x: number; y: number; title: string; subtitle: string; server?: ConnectionSummary; tools?: string[] };
export const nodeWidth = 190, nodeHeight = 78;
export function graphLayout(agentId: string, name: string, published: PermissionDocument | undefined, catalog: ConnectionSummary[], compact = false) {
  const grants = published?.grants ?? [];
  const height = Math.max(320, grants.length * 120 + 80), middle = height / 2 - nodeHeight / 2;
  const byId = new Map(catalog.map(s => [s.id, s]));
  const nodes: GraphNode[] = [
    { id: 'users', kind: 'users', x: 28, y: middle, title: `${published?.members.length ?? 0} associated users`, subtitle: 'Published associations' },
    { id: agentId, kind: 'agent', x: 280, y: middle, title: name, subtitle: 'Agent permission group' },
    ...grants.map((g, i): GraphNode => {
      const server = byId.get(g.server_id);
      return { id: g.server_id, kind: 'connection', x: 570, y: i * 120 + 40, title: server?.name ?? 'Unavailable connection', subtitle: server ? `${server.connection_type === 'enterprise' ? 'Enterprise' : 'Custom'} MCP · ${server.enabled ? 'Enabled' : 'Disabled'}` : 'Connection metadata unavailable', server, tools: g.tools };
    }),
  ];
  if (compact) nodes.forEach((node, index) => { node.x = 65; node.y = 24 + index * 120; });
  const edges = [
    { from: 'users', to: agentId, label: 'Users' },
    ...grants.map(g => ({ from: agentId, to: g.server_id, label: `${g.tools.length} granted tools` })),
  ];
  return { nodes, edges, compact, width: compact ? 320 : grants.length ? 800 : 500, height: compact ? nodes.length * 120 + 24 : height };
}
