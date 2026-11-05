import './inspector.css';
import { DecisionBreakdown } from './DecisionBreakdown';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Check, Eye, X } from 'lucide-react';
import { ReportOnlyChip } from '../../components/report-only/ReportOnlyChip';
import { HttpError } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
import { actionPath } from '../access/target-context';
import { problemKey } from './types';
import type { Decision, DecisionDetail } from './types';
import type { useInvestigation } from './useInvestigation';
import { utcTime } from './TraceUI';
import { agentText, denyText, kindText, stateText, stepLabel, subjectName } from './labels';
import { ExchangeInspector } from './ExchangeInspector';

type State = ReturnType<typeof useInvestigation>;

import { RevisionHistory } from '../access/delegation/RevisionHistory';
import { CatalogProvider } from '../access/delegation/catalog';

// The history panel names servers and identity providers; it loads no directory.
const noIssuers: string[] = [];


// The relation checked by each step of the path (Backend 034 evidence).
const relationOfStep: Record<string, 'delegation' | 'capability' | 'resource'> = { delegation: 'delegation', capability: 'capability', resource: 'resource' };

// Steps recorded by the PEP before the PDP decision (Backend 034).
const preDecisionStep = new Set(['identity', 'tool_review']);

// accessPath opens the agent editor of Admin 026 at the place of the fix. It
// only navigates; it never changes permissions (Admin 030 section 3).
export function accessPath(params: Record<string, string | undefined>, signalId: string | undefined, returnTo: string) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  if (signalId) query.set('signal_id', signalId);
  query.set('return_to', returnTo);
  return `/access?${query}`;
}

// The one action of a deny reason (Admin 030 section 3).
function reasonAction(d: Decision, detail: DecisionDetail, signalId: string | undefined, returnTo: string): { label: string; to?: string; unavailable?: string } | undefined {
  const agent = d.agent.name || d.agent.id;
  const server = d.server_name || d.server_id;
  const base = { agent_id: d.agent.id, decision_id: d.id };
  switch (d.reason?.label) {
    case 'no_delegation':
      return { label: `Let ${subjectName(d.subject)} delegate to ${agent}`, to: accessPath({ ...base, section: 'people', connection_id: d.subject.identity_connection_id ?? undefined }, signalId, returnTo) };
    case 'no_grant':
      return { label: `Add ${server} · ${d.tool} to ${agent}`, to: accessPath({ ...base, section: 'grants', server_id: d.server_id, tool: d.tool }, signalId, returnTo) };
    case 'no_resource':
      return { label: `Allow ${d.resource?.id ?? 'this resource'} for ${d.tool}`, to: accessPath({ ...base, section: 'grants', server_id: d.server_id, tool: d.tool }, signalId, returnTo) };
    case 'condition':
      return { label: 'Open the rule', to: accessPath({ ...base, section: 'policies', server_id: d.server_id, tool: d.tool, policy_id: d.policy_id ?? undefined }, signalId, returnTo) };
    case 'tool_not_reviewed': {
      const review = detail.actions.find((a) => a.route === 'tool-catalog');
      const to = review ? actionPath(review, signalId, returnTo) : undefined;
      return to ? { label: 'Review the tool', to } : { label: 'Review the tool', unavailable: review?.unavailable_reason || 'The server of this tool is no longer available.' };
    }
  }
  return undefined;
}

function InspectorBody({ scope, detail, state, onBack }: { scope: EnvironmentScope; detail: DecisionDetail; state: State; onBack: () => void }) {
  const [history, setHistory] = useState(false);
  const d = detail.decision;
  const signalId = state.params.get('signal_id') || detail.problem?.signal?.id || undefined;
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
  const action = reasonAction(d, detail, signalId, `/investigate?${state.params}`);
  return (
    <>
      <button className="cp-admin-button cp-admin-button--secondary trace-back" onClick={onBack}>
        <ArrowLeft size={15} aria-hidden="true" />
        Back to the list
      </button>
      <article className="cp-admin-panel trace-inspector">
        <header className="trace-inspector-header">
          <span className="attention-kicker">Decision inspector</span>
          <code>{d.id} · {utcTime(d.decided_at)}</code>
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
            <div><strong>Not blocked</strong>Chokepoint evaluated this call and its policy denies it, but {agent} was in Report-only, so the call reached {server}. In Enforce, the same call is denied and the caller gets a reference code.</div>
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
                  <details className="rule-cel"><summary>CEL</summary><code>{p.expression}</code></details>
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
        <DecisionBreakdown key={JSON.stringify(detail.problem && problemKey(detail.problem))} scope={scope} detail={detail} select={state.open} />
        <dl className="trace-facts">
          {[
            ['Agent', d.agent.name ? `${agentText(d.agent)} (${d.agent.id})` : d.agent.id],
            ['On behalf of', d.subject.name ? `${d.subject.name} (${d.subject.subject})` : d.subject.subject],
            ['Identity provider', d.subject.issuer],
            ['Server', server],
            ['Tool', d.tool],
            ['Resource', d.resource ? `${d.resource.type} › ${d.resource.id}` : 'No resource check'],
            ...(d.reference ? [['Reference', d.reference]] : []),
            // Backend 057: the mode of the agent at decision time; a would deny has no code.
            ...(d.enforcement ? [['Mode', d.enforcement === 'report_only' ? <ReportOnlyChip key="mode" /> : 'Enforce']] : []),
            ...(wouldDeny ? [['Reference', 'None: the caller was not refused']] : []),
            ['Decided at (UTC)', utcTime(d.decided_at)],
            ['Permission revision', d.effective_revision == null ? 'Not recorded' : (
              <span className="trace-revision">
                {d.agent.status ? <button type="button" className="trace-revision-link" onClick={() => setHistory(true)}>Revision {d.effective_revision}</button> : `Revision ${d.effective_revision}`}
                {d.published_revision != null && d.published_revision !== d.effective_revision ? <small>Revision {d.published_revision} was applying</small> : null}
              </span>
            )],
          ].map(([name, value]) => (
            <div key={name as string}><dt>{name}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      </article>
      {history && d.effective_revision != null ? <CatalogProvider scope={scope} issuers={noIssuers}><RevisionHistory scope={scope} agentId={d.agent.id} agentName={agentText(d.agent)} initial={d.effective_revision} onClose={() => setHistory(false)} /></CatalogProvider> : null}
    </>
  );
}

export function DecisionInspector({ scope, state }: { scope: EnvironmentScope; state: State }) {
  const navigate = useNavigate();
  function goBack() {
    const back = state.params.get('return_to');
    if (back && (back === '/' || back.startsWith('/investigate?'))) navigate(back);
    else {
      const next = new URLSearchParams(state.params);
      ['decision_id', 'exchange_id', 'window_start', 'signal_id', 'return_to'].forEach((k) => next.delete(k));
      state.setParams(next);
    }
  }
  if (state.exchangeId) return <ExchangeInspector scope={scope} id={state.exchangeId} state={state} onBack={goBack} />;
  const error = state.params.has('decision_id') ? state.detail.error : state.problem.error || state.detail.error;
  if (state.unavailableTarget)
    return (
      <section className="cp-admin-panel trace-empty">
        <h2>This recorded problem is no longer available</h2>
        <p>
          The originating Inbox item is retained, but it no longer identifies a retained reason-qualified problem. You can still keep it reviewed or mark it resolved when you leave.
        </p>
        <button className="cp-admin-button cp-admin-button--secondary" onClick={goBack}>Back to the list</button>
      </section>
    );
  const expired = error instanceof HttpError && error.status === 404;
  if (error)
    return (
      <section className="cp-admin-panel trace-empty">
        <h2>{expired ? 'This recorded history is no longer available' : 'The decision could not be loaded'}</h2>
        <p>
          {expired
            ? 'The trace may have expired or the item is unavailable in this environment. The originating Inbox item can still be reviewed or resolved when you leave.'
            : 'Check your connection and try again.'}
        </p>
        <button className="cp-admin-button cp-admin-button--secondary" onClick={() => { if (state.decisionId) void state.detail.refetch(); else void state.problem.refetch(); }}>Retry</button>
        <button className="cp-admin-button cp-admin-button--ghost" onClick={goBack}>Back to the list</button>
      </section>
    );
  return state.detail.data ? (
    <InspectorBody scope={scope} detail={state.detail.data} state={state} onBack={goBack} />
  ) : (
    <div className="trace-loading" role="status">Loading the recorded decision…</div>
  );
}
