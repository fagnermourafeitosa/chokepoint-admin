import { useRef, useState } from 'react';
import { Bot, Users, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { ProviderMark } from '../../mcp/ProviderMark';
import { nodeHeight, nodeWidth, type graphLayout, type GraphNode } from './layout';
type Layout = ReturnType<typeof graphLayout>;

export function GraphCanvas({ layout, selected, onSelect }: { layout: Layout; selected?: string; onSelect: (n: GraphNode) => void }) {
  const fit = { x: 0, y: 0, width: layout.width, height: layout.height };
  const [view, setView] = useState(fit);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ pointer: number; x: number; y: number; view: typeof fit } | null>(null);
  function zoom(factor: number) { setView(old => { const width = Math.min(layout.width * 2, Math.max(Math.min(360, layout.width / 2), old.width * factor)); const ratio = width / old.width; return { x: old.x + (old.width - width) / 2, y: old.y + (old.height - old.height * ratio) / 2, width, height: old.height * ratio }; }); }
  return <div className="agent-graph-canvas">
    <div className="agent-graph-controls" aria-label="Graph view controls"><button type="button" className="cp-admin-button cp-admin-button--ghost" aria-label="Zoom in" onClick={() => zoom(.8)}><ZoomIn size={17} /></button><button type="button" className="cp-admin-button cp-admin-button--ghost" aria-label="Zoom out" onClick={() => zoom(1.25)}><ZoomOut size={17} /></button><button type="button" className="cp-admin-button cp-admin-button--ghost" aria-label="Fit graph to view" onClick={() => setView(fit)}><Maximize2 size={17} /></button></div>
    <svg ref={svg} role="group" aria-label="Agent connection graph. Drag the background to pan; use view controls to zoom." viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} onPointerDown={event => {
      if (event.button !== 0 || (event.target as Element).closest('foreignObject')) return;
      drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, view }; event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerMove={event => {
      const origin = drag.current; if (!origin || !svg.current) return;
      const matrix = svg.current.getScreenCTM(); if (!matrix) return;
      setView({ ...origin.view, x: origin.view.x - (event.clientX - origin.x) / matrix.a, y: origin.view.y - (event.clientY - origin.y) / matrix.d });
    }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      {layout.edges.map(edge => {
        const from = layout.nodes.find(n => n.id === edge.from)!, to = layout.nodes.find(n => n.id === edge.to)!;
        const x = layout.compact ? from.x + nodeWidth / 2 : from.x + nodeWidth;
        const y = layout.compact ? from.y + nodeHeight : from.y + nodeHeight / 2;
        const tx = layout.compact ? to.x + nodeWidth / 2 : to.x;
        const ty = layout.compact ? to.y : to.y + nodeHeight / 2;
        const curve = layout.compact ? `M ${x} ${y} C ${x} ${y + 22}, ${tx} ${ty - 22}, ${tx} ${ty}` : `M ${x} ${y} C ${x + 44} ${y}, ${tx - 44} ${ty}, ${tx} ${ty}`;
        return <g key={`${edge.from}-${edge.to}`} className="agent-graph-edge" data-active={selected === edge.from || selected === edge.to} aria-hidden="true"><path d={curve} /><text x={(x + tx) / 2 + (layout.compact ? 8 : 0)} y={(y + ty) / 2 - (layout.compact ? 0 : 10)} textAnchor={layout.compact ? "start" : "middle"}>{edge.label}</text></g>;
      })}
      {layout.nodes.map(node => {
        const content = <><span className="agent-graph-node-icon">{node.kind === 'connection' ? <ProviderMark provider={node.server?.provider_id} size={25} /> : node.kind === 'agent' ? <Bot size={25} /> : <Users size={25} />}</span><span className="agent-graph-node-copy"><strong title={node.title}>{node.title}</strong><small>{node.subtitle}</small></span></>;
        return <foreignObject key={node.id} x={node.x} y={node.y} width={nodeWidth} height={nodeHeight}>{node.kind === 'agent' ? <div className="agent-graph-node agent-graph-node--anchor">{content}</div> : <button type="button" className="agent-graph-node" aria-pressed={selected === node.id} onClick={() => onSelect(node)}>{content}</button>}</foreignObject>;
      })}
    </svg>
    <p className="agent-graph-pan-hint">Drag to pan · Select a node to inspect</p>
  </div>;
}
