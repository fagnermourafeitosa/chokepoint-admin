import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Bot, Braces, Clock, Database, Layers, Maximize2, Minimize2, Plus, ScanSearch, ServerCog, User, Users, Wrench, ZoomIn, ZoomOut } from 'lucide-react';
import { nodeH, nodeW, sameSelection, type delegationLayout, type LayoutNode, type Selection } from './layout';

type Layout = ReturnType<typeof delegationLayout>;
type View = { x: number; y: number; width: number; height: number };

function NodeIcon({ node }: { node: LayoutNode }) {
  if (node.column === 'agent') return <Bot size={22} />;
  if (node.count) return node.column === 'delegators' ? <Users size={20} /> : <Layers size={20} />;
  if (node.column === 'tools') return <Wrench size={20} />;
  if (node.column === 'resources') return <Database size={20} />;
  return node.kind === 'service' ? <ServerCog size={20} /> : <User size={20} />;
}

// Zoom keeps the point under the cursor fixed.
function zoomAt(o: View, factor: number, px: number, py: number, limit: number): View {
  const width = Math.min(limit * 3, Math.max(240, o.width * factor)), r = width / o.width;
  return { x: px - (px - o.x) * r, y: py - (py - o.y) * r, width, height: o.height * r };
}

type Props = { layout: Layout; selected?: Selection; onSelect: (s: Selection) => void; onMove: (key: string, x: number, y: number) => void; disabled: boolean; readOnly: boolean; maximized: boolean; onMaximize: () => void };

// The graph is the map: a node or an edge opens its editor in the side panel. Boxes can be moved.
export function DelegationGraph({ layout, selected, onSelect, onMove, disabled, readOnly, maximized, onMaximize }: Props) {
  const fit: View = { x: 0, y: 0, width: layout.width, height: layout.height };
  const [view, setView] = useState(fit);
  const svg = useRef<SVGSVGElement>(null);
  const pan = useRef<{ x: number; y: number; view: View } | null>(null);
  const move = useRef<{ key: string; x: number; y: number; nx: number; ny: number; moved: boolean } | null>(null);
  const limit = layout.width;
  // The canvas fills the window below its top edge. Its size never depends on the boxes.
  const [height, setHeight] = useState(480);
  useLayoutEffect(() => {
    const measure = () => { const el = svg.current; if (!el) return; const topEdge = el.getBoundingClientRect().top + window.scrollY; setHeight(Math.max(380, window.innerHeight - topEdge - 96)); };
    measure(); window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  useEffect(() => {
    const el = svg.current; if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const m = el.getScreenCTM(); if (!m) return;
      const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      setView(o => zoomAt(o, Math.exp(e.deltaY * 0.0015), pt.x, pt.y, limit));
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, [limit]);
  const scale = () => svg.current?.getScreenCTM()?.a ?? 1;
  const center = (f: number) => setView(o => zoomAt(o, f, o.x + o.width / 2, o.y + o.height / 2, limit));
  function nodeDown(e: ReactPointerEvent<HTMLDivElement>, node: LayoutNode) {
    if (e.button !== 0) return;
    move.current = { key: node.key, x: e.clientX, y: e.clientY, nx: node.x, ny: node.y, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function nodeMove(e: ReactPointerEvent<HTMLDivElement>) {
    const m = move.current; if (!m) return;
    const dx = e.clientX - m.x, dy = e.clientY - m.y;
    if (!m.moved && Math.hypot(dx, dy) < 4) return;
    m.moved = true;
    // A box can go up to the visible edge of the canvas; dragging never resizes the canvas.
    const el = svg.current, ctm = el?.getScreenCTM(); if (!el || !ctm) return;
    const r = el.getBoundingClientRect(), inv = ctm.inverse();
    const a = new DOMPoint(r.left, r.top).matrixTransform(inv), b = new DOMPoint(r.right, r.bottom).matrixTransform(inv);
    const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
    onMove(m.key, clamp(m.nx + dx / ctm.a, a.x, b.x - nodeW), clamp(m.ny + dy / ctm.d, a.y, b.y - nodeH));
  }
  return <div className="delegation-canvas" data-disabled={disabled} data-maximized={maximized}>
    <div className="agent-graph-controls" aria-label="Graph view controls">
      <button type="button" className="cp-admin-button cp-admin-button--ghost" aria-label="Zoom in" onClick={() => center(.8)}><ZoomIn size={17} /></button>
      <button type="button" className="cp-admin-button cp-admin-button--ghost" aria-label="Zoom out" onClick={() => center(1.25)}><ZoomOut size={17} /></button>
      <button type="button" className="cp-admin-button cp-admin-button--ghost" aria-label="Fit graph to view" onClick={() => setView(fit)}><ScanSearch size={17} /></button>
      <button type="button" className="cp-admin-button cp-admin-button--ghost" aria-label={maximized ? 'Exit full screen' : 'Full screen'} title={maximized ? 'Exit full screen (Esc)' : 'Full screen'} onClick={onMaximize}>{maximized ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
    </div>
    <svg ref={svg} role="group" aria-label="Agent delegation graph" viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} style={maximized ? undefined : { height }} preserveAspectRatio="xMidYMin meet"
      onPointerDown={e => { if (e.button !== 0 || (e.target as Element).closest('foreignObject')) return; pan.current = { x: e.clientX, y: e.clientY, view }; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={e => { const o = pan.current; if (!o) return; const s = scale(); setView({ ...o.view, x: o.view.x - (e.clientX - o.x) / s, y: o.view.y - (e.clientY - o.y) / s }); }}
      onPointerUp={() => { pan.current = null; }} onPointerCancel={() => { pan.current = null; }}>
      {layout.groups.map(g => <g key={g.server.id} className="delegation-server"><rect x={g.x} y={g.y} width={g.width} height={g.height} rx={6} /><foreignObject x={g.x + 8} y={g.y + 4} width={g.width - 16} height={22}><div className="delegation-box-head" title={`${g.server.name} · ${g.server.type === 'custom' ? 'Custom MCP' : 'Enterprise MCP'}`}>{g.server.name} · {g.server.type === 'custom' ? 'Custom MCP' : 'Enterprise MCP'}</div></foreignObject></g>)}
      {layout.kinds.map(k => { const used = k.usedBy.length ? `used by ${k.usedBy.join(', ')}` : 'no granted tool uses this resource type'; return <g key={k.key} className="delegation-server delegation-kind"><rect x={k.x} y={k.y} width={k.width} height={k.height} rx={6} /><foreignObject x={k.x + 8} y={k.y + 4} width={k.width - 16} height={56}><div className="delegation-box-head" title={`${k.server} › ${k.kind}`}><strong>{k.kind}</strong><small title={used}>{k.server} · {used}</small></div></foreignObject></g>; })}
      {layout.edges.map(edge => {
        const x = edge.from.x + nodeW, y = edge.from.y + nodeH / 2, tx = edge.to.x, ty = edge.to.y + nodeH / 2;
        const bend = Math.max(40, Math.abs(tx - x) / 2);
        const b = edge.below;
        const d = b !== undefined
          ? `M ${x} ${y} C ${x + 40} ${y}, ${x + 40} ${b}, ${x + 80} ${b} L ${tx - 80} ${b} C ${tx - 40} ${b}, ${tx - 40} ${ty}, ${tx} ${ty}`
          : `M ${x} ${y} C ${x + bend} ${y}, ${tx - bend} ${ty}, ${tx} ${ty}`;
        const mx = (x + tx) / 2, my = b ?? (y + ty) / 2;
        const active = sameSelection(selected, edge.select), group = edge.select.type === 'group', toResource = edge.to.column === 'resources', empty = !group && !toResource && !edge.expires && !edge.conditions;
        if (edge.mapping !== undefined) return <g key={edge.key} className="delegation-edge delegation-edge--mapping" aria-hidden="true"><path d={d} /><text x={tx - 8} y={ty - 6} textAnchor="end">reads {edge.mapping}</text></g>;
        return <g key={edge.key} className="delegation-edge" data-active={active}>
          <path d={d} />
          {(readOnly && empty) || (toResource && !group) ? null : <foreignObject x={mx - 40} y={my - 12} width={80} height={24}><button type="button" className="delegation-edge-handle" aria-pressed={active} aria-label={empty ? `Add condition to ${edge.from.title} to ${edge.to.title}` : `Edit relation ${edge.from.title} to ${edge.to.title}`} title={empty ? 'Add a condition to this relation' : 'Edit this relation'} onClick={() => onSelect(empty && 'id' in edge.select ? { ...edge.select, addCondition: true } : edge.select)}>
            {group ? <strong>{edge.count}</strong> : null}
            {edge.expires ? <Clock size={12} aria-label="Has expiration" /> : null}
            {edge.conditions ? <><Braces size={12} aria-label="Call conditions" />{edge.conditions}</> : null}
            {empty ? <Plus size={12} aria-hidden="true" /> : null}
          </button></foreignObject>}
        </g>;
      })}
      {layout.nodes.map(node => <foreignObject key={node.key} x={node.x} y={node.y} width={nodeW} height={nodeH}>
        <div className="delegation-node-drag" onPointerDown={e => nodeDown(e, node)} onPointerMove={nodeMove} onPointerUp={() => { const m = move.current; move.current = null; if (m && !m.moved) onSelect(node.select); }} onPointerCancel={() => { move.current = null; }}>
          <button type="button" className="agent-graph-node delegation-node" data-column={node.column} data-group={!!node.count} aria-pressed={sameSelection(selected, node.select)} onClick={e => { if (e.detail === 0) onSelect(node.select); }}>
            <span className="agent-graph-node-icon"><NodeIcon node={node} /></span>
            <span className="agent-graph-node-copy"><strong title={node.title}>{node.title}</strong><small>{node.subtitle}</small></span>
          </button>
        </div>
      </foreignObject>)}
    </svg>
    <p className="agent-graph-pan-hint">Drag a box to move it · Drag the background to pan · Scroll to zoom</p>
  </div>;
}
