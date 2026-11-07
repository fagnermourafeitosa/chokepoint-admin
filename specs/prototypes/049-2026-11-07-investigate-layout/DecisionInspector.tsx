import '../../../src/features/investigate/inspector.css';
import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, Check, Eye, X } from 'lucide-react';
import '../../../src/features/access/delegation/delegation.css';
import { ReportOnlyChip } from '../../../src/components/report-only/ReportOnlyChip';
import type { Decision, DecisionDetail } from '../../../src/features/investigate/types';
import { TracePager, utcTime } from '../../../src/features/investigate/TraceUI';
import { agentText, denyText, kindText, stateText, stepLabel, subjectName } from '../../../src/features/investigate/labels';
import type { useInvestigation } from './useInvestigation';
import { detailOf, problemDecisions, ruleSentence } from './data';

// Admin 049 prototype: the decision detail, a copy of src/features/investigate/DecisionInspector.tsx
// on 2026-11-07, read from fixed data. The Inbox item status is shown, not changed; the revision
// history panel is left out; nothing is written.
type State = ReturnType<typeof useInvestigation>;

// The relation checked by each step of the path (Backend 034 evidence).
const relationOfStep: Record<string, 'delegation' | 'capability' | 'resource'> = { delegation: 'delegation', capability: 'capability', resource: 'resource' };

// Steps recorded by the PEP before the PDP decision (Backend 034).
const preDecisionStep = new Set(['identity', 'tool_review']);

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
  const relations = new Map((d.evidence?.relations || []).map((r) => [r.key, r]));
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
      <button className="cp-admin-button cp-admin-button--secondary trace-back" onClick={onBack}>
        <ArrowLeft size={15} aria-hidden="true" />
        Back to the list
      </button>
      <article className="cp-admin-panel trace-inspector">
        <header className="trace-inspector-header">
          <span className="attention-kicker">Decision inspector</span>
          <span className="trace-inspector-meta">
            {detail.problem?.signal ? <span className="mcp-badge" data-tone={detail.problem.signal.status === 'resolved' ? 'success' : 'warning'}>Inbox item · {detail.problem.signal.status}</span> : null}
            <code>{d.id} · {utcTime(d.decided_at)}</code>
          </span>
        </header>
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
          <p>{d.reason ? denyText[d.reason.label] ?? d.reason.description : permit ? 'Every check passed.' : 'The deny reason was not recorded for this historical call.'}{wouldDeny ? ` The call ran because ${agent} was in Report-only.` : ''}</p>
        </div>
        {wouldDeny ? (
          <div className="cp-admin-notice cp-report-only-notice trace-report-only-notice">
            <Eye size={18} aria-hidden="true" />
            <div><strong>Not blocked</strong>Xokepoint evaluated this call and its policy denies it, but {agent} was in Report-only, so the call reached {server}. In Enforce, the same call is denied and the caller gets a reference code.</div>
          </div>
        ) : null}
        <p className="trace-who">
          <strong>{agent}</strong> acted for <strong>{subjectName(d.subject)}</strong> ({[kind, d.subject.issuer].filter(Boolean).join(' · ')})
        </p>
        {steps.length ? (
          <ol className="trace-path trace-path-relations" aria-label="Recorded authorization path">
            {steps.map((step, i) => {
              const relation = relationOfStep[step.key] ? relations.get(relationOfStep[step.key]) : undefined;
              return (
                <li key={`${step.key}-${i}`} data-state={step.state} data-report-only={wouldDeny && step.state === 'failed' ? '' : undefined} tabIndex={0}>
                  <span className="trace-path-dot" />
                  <strong>{stepLabel[step.key] || step.key.replaceAll('_', ' ')}</strong>
                  <small>{wouldDeny && step.state === 'failed' ? 'Failed · not enforced' : stateText[step.state]}</small>
                  {relation?.display ? <span className="trace-path-relation">{relation.display}</span> : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="trace-missing">The authorization path was not recorded for this historical decision.</p>
        )}
        <div className="trace-detail-columns">
          <section className="trace-rule">
            <h3>Rules of {agent} · {server} · {d.tool}</h3>
            {rules.length ? (
              rules.map((p, i) => (
                <div key={`${p.policy_id}-${i}`} className="trace-policy trace-rule-item">
                  <strong>{p.name}</strong>
                  <span className={p.permit ? 'trace-policy-pass' : 'trace-policy-fail'}>{p.permit ? 'Passed' : 'Failed'}</span>
                  <small>
                    {p.required_bindings.length ? `Reads ${p.required_bindings.join(', ')}` : 'Reads call arguments only'}
                    {p.required_limits?.length ? ` · instance limits ${p.required_limits.join(', ')}${p.limits_present ? '' : ' (missing in the token)'}` : ''}
                  </small>
                  <p className="rule-sentence rule-sentence--read proto-rule-read">Reads as: <strong>{ruleSentence[p.expression] ?? p.expression}</strong></p>
                </div>
              ))
            ) : (
              <p className="cp-admin-muted">
                {d.reason?.label === 'condition' ? 'The rule was not recorded.' : steps.some((s) => s.key === 'condition' && s.state === 'not_evaluated') ? 'Not evaluated: an earlier check failed.' : 'No rule on this tool.'}
              </p>
            )}
            <p className="cp-admin-muted">Values of the call and of the attribute sources are never recorded.</p>
            {action ? (
              <div className="trace-actions">
                {action.to ? (
                  <Link className="cp-admin-button" to={action.to}>{action.label}<ArrowRight size={15} /></Link>
                ) : (
                  <p className="cp-admin-muted">{action.unavailable}</p>
                )}
              </div>
            ) : null}
          </section>
          <section className="trace-repetition">
            <h3>Repeated in this window</h3>
            <p>Same agent, server, tool{d.reason ? ', reason' : ''} and result.</p>
            <strong>{detail.repeat.count} {wouldDeny ? 'would deny' : permit ? 'allowed' : 'denied'}</strong>
            <small>Window {utcTime(detail.repeat.window_start)} – {utcTime(detail.repeat.window_end)}</small>
            <small>First {utcTime(detail.repeat.first_at)}</small>
            <small>Last {utcTime(detail.repeat.last_at)}</small>
          </section>
        </div>
        <Breakdown detail={detail} select={state.open} />
        <dl className="trace-facts">
          {[
            ['Agent', d.agent.name ? `${agentText(d.agent)} (${d.agent.id})` : d.agent.id],
            ['On behalf of', d.subject.name ? `${d.subject.name} (${d.subject.subject})` : d.subject.subject],
            ['Identity provider', d.subject.issuer],
            ['Server', server],
            ['Tool', d.tool],
            ...(d.reference ? [['Reference', d.reference]] : []),
            // Backend 057: the mode of the agent at decision time; a would deny has no code.
            ...(d.enforcement ? [['Mode', d.enforcement === 'report_only' ? <ReportOnlyChip key="mode" /> : 'Enforce']] : []),
            ...(wouldDeny ? [['Reference', 'None: the caller was not refused']] : []),
            ['Decided at (UTC)', utcTime(d.decided_at)],
            ['Permission revision', d.effective_revision == null ? 'Not recorded' : (
              <span className="trace-revision">
                {`Revision ${d.effective_revision}`}
                {d.published_revision != null && d.published_revision !== d.effective_revision ? <small>Revision {d.published_revision} was applying</small> : null}
              </span>
            )],
          ].map(([name, value]) => (
            <div key={name as string}><dt>{name}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      </article>
    </>
  );
}

// Decisions in this problem: a copy of DecisionBreakdown, from fixed data.
function Breakdown({ detail, select }: { detail: DecisionDetail; select: (id: string) => void }) {
  const [page, setPage] = useState(1);
  const problem = detail.problem;
  if (!problem) return null;
  const items = problemDecisions(problem);
  return (
    <section className="trace-breakdown">
      <h3>Decisions in this problem · {problem.count}</h3>
      <div className="trace-breakdown-list">
        {items.map((d) => (
          <button key={d.id} className={d.id === detail.decision.id ? 'is-selected' : ''} onClick={() => select(d.id)}>
            <time dateTime={d.decided_at}>{utcTime(d.decided_at)}</time>
            <span>{subjectName(d.subject)}</span>
            <code>{d.condition ? ruleSentence[d.condition] ?? d.condition : d.reason?.label || 'allowed'}</code>
          </button>
        ))}
      </div>
      <TracePager page={page} total={items.length} size={6} busy={false} onPage={setPage} />
    </section>
  );
}

export function DecisionInspector({ state }: { state: State }) {
  const id = state.params.get('decision_id');
  const detail = id ? detailOf(id) : undefined;
  if (!detail) return <section className="cp-admin-panel trace-empty"><h2>This decision is not in the prototype data</h2><button className="cp-admin-button cp-admin-button--ghost" onClick={state.back}>Back to the list</button></section>;
  return <InspectorBody detail={detail} state={state} onBack={state.back} />;
}
