import { Dialog } from '../../../components/ui/dialog/Dialog';

// A fixed example of the whole model. Static drawing: no data, no evaluation.
function HierarchyDiagram() {
  const box = (x: number, y: number, w: number, h: number, title: string, sub?: string, tone?: string) => <g className={`help-box${tone ? ` help-box--${tone}` : ''}`}><rect x={x} y={y} width={w} height={h} rx={4} /><text x={x + 10} y={y + 20} className="help-title">{title}</text>{sub ? <text x={x + 10} y={y + 36} className="help-sub">{sub}</text> : null}</g>;
  const edge = (d: string, label: string, lx: number, ly: number, dashed = false) => <g className={`help-edge${dashed ? ' help-edge--dashed' : ''}`}><path d={d} /><text x={lx} y={ly}>{label}</text></g>;
  return <svg className="help-diagram" viewBox="0 0 800 330" role="img" aria-label="Example: Alice and Bruno in Keycloak delegate to Deploy bot. Deploy bot can call merge_pull_request and list_issues on GitHub, and can act on two repositories.">
    <defs><marker id="help-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
    <text x={10} y={18} className="help-col">WHO CAN DELEGATE</text><text x={196} y={18} className="help-col">AGENT</text><text x={372} y={18} className="help-col">SERVER · TOOLS</text><text x={600} y={18} className="help-col">RESOURCES</text>
    {box(10, 120, 150, 50, 'Keycloak customer', 'alice, bruno')}
    {box(196, 120, 140, 50, 'Deploy bot', 'acts, is verified', 'agent')}
    <g className="help-group"><rect x={372} y={40} width={196} height={190} rx={6} /><text x={382} y={58}>GitHub · Enterprise MCP</text></g>
    {box(382, 70, 176, 64, 'merge_pull_request', 'rule: 2 approvals')}
    {box(382, 150, 176, 50, 'list_issues', 'no rule')}
    <g className="help-group help-group--kind"><rect x={600} y={60} width={190} height={170} rx={6} /><text x={610} y={78}>GitHub › github_repository</text></g>
    {box(610, 90, 170, 50, 'acme/payments-api')}
    {box(610, 160, 170, 50, 'acme/web')}
    {edge('M 160 145 L 194 145', 'delegates', 160, 138)}
    {edge('M 336 140 C 360 140, 356 102, 380 102', 'can call', 330, 112)}
    {edge('M 336 150 C 360 150, 356 175, 380 175', 'can call', 330, 176)}
    {edge('M 266 170 C 266 270, 300 270, 340 270 L 560 270 C 590 270, 590 200, 598 200', 'can act on (agent → resource)', 380, 264)}
    {edge('M 558 102 C 578 102, 578 110, 598 110', 'reads /repository', 520, 66, true)}
    {edge('M 558 175 C 578 175, 578 120, 598 120', '', 0, 0, true)}
  </svg>;
}

const checks = [
  ['1', 'Did the subject delegate to this agent?', 'Keycloak customer → Deploy bot', 'no_delegation'],
  ['2', 'Can the agent call this server tool?', 'Deploy bot → GitHub · merge_pull_request', 'no_grant'],
  ['3', 'Can the agent act on this resource?', 'Deploy bot → acme/payments-api. Only for a tool with a resource mapping.', 'no_resource'],
  ['4', 'Do the rules of this agent · server · tool pass?', 'merge_pull_request needs 2 approvals', 'condition'],
];

const examples = [
  ['alice: merge a PR in acme/payments-api with 2 approvals', 'Allowed'],
  ['alice: merge a PR in acme/payments-api with 1 approval', 'Denied · condition'],
  ['alice: merge a PR in acme/infra', 'Denied · no_resource'],
  ['alice: create_issue in acme/web', 'Denied · no_grant'],
  ['camila (not in the list): list_issues', 'Denied · no_delegation'],
];

export function GraphHelp({ onClose }: { onClose: () => void }) {
  return <Dialog title="How this graph works" onClose={onClose}>
    <div className="admin-dialog-body graph-help">
      <p>A subject <strong>delegates</strong> to an agent. The agent <strong>acts</strong>. Each relation in the graph is a permission of the agent.</p>
      <HierarchyDiagram />
      <h3>Each call must pass four checks, in this order</h3>
      <table className="delegation-list-table"><thead><tr><th>#</th><th>Check</th><th>In the example</th><th>Deny reason</th></tr></thead>
        <tbody>{checks.map(([n, q, e, r]) => <tr key={n}><td>{n}</td><td>{q}</td><td>{e}</td><td><code>{r}</code></td></tr>)}</tbody></table>
      <h3>Example calls</h3>
      <ul className="graph-help-examples">{examples.map(([c, r]) => <li key={c}><span>{c}</span><strong data-ok={r === 'Allowed'}>{r}</strong></li>)}</ul>
      <h3>Remember</h3>
      <ul>
        <li><strong>A resource belongs to the agent</strong>, inside a server and a kind. It is not tied to one tool: every granted tool of that server that reads the same kind can use it.</li>
        <li><strong>A rule belongs to agent · server · tool.</strong> It reads call arguments and trusted attributes. A rule never targets a person.</li>
        <li><strong>Expiration</strong> can end a delegation or a tool relation.</li>
        <li>Relations and expirations are checked by OpenFGA. Rules are checked by the PDP with facts from the attribute sources.</li>
      </ul>
    </div>
    <div className="admin-dialog-actions"><button type="button" className="cp-admin-button" onClick={onClose}>Got it</button></div>
  </Dialog>;
}
