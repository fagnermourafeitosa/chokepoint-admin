import '../../../src/features/investigate/inspector.css';
import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, Check, CircleHelp, Eye, X } from 'lucide-react';
import '../../../src/features/access/delegation/delegation.css';
import { ReportOnlyChip } from '../../../src/components/report-only/ReportOnlyChip';
import { QuickIncident } from '../../../src/components/quick-incident/QuickIncident';
import { Tooltip } from '../../../src/components/ui/tooltip/Tooltip';
import type { Decision, DecisionDetail, StepState } from '../../../src/features/investigate/types';
import { TracePager, utcTime } from '../../../src/features/investigate/TraceUI';
import { agentText, denyText, kindText, stateText, stepLabel, subjectName } from '../../../src/features/investigate/labels';
import type { useInvestigation } from './useInvestigation';
import { detailOf, problemDecisions, ruleSentence } from './data';

// Admin 049 prototype: the decision detail, a copy of src/features/investigate/DecisionInspector.tsx
// on 2026-11-07, read from fixed data. The Inbox item status is shown, not changed; the revision
// history panel is left out; nothing is written.
type State = ReturnType<typeof useInvestigation>;


// Steps recorded by the PEP before the PDP decision (Backend 034).
const preDecisionStep = new Set(['identity', 'tool_review']);

// Admin 049: the path shows the delegation, the agent, the MCP server and the tool as separate dots,
// even though the PDP checks the agent → tool relation once. Illustrative: the agent dot passes
// (a failed identity check shows as its own step), and the server dot passes when the tool step
// was evaluated.
type PathNode = { key: string; label: string; state: StepState; value?: string };
function pathNodes(steps: { key: string; state: StepState }[], d: Decision, rules: { name: string; permit: boolean }[]): PathNode[] {
  return steps.flatMap((step): PathNode[] => {
    if (step.key === 'delegation') return [
      { key: 'delegation', label: 'Delegation', state: step.state, value: `${subjectName(d.subject)} → ${d.agent.name || d.agent.id}` },
      { key: 'agent', label: 'Agent', state: 'passed', value: d.agent.name || d.agent.id },
    ];
    if (step.key === 'capability') return [
      { key: 'server', label: 'MCP server', state: step.state === 'not_evaluated' ? 'not_evaluated' : 'passed', value: d.server_name || d.server_id },
      { key: 'tool', label: 'Tool', state: step.state, value: d.tool },
    ];
    if (step.key === 'condition') return [{ key: 'condition', label: 'Rules', state: step.state, value: rules.filter((r) => !r.permit).map((r) => r.name).join(', ') || undefined }];
    return [{ key: step.key, label: stepLabel[step.key] || step.key.replaceAll('_', ' '), state: step.state }];
  });
}

// accessPath opens the agent editor of Admin 026 at the place of the fix. It
// only navigates; it never changes permissions (Admin 030 section 3).
export function accessPath(params: Record<string, string | undefined>, returnTo: string) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  query.set('return_to', returnTo);
  return `/access?${query}`;
}

// The one action of a deny reason (Admin 030 section 3). A deny of a rule opens
// that rule; the label does not suggest a decision (Admin 045).
function reasonAction(d: Decision, detail: DecisionDetail, returnTo: string): { label: string; to?: string; unavailable?: string } | undefined {
  const base = { agent_id: d.agent.id, decision_id: d.id };
  switch (d.reason?.label) {
    case 'no_delegation':
      return { label: 'Open the rule', to: accessPath({ ...base, section: 'people', connection_id: d.subject.identity_connection_id ?? undefined }, returnTo) };
    case 'no_grant':
      return { label: 'Open the rule', to: accessPath({ ...base, section: 'grants', server_id: d.server_id, tool: d.tool }, returnTo) };
    case 'no_resource':
      return { label: 'Open the rule', to: accessPath({ ...base, section: 'grants', server_id: d.server_id, tool: d.tool }, returnTo) };
    case 'condition':
      return { label: 'Open the rule', to: accessPath({ ...base, section: 'policies', server_id: d.server_id, tool: d.tool, policy_id: d.policy_id ?? undefined }, returnTo) };
    case 'tool_not_reviewed':
      return { label: 'Review the tool', unavailable: detail.actions.length ? undefined : 'The server of this tool is no longer available.' };
  }
  return undefined;
}

function InspectorBody({ detail, state, onBack }: { detail: DecisionDetail; state: State; onBack: () => void }) {
  const d = detail.decision;
  // The path shows the four steps of Admin 030. The checks before the PDP
  // (identity, tool review) show only when they did not pass.
  const steps = [...(d.evidence?.steps || [])]
    .filter((s) => !preDecisionStep.has(s.key) || s.state !== 'passed')
    .sort((a, b) => a.order - b.order);
  const rules = (d.evidence?.policies || []).filter((p) => p.server_id === d.server_id && (!p.tool || p.tool === d.tool));
  const agent = d.agent.name || d.agent.id;
  const server = d.server_name || d.server_id;
  const kind = kindText(d.subject);
  // Backend 057: three outcomes; a would deny ran in Report-only.
  const permit = d.outcome === 'permit';
  const wouldDeny = d.outcome === 'would_deny';
  const action = reasonAction(d, detail, `/investigate?${state.params}`);
  return (
    <>
      <div className="quick-incident-row proto-detail-bar">
        <button className="cp-admin-button cp-admin-button--secondary trace-back" onClick={onBack}>
          <ArrowLeft size={15} aria-hidden="true" />
          Back to the list
        </button>
        <QuickIncident />
      </div>
      <article className="cp-admin-panel trace-inspector">
        <header className="trace-inspector-header">
          <span className="trace-inspector-meta">
            {detail.problem?.signal ? <span className="mcp-badge" data-tone={detail.problem.signal.status === 'resolved' ? 'success' : 'warning'}>Inbox item · {detail.problem.signal.status}</span> : null}
            <code>{utcTime(d.decided_at)}</code>
          </span>
        </header>
        {steps.length ? (
          <ol className="trace-path trace-path-relations" aria-label="Recorded authorization path">
            {pathNodes(steps, d, rules).map((node, i) => (
              <li key={`${node.key}-${i}`} data-state={node.state} data-report-only={wouldDeny && node.state === 'failed' ? '' : undefined} tabIndex={0}>
                <span className="trace-path-dot" />
                <strong>{node.label}</strong>
                <small>{wouldDeny && node.state === 'failed' ? 'Failed · not enforced' : stateText[node.state]}</small>
                {node.value ? <span className="trace-path-relation">{node.value}</span> : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="trace-missing">The authorization path was not recorded for this historical decision.</p>
        )}
        <div className="trace-title">
          {wouldDeny ? (
            <span className="trace-outcome trace-outcome-large cp-would-deny"><Eye size={19} aria-hidden="true" />Would deny</span>
          ) : (
            <span className={`trace-outcome trace-outcome-large ${permit ? 'trace-allow' : 'trace-deny'}`}>
              {permit ? <Check size={19} /> : <X size={19} />}
              {permit ? 'Allowed' : 'Denied'}
            </span>
          )}
          <h2>{d.tool}</h2>
          <p>{d.reason?.label === 'condition' && d.condition ? <span className="relation-label">Rule not met: <strong>{ruleSentence[d.condition] ?? d.condition}</strong><Tooltip content="The values of the call and of the attribute sources are never recorded. The rule shows what was checked, not the value that failed."><CircleHelp size={14} aria-label="About the recorded rule" /></Tooltip></span> : d.reason ? denyText[d.reason.label] ?? d.reason.description : permit ? 'Every check passed.' : 'The deny reason was not recorded for this historical call.'}{wouldDeny ? ` The call ran because ${agent} was in Report-only.` : ''}</p>
          {action ? (
            action.to ? <Link className="cp-admin-button proto-title-action" to={action.to}>{action.label}<ArrowRight size={15} /></Link> : <p className="cp-admin-muted">{action.unavailable}</p>
          ) : null}
        </div>
        {wouldDeny ? (
          <div className="cp-admin-notice cp-report-only-notice trace-report-only-notice">
            <Eye size={18} aria-hidden="true" />
            <div><strong>Not blocked</strong>The policy of this call denies it, but {agent} was in Report-only, so the call reached {server}. In Enforce, the same call is denied and the caller gets a reference code.</div>
          </div>
        ) : null}
        <div className="proto-facts-columns">
          {[
            [
              ['Identity provider', d.subject.issuer],
              ['On behalf of', d.subject.name ? `${d.subject.name} (${d.subject.subject})` : d.subject.subject],
              ['Agent', d.agent.name ? `${agentText(d.agent)} (${d.agent.id})` : d.agent.id],
              ['MCP server', server],
              ['Tool', d.tool],
            ],
            [
              // Backend 057: the mode of the agent at decision time.
              ['Mode', d.enforcement === 'report_only' ? <ReportOnlyChip key="mode" /> : 'Enforce', 'The mode of the agent when the call was decided. Enforce blocks a denied call. Report-only lets the call run and records it as would deny.'],
              ['Reference', wouldDeny ? 'None: the caller was not refused' : d.reference ? <span className="mcp-badge proto-reference">{d.reference}</span> : '—', 'The code that the caller receives with a denied call. Paste it in Quick incident to open this decision.'],
              ['Permission revision', d.effective_revision == null ? 'Not recorded' : (
                <span className="trace-revision">
                  {`Revision ${d.effective_revision}`}
                  {d.published_revision != null && d.published_revision !== d.effective_revision ? <small>Revision {d.published_revision} was applying</small> : null}
                </span>
              )],
              ['Decided at (UTC)', utcTime(d.decided_at)],
            ],
          ].map((facts, c) => (
            <dl key={c} className="trace-facts proto-facts">
              {facts.map(([name, value, help]) => (
                <div key={name as string}>
                  <dt>{help ? <span className="relation-label">{name}<Tooltip content={help as string}><CircleHelp size={14} aria-label={`About ${(name as string).toLowerCase()}`} /></Tooltip></span> : name}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ))}
        </div>
        <Breakdown detail={detail} select={state.open} />
      </article>
    </>
  );
}

// Decisions in this problem: a copy of DecisionBreakdown, from fixed data.
function Breakdown({ detail, select }: { detail: DecisionDetail; select: (id: string) => void }) {
  const [page, setPage] = useState(1);
  const problem = detail.problem;
  const d = detail.decision;
  const outcome = d.outcome === 'would_deny' ? 'would deny' : d.outcome === 'permit' ? 'allowed' : 'denied';
  const window = `${utcTime(detail.repeat.window_start)} – ${utcTime(detail.repeat.window_end)}`;
  const items = problem ? problemDecisions(problem) : [];
  return (
    <section className="trace-breakdown">
      <h3>{problem ? 'Decisions in this problem' : 'Repeated in this window'} · {detail.repeat.count} {outcome}</h3>
      <p className="cp-admin-muted proto-window">Same agent, server, tool{d.reason ? ', reason' : ''} and result · window {window}</p>
      {items.length ? (
        <>
          <div className="trace-breakdown-list">
            {items.map((x) => (
              <button key={x.id} className={x.id === d.id ? 'is-selected' : ''} onClick={() => select(x.id)}>
                <time dateTime={x.decided_at}>{utcTime(x.decided_at)}</time>
                <span>{subjectName(x.subject)}</span>
                <code>{x.reference ?? `ref-${x.id}`}</code>
              </button>
            ))}
          </div>
          <TracePager page={page} total={items.length} size={6} busy={false} onPage={setPage} />
        </>
      ) : null}
    </section>
  );
}

export function DecisionInspector({ state }: { state: State }) {
  const id = state.params.get('decision_id');
  const detail = id ? detailOf(id) : undefined;
  if (!detail) return <section className="cp-admin-panel trace-empty"><h2>This decision is not in the prototype data</h2><button className="cp-admin-button cp-admin-button--ghost" onClick={state.back}>Back to the list</button></section>;
  return <InspectorBody detail={detail} state={state} onBack={state.back} />;
}
