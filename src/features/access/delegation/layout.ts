import { idpSubjects, servers, type Doc } from './fixtures';

export type Adding = 'delegator' | 'tool' | 'resource';
export type GroupKind = 'delegators' | 'tools' | 'resources';
export type Selection = { type: 'agent' } | { type: 'idp'; issuer: string } | { type: 'add'; what: Adding } | { type: 'group'; group: GroupKind; key: string; label: string } | { type: 'delegation' | 'capability' | 'resource'; id: string; addCondition?: boolean };
export type Column = 'delegators' | 'agent' | 'tools' | 'resources';
export type LayoutNode = { key: string; select: Selection; column: Column; x: number; y: number; title: string; subtitle: string; kind?: 'person' | 'service'; count?: number };
// below: route under the server boxes (agent → resource). mapping: dashed tool → kind line, not a relation.
export type LayoutEdge = { key: string; select: Selection; from: LayoutNode; to: LayoutNode; expires?: string; conditions: number; count?: number; below?: number; mapping?: string };
export type Positions = Record<string, { x: number; y: number }>;

export const nodeW = 196, nodeH = 72;
// A column with more items than this shows groups. The group panel lists and searches the items.
export const groupAt = 8;
const rowGap = 94, top = 40;
const colX: Record<Column, number> = { delegators: 24, agent: 296, tools: 568, resources: 864 };

const groupNode = (group: GroupKind, column: Column, key: string, title: string, subtitle: string, count: number, y: number): LayoutNode =>
  ({ key: `g-${group}-${key}`, select: { type: 'group', group, key, label: title }, column, x: colX[column], y, title, subtitle, count });

// Four columns: who delegates → agent → server/tools → resources. Moved boxes override the column place.
// The world size comes from the column layout only, so moving a box never resizes the canvas.
export function delegationLayout(agentName: string, doc: Doc, positions: Positions = {}) {
  // Who can delegate: one node for each identity provider, never one node for each person.
  const subjectNodes: LayoutNode[] = doc.scopes.map((sc, i) => {
    const count = doc.delegations.filter(d => d.issuer === sc.issuer && sc.kinds.includes(d.kind)).length, total = idpSubjects(sc.issuer, sc.kinds).length;
    const kinds = sc.kinds.length === 2 ? 'people and services' : sc.kinds[0] === 'person' ? 'people' : 'services';
    return { key: `idp-${sc.issuer}`, select: { type: 'idp', issuer: sc.issuer }, column: 'delegators', x: colX.delegators, y: top + i * rowGap, title: sc.issuer, subtitle: count === total && total > 0 ? `All ${total} ${kinds}` : `${count} of ${total} ${kinds}` };
  });
  // Servers and tools: a server with many tools becomes one group node.
  let y = top + 22;
  const toolOf = new Map<string, LayoutNode>();
  const toolGroups = servers.map(server => {
    const caps = doc.capabilities.filter(c => c.serverId === server.id);
    const tools: LayoutNode[] = caps.length > groupAt
      ? [groupNode('tools', 'tools', server.id, `${caps.length} tools`, `${server.name} · open to list`, caps.length, y)]
      : caps.map(c => ({ key: c.id, select: { type: 'capability', id: c.id }, column: 'tools', x: colX.tools, y: y + caps.indexOf(c) * rowGap, title: c.tool, subtitle: c.mapping ? `Resource: ${c.mapping.kind}` : 'No resource mapping' }));
    caps.forEach((c, i) => toolOf.set(c.tool, tools.length === 1 && caps.length > groupAt ? tools[0] : tools[i]));
    if (tools.length) y += tools.length * rowGap + 30;
    return { server, tools, caps };
  });
  const tools = toolGroups.flatMap(g => g.tools);
  // Resources belong to the agent, inside a server and a kind: server → kind → values.
  // One edge goes from the server box to each kind box; the kind box holds the allowed values.
  const resourceNodes: LayoutNode[] = [];
  const resourceEdges: LayoutEdge[] = [];
  const kindSets: { key: string; serverId: string; kind: string; nodes: LayoutNode[]; anchor: LayoutNode }[] = [];
  const anchors = new Map(servers.map(sv => [sv.id, { key: `anchor-${sv.id}`, select: { type: 'agent' }, column: 'tools', x: 0, y: 0, title: sv.name, subtitle: '' } as LayoutNode]));
  let ry = top + 56;
  [...new Set(doc.resources.map(r => `${r.serverId}|${r.kind}`))].forEach(k => {
    const [serverId, kind] = k.split('|'), items = doc.resources.filter(r => `${r.serverId}|${r.kind}` === k);
    const grouped = items.length > groupAt;
    const nodes: LayoutNode[] = grouped
      ? [groupNode('resources', 'resources', k, `${items.length} values`, 'Open to list and search', items.length, ry)]
      : items.map((r, i) => ({ key: r.id, select: { type: 'resource', id: r.id }, column: 'resources', x: colX.resources, y: ry + i * rowGap, title: r.value, subtitle: kind }));
    ry += nodes.length * rowGap + 72;
    const anchor: LayoutNode = { key: `kind-${k}`, select: { type: 'group', group: 'resources', key: k, label: `${kind} · ${items.length}` }, column: 'resources', x: 0, y: 0, title: kind, subtitle: '' };
    kindSets.push({ key: k, serverId, kind, nodes, anchor });
    resourceNodes.push(...nodes);
  });
  const rows = Math.max(subjectNodes.length, (ry - top) / rowGap, (y - top) / rowGap, 1);
  const agent: LayoutNode = { key: 'agent', select: { type: 'agent' }, column: 'agent', x: colX.agent, y: top + (rows * rowGap - nodeH) / 2, title: agentName, subtitle: 'Agent · acts and is verified' };
  const edges: LayoutEdge[] = [
    ...doc.scopes.map((sc, i) => ({ key: `e-idp-${sc.issuer}`, select: { type: 'idp' as const, issuer: sc.issuer }, from: subjectNodes[i], to: agent, expires: sc.expiresAt, conditions: 0 })),
    ...tools.map(t => {
      const caps = doc.capabilities.filter(c => toolOf.get(c.tool) === t);
      return t.count ? { key: `e-${t.key}`, select: t.select, from: agent, to: t, conditions: caps.reduce((n, c) => n + c.conditions.length, 0), count: t.count } : { key: `e-${t.key}`, select: { type: 'capability' as const, id: caps[0].id }, from: agent, to: t, expires: caps[0].expiresAt, conditions: caps[0].conditions.length };
    }),
    ...resourceEdges,
    ...kindSets.flatMap(ks => {
      const count = doc.resources.filter(r => `${r.serverId}|${r.kind}` === ks.key).length;
      const mapped = doc.capabilities.filter(c => c.serverId === ks.serverId && c.mapping?.kind === ks.kind);
      const toolNodes = [...new Set(mapped.map(c => toolOf.get(c.tool)).filter((n): n is LayoutNode => !!n))];
      return [
        { key: `e-kind-${ks.key}`, select: ks.anchor.select, from: agent, to: ks.anchor, conditions: 0, count, below: 0 },
        ...toolNodes.map(t => ({ key: `m-${t.key}-${ks.key}`, select: ks.anchor.select, from: t, to: ks.anchor, conditions: 0, mapping: mapped.find(c => toolOf.get(c.tool) === t)?.mapping?.pointer ?? '' })),
      ];
    }),
  ];
  const nodes = [...subjectNodes, agent, ...tools, ...resourceNodes];
  const width = colX.resources + nodeW + 24, height = Math.max(top + rows * rowGap + 40, y + 50, ry + 20);
  nodes.forEach(n => { const p = positions[n.key]; if (p) { n.x = p.x; n.y = p.y; } });
  const groups = toolGroups.filter(g => g.tools.length).map(g => {
    const x0 = Math.min(...g.tools.map(t => t.x)), y0 = Math.min(...g.tools.map(t => t.y)), x1 = Math.max(...g.tools.map(t => t.x)) + nodeW, y1 = Math.max(...g.tools.map(t => t.y)) + nodeH;
    const box = { server: g.server, x: x0 - 10, y: y0 - 30, width: x1 - x0 + 20, height: y1 - y0 + 40 };
    const anchor = anchors.get(g.server.id)!; anchor.x = box.x + box.width - nodeW; anchor.y = box.y + box.height / 2 - nodeH / 2;
    return box;
  });
  // The agent → resource edge passes under the lowest server box.
  const under = Math.max(0, ...groups.map(g => g.y + g.height)) + 24;
  edges.forEach(e => { if (e.below !== undefined) e.below = under; });
  const kinds = kindSets.map(ks => {
    const x0 = Math.min(...ks.nodes.map(n => n.x)), y0 = Math.min(...ks.nodes.map(n => n.y)), x1 = Math.max(...ks.nodes.map(n => n.x)) + nodeW, y1 = Math.max(...ks.nodes.map(n => n.y)) + nodeH;
    const box = { key: ks.key, kind: ks.kind, server: servers.find(sv => sv.id === ks.serverId)?.name ?? ks.serverId, usedBy: doc.capabilities.filter(c => c.serverId === ks.serverId && c.mapping?.kind === ks.kind).map(c => c.tool), x: x0 - 10, y: y0 - 62, width: x1 - x0 + 20, height: y1 - y0 + 72 };
    // The edge ends at the left side of the kind box, so it is drawn as box → box.
    ks.anchor.x = box.x; ks.anchor.y = box.y + box.height / 2 - nodeH / 2;
    return box;
  });
  return { nodes, edges, groups, kinds, colX, width, height };
}

export const sameSelection = (a: Selection | undefined, b: Selection) => {
  if (!a || a.type !== b.type) return false;
  if (a.type === 'agent') return true;
  if (a.type === 'idp') return b.type === 'idp' && a.issuer === b.issuer;
  if (a.type === 'add') return b.type === 'add' && a.what === b.what;
  if (a.type === 'group') return b.type === 'group' && a.group === b.group && a.key === b.key;
  return 'id' in b && a.id === b.id;
};
