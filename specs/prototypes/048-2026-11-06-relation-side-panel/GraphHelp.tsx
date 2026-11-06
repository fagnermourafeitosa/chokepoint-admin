import { Dialog } from '../../../src/components/ui/dialog/Dialog';

// Admin 048 prototype copy of GraphHelp, only rules: a call passes delegation, tool grant and rules.

// A fixed example of the whole model. Static drawing: no data, no evaluation.
function HierarchyDiagram() {
  const box = (x: number, y: number, w: number, h: number, title: string, sub?: string, tone?: string) => <g className={`help-box${tone ? ` help-box--${tone}` : ''}`}><rect x={x} y={y} width={w} height={h} rx={4} /><text x={x + 10} y={y + 20} className="help-title">{title}</text>{sub ? <text x={x + 10} y={y + 36} className="help-sub">{sub}</text> : null}</g>;
  const edge = (d: string, label: string, lx: number, ly: number, dashed = false) => <g className={`help-edge${dashed ? ' help-edge--dashed' : ''}`}><path d={d} /><text x={lx} y={ly}>{label}</text></g>;
  return <svg className="help-diagram" viewBox="0 0 600 250" role="img" aria-label="Example: everyone in Keycloak but Diego delegates to Deploy bot. Deploy bot can call merge_pull_request, with two rules, and list_issues, with none.">
    <defs><marker id="help-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
    <text x={10} y={18} className="help-col">WHO CAN DELEGATE</text><text x={196} y={18} className="help-col">AGENT</text><text x={372} y={18} className="help-col">SERVER · TOOLS · RULES</text>
    {box(10, 120, 150, 50, 'Keycloak customer', '80 of 81 delegate')}
    {box(196, 120, 140, 50, 'Deploy bot', 'acts, is verified', 'agent')}
    <g className="help-group"><rect x={372} y={40} width={216} height={190} rx={6} /><text x={382} y={58}>GitHub · Enterprise MCP</text></g>
    {box(382, 70, 196, 64, 'merge_pull_request', '2 rules: approvals, repository')}
    {box(382, 150, 196, 50, 'list_issues', 'no rules')}
    {edge('M 160 145 L 194 145', 'delegates', 150, 112)}
    {edge('M 336 140 C 360 140, 356 102, 380 102', 'can call', 330, 112)}
    {edge('M 336 150 C 360 150, 356 175, 380 175', 'can call', 330, 176)}
  </svg>;
}

const checks = [
  ['1', 'Did the subject delegate to this agent?', 'Keycloak customer → Deploy bot', 'no_delegation'],
  ['2', 'Can the agent call this server tool?', 'Deploy bot → GitHub · merge_pull_request', 'no_grant'],
  ['3', 'Do the rules of this agent · server · tool pass?', 'merge_pull_request: approvals >= 2, and repository in ["acme/payments-api", "acme/web"]', 'condition'],
];

const cel = [
  ['Call arguments', 'context.chokepoint.arguments["<name>"]', 'context.chokepoint.arguments["base"] == "main"'],
  ['Trusted attributes of the object of the call, from a context source bound to the tool', 'resource.properties.chokepoint["<binding>"].values["<name>"]', 'resource.properties.chokepoint["github-pull-request"].values["approvals"] >= 2'],
  ['Trusted attributes of the subject', 'subject.properties.chokepoint["<binding>"].values["<name>"]', 'subject.properties.chokepoint["hr-directory"].values["department"] == "engineering"'],
];

const examples = [
  ['alice: merge a PR in acme/payments-api with 2 approvals', 'Allowed'],
  ['alice: merge a PR in acme/payments-api with 1 approval', 'Denied · condition'],
  ['alice: merge a PR in acme/infra (not in the repository rule)', 'Denied · condition'],
  ['alice: create_issue in acme/web', 'Denied · no_grant'],
  ['diego (not selected in Keycloak): list_issues', 'Denied · no_delegation'],
];

export function GraphHelp({ onClose }: { onClose: () => void }) {
  return <Dialog title="How this graph works" onClose={onClose}>
    <div className="admin-dialog-body graph-help">
      <p>A subject <strong>delegates</strong> to an agent. The agent <strong>acts</strong>. Each relation in the graph is a permission of the agent.</p>
      <HierarchyDiagram />
      <h3>Each call must pass three checks, in this order</h3>
      <table className="delegation-list-table"><thead><tr><th>#</th><th>Check</th><th>In the example</th><th>Deny reason</th></tr></thead>
        <tbody>{checks.map(([n, q, e, r]) => <tr key={n}><td>{n}</td><td>{q}</td><td>{e}</td><td><code>{r}</code></td></tr>)}</tbody></table>
      <h3>Rules are CEL</h3>
      <p>A rule is a CEL expression on agent · server · tool. Every rule must pass. The rules of the example:</p>
      <pre className="graph-help-cel"><code>{'resource.properties.chokepoint["github-pull-request"].values["approvals"] >= 2\ncontext.chokepoint.arguments["repository"] in ["acme/payments-api", "acme/web"]'}</code></pre>
      <table className="delegation-list-table"><thead><tr><th>A rule reads</th><th>In CEL</th><th>Example</th></tr></thead>
        <tbody>{cel.map(([what, path, example]) => <tr key={what}><td>{what}</td><td><code>{path}</code></td><td><code>{example}</code></td></tr>)}</tbody></table>
      <h3>Example calls</h3>
      <ul className="graph-help-examples">{examples.map(([c, r]) => <li key={c}><span>{c}</span><strong data-ok={r === 'Allowed'}>{r}</strong></li>)}</ul>
      <h3>Remember</h3>
      <ul>
        <li><strong>A rule belongs to agent · server · tool.</strong> It reads call arguments and trusted attributes from your context sources. A list of exact values is a rule too: <code>repository in [...]</code>. A rule never targets a person.</li>
        <li><strong>Who can delegate</strong> is set for each identity provider: the selected people and services, with Select all for everyone. Tools and rules are the same for everyone who delegates to the agent, and for every instance of the agent.</li>
        <li><strong>Expiration</strong> can end a delegation or a tool relation.</li>
        <li>Delegations, tool grants and expirations are checked by OpenFGA. Rules are checked by the PDP in CEL.</li>
      </ul>
    </div>
    <div className="admin-dialog-actions"><button type="button" className="cp-admin-button" onClick={onClose}>Got it</button></div>
  </Dialog>;
}
