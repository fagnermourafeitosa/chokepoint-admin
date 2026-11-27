import { Bot, Braces, Maximize2, Plus, ScanSearch, User, Wrench, ZoomIn, ZoomOut } from 'lucide-react';
import '../../../src/features/access/delegation/graph.css';
import { agent, type Kind, type Row } from './data';

// Admin 064 prototype: the Graph view of Delegation and access with the change marks. The geometry
// follows the real graph (columns, rows, the server box); it does not pan, zoom or move boxes.
// A changed box has the badge of the List view. A changed relation is dashed, in the neutral line
// colour, so that a removed relation does not read as an error. One Unpublished chip on the canvas
// explains the dashes: a chip on each relation crowds the short relations of the tools.
const nodeW = 196, nodeH = 72, rowGap = 94, top = 40;
const colX = { delegators: 24, agent: 296, tools: 568 };
const width = 864 + nodeW + 24;
const badge: Record<Kind, { tone: string; text: string }> = {
  added: { tone: 'success', text: 'Added' },
  removed: { tone: 'danger', text: 'Removed' },
  changed: { tone: 'warning', text: 'Changed' },
};
type Box = { key: string; x: number; y: number; title: string; subtitle: string; icon: 'person' | 'agent' | 'tool'; kind?: Kind; rules?: number };

const icons = { person: <User size={20} />, agent: <Bot size={22} />, tool: <Wrench size={20} /> };

function Node({ box, marked }: { box: Box; marked: boolean }) {
  const kind = marked ? box.kind : undefined;
  return <foreignObject x={box.x} y={box.y} width={nodeW} height={nodeH}>
    <div className="delegation-node-drag">
      <button type="button" className="agent-graph-node delegation-node" data-column={box.icon === 'agent' ? 'agent' : undefined} data-change={kind}>
        <span className="agent-graph-node-icon">{icons[box.icon]}</span>
        <span className="agent-graph-node-copy"><strong title={box.title}>{box.title}</strong>
          <small>{kind ? <span className="mcp-badge" data-tone={badge[kind].tone}>{badge[kind].text}</span> : null}{box.subtitle}</small></span>
      </button>
    </div>
  </foreignObject>;
}

function Edge({ from, to, kind, rules, editable }: { from: Box; to: Box; kind?: Kind; rules?: number; editable: boolean }) {
  const x = from.x + nodeW, y = from.y + nodeH / 2, tx = to.x, ty = to.y + nodeH / 2, bend = Math.max(40, Math.abs(tx - x) / 2);
  const mx = (x + tx) / 2, my = (y + ty) / 2;
  const handle = rules ? <><Braces size={12} aria-label="Call conditions" />{rules}</> : editable && kind !== 'removed' ? <Plus size={12} aria-hidden="true" /> : null;
  return <g className="delegation-edge" data-change={kind}>
    <path d={`M ${x} ${y} C ${x + bend} ${y}, ${tx - bend} ${ty}, ${tx} ${ty}`} />
    {handle ? <foreignObject x={mx - 40} y={my - 12} width={80} height={24}><button type="button" className="delegation-edge-handle">{handle}</button></foreignObject> : null}
  </g>;
}

// rows: the rows of the List view; draft: the Draft view with a draft; marked: Proposed (not Today).
export function GraphView({ delegators, tools, draft, marked }: { delegators: Row[]; tools: Row[]; draft: boolean; marked: boolean }) {
  const keep = (r: Row) => (draft ? marked || r.kind !== 'removed' : r.kind !== 'added');
  const people = delegators.filter(keep).map((r, i): Box => ({ key: r.label, x: colX.delegators, y: top + i * rowGap, title: r.cells[0], subtitle: `${draft ? r.cells[1] : r.published ?? r.cells[1]} people`, icon: 'person', kind: r.kind }));
  const shown = tools.filter(keep);
  const toolBoxes = shown.map((r, i): Box => ({ key: r.label, x: colX.tools, y: top + 22 + i * rowGap, title: r.cells[0], subtitle: r.rules ? `${r.rules} ${r.rules === 1 ? 'rule' : 'rules'}` : 'No rules', icon: 'tool', kind: r.kind, rules: r.rules }));
  const end = top + 22 + shown.length * rowGap + 30;
  const rows = Math.max(people.length, (end - top) / rowGap, 1);
  const height = Math.max(top + rows * rowGap + 40, end + 50);
  const center: Box = { key: 'agent', x: colX.agent, y: top + (rows * rowGap - nodeH) / 2, title: agent.name, subtitle: 'Agent · acts and is verified', icon: 'agent' };
  const box = toolBoxes.length ? { x: colX.tools - 10, y: toolBoxes[0].y - 30, w: nodeW + 20, h: (toolBoxes.length - 1) * rowGap + nodeH + 40 } : undefined;
  const mark = (b: Box) => (draft && marked ? b.kind : undefined);
  const changed = draft && marked && [...people, ...toolBoxes].some(b => b.kind);
  return <div className="delegation-canvas">
    {changed ? <p className="rr-graph-legend"><span className="mcp-badge" data-tone="warning">Unpublished</span><svg width="28" height="8" aria-hidden="true"><path d="M 0 4 L 28 4" /></svg>Dashed: changed in the draft, not published yet.</p> : null}
    <div className="agent-graph-controls" aria-label="Graph view controls">
      <button type="button" className="cp-admin-button cp-admin-button--ghost" aria-label="Zoom in"><ZoomIn size={17} /></button>
      <button type="button" className="cp-admin-button cp-admin-button--ghost" aria-label="Zoom out"><ZoomOut size={17} /></button>
      <button type="button" className="cp-admin-button cp-admin-button--ghost" aria-label="Fit graph to view"><ScanSearch size={17} /></button>
      <button type="button" className="cp-admin-button cp-admin-button--ghost" aria-label="Full screen"><Maximize2 size={17} /></button>
    </div>
    <svg role="group" aria-label="Agent delegation graph" viewBox={`0 0 ${width} ${height}`} style={{ height: Math.max(380, height) }} preserveAspectRatio="xMidYMin meet">
      {box ? <g className="delegation-server"><rect x={box.x} y={box.y} width={box.w} height={box.h} rx={6} /><foreignObject x={box.x + 8} y={box.y + 4} width={box.w - 16} height={22}><div className="delegation-box-head">Acme Billing · Custom MCP</div></foreignObject></g> : null}
      {people.map(p => <Edge key={`e-${p.key}`} from={p} to={center} kind={mark(p)} editable={false} />)}
      {toolBoxes.map(t => <Edge key={`e-${t.key}`} from={center} to={t} kind={mark(t)} rules={t.rules} editable={draft} />)}
      {[...people, center, ...toolBoxes].map(b => <Node key={b.key} box={b} marked={draft && marked} />)}
    </svg>
    <p className="agent-graph-pan-hint">Drag a box to move it · Drag the background to pan · Scroll to zoom</p>
  </div>;
}
