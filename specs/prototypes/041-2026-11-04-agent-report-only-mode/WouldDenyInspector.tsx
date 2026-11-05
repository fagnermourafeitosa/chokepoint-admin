import { ArrowLeft, ArrowRight, Eye } from 'lucide-react';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import { BACKEND_SPEC, subjectIssuer, utc, type ProtoDecision } from './data';

// The decision inspector of a would-deny call: the same layout as the real inspector (Admin 030),
// with the outcome, the Report-only notice and no reference code. Fixed data.
type Step = { key: string; label: string; state: 'passed' | 'failed' | 'not_evaluated'; relation?: string };

function steps(d: ProtoDecision): Step[] {
  const failed = d.reason === 'No grant for this tool' ? 'capability' : d.reason === 'Resource not granted' ? 'resource' : 'condition';
  const order = ['delegation', 'capability', 'resource', 'condition'];
  const labels: Record<string, string> = { delegation: 'Delegation', capability: 'Tool', resource: 'Resource', condition: 'Rules' };
  const relation: Record<string, string> = { delegation: `${d.subject} delegates to ${d.agent}`, capability: `${d.agent} can call ${d.tool}`, resource: d.resource ? `${d.agent} can act on ${d.resource.id}` : 'No resource check' };
  const at = order.indexOf(failed);
  return order.map((key, i) => ({ key, label: labels[key], relation: relation[key], state: i < at ? 'passed' : i === at ? 'failed' : 'not_evaluated' }));
}

const stateText = { passed: 'Passed', failed: 'Failed · not enforced', not_evaluated: 'Not evaluated' } as const;

export function WouldDenyInspector({ decision: d, onBack }: { decision: ProtoDecision; onBack: () => void }) {
  const path = steps(d);
  const rule = d.reason === 'A call rule is false';
  const action = d.reason === 'No grant for this tool' ? `Add ${d.server} · ${d.tool} to ${d.agent}` : rule ? 'Open the rule' : `Allow ${d.resource?.id ?? 'this resource'} for ${d.tool}`;
  return <>
    <button className="cp-admin-button cp-admin-button--secondary trace-back" onClick={onBack}><ArrowLeft size={15} aria-hidden="true" />Back to the list</button>
    <article className="cp-admin-panel trace-inspector">
      <header className="trace-inspector-header"><span className="attention-kicker">Decision inspector</span><code>{d.id} · {utc(d.at)}</code></header>
      <div className="trace-title">
        <span className="trace-outcome trace-outcome-large trace-would-deny"><Eye size={19} aria-hidden="true" />Would deny</span>
        <h2>{d.tool}</h2>
        <p>{d.reason}. The call ran because {d.agent} was in Report-only.</p>
      </div>
      <div className="cp-admin-notice report-only-inspector-notice" data-tone="warning"><Eye size={18} aria-hidden="true" /><div><strong>Not blocked</strong>Chokepoint evaluated this call and its policy denies it, but {d.agent} was in Report-only, so the call reached {d.server}. In Enforce, the same call is denied and the caller gets a reference code.</div><WaitingBackend spec={BACKEND_SPEC} tip="The would_deny outcome and the mode of the agent at decision time." /></div>
      <p className="trace-who"><strong>{d.agent}</strong> acted for <strong>{d.subject}</strong> (Person · {subjectIssuer})</p>
      <ol className="trace-path trace-path-relations" aria-label="Recorded authorization path">
        {path.map(s => <li key={s.key} data-state={s.state} data-report-only={s.state === 'failed' || undefined} tabIndex={0}>
          <span className="trace-path-dot" />
          <strong>{s.label}</strong>
          <small>{stateText[s.state]}</small>
          {s.relation && s.state !== 'not_evaluated' ? <span className="trace-path-relation">{s.relation}</span> : null}
        </li>)}
      </ol>
      <div className="trace-detail-columns">
        <section className="trace-rule">
          <h3>Rules of {d.agent} · {d.server} · {d.tool}</h3>
          {rule ? <div className="trace-policy trace-rule-item">
            <strong>Refunds up to 500</strong>
            <span className="trace-policy-fail">Failed</span>
            <small>Reads call arguments only</small>
            <details className="rule-cel"><summary>CEL</summary><code>call.arguments.amount &lt;= 500</code></details>
          </div> : <p className="cp-admin-muted">Not evaluated: an earlier check failed.</p>}
          <p className="cp-admin-muted">Values of the call and of the attribute sources are never recorded.</p>
          <div className="trace-actions"><button className="cp-admin-button">{action}<ArrowRight size={15} /></button></div>
        </section>
        <section className="trace-repetition">
          <h3>Repeated in this window</h3>
          <p>Same agent, server, tool, reason and result.</p>
          <strong>{rule ? 9 : 14} would deny</strong>
          <small>Window Nov 4, 17:00 – 18:00 UTC</small>
          <small>First Nov 4, 17:03 UTC</small>
          <small>Last {utc(d.at)}</small>
        </section>
      </div>
      <dl className="trace-facts">
        {[
          ['Agent', d.agent],
          ['On behalf of', d.subject],
          ['Identity provider', subjectIssuer],
          ['Server', d.server],
          ['Tool', d.tool],
          ['Resource', d.resource ? `${d.resource.type} › ${d.resource.id}` : 'No resource check'],
          ['Mode', 'Report-only'],
          ['Reference code', 'None: the caller was not refused'],
          ['Permission revision', 'Revision 12'],
        ].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{k === 'Mode' ? <span className="mcp-badge report-only-chip" data-tone="warning"><Eye size={12} aria-hidden="true" />Report-only</span> : v}</dd></div>)}
      </dl>
    </article>
  </>;
}
