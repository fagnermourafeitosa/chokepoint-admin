import './inspector.css';
import { DecisionBreakdown } from './DecisionBreakdown';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { HttpError } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
import { actionPath } from '../access/target-context';
import { problemKey } from './types';
import type { DecisionDetail } from './types';
import type { useInvestigation } from './useInvestigation';
import { utcTime } from './TraceUI';
const labels: Record<string, string> = {
  identity: 'Identity',
  relation: 'Relation',
  capability: 'Capability',
  tool_review: 'Tool review',
  context: 'Context',
};
const states = {
  passed: 'Passed',
  failed: 'Failed',
  not_evaluated: 'Not evaluated',
  not_applicable: 'Not applicable',
};
function InspectorBody({
  scope,
  detail,
  state,
  onBack,
}: {
  scope: EnvironmentScope;
  detail: DecisionDetail;
  state: ReturnType<typeof useInvestigation>;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const d = detail.decision;
  const signalId = state.params.get('signal_id') || detail.problem?.signal?.id;
  const steps = [...(d.evidence?.steps || [])].sort((a, b) => a.order - b.order);
  return (
    <>
      <button className="cp-admin-button cp-admin-button--secondary trace-back" onClick={onBack}>
        <ArrowLeft size={15} aria-hidden="true" />
        Back to the list
      </button>
      <article className="cp-admin-panel trace-inspector">
        <header className="trace-inspector-header">
          <span className="attention-kicker">Decision inspector</span>
          <code>
            {d.id} · {utcTime(d.decided_at)}
          </code>
        </header>
        <div className="trace-title">
          <span
            className={`trace-outcome trace-outcome-large ${d.permit ? 'trace-allow' : 'trace-deny'}`}
          >
            {d.permit ? <Check size={19} /> : <X size={19} />}
            {d.permit ? 'Allowed' : 'Denied'}
          </span>
          <h2>{d.tool}</h2>
          <p>
            {d.reason?.description ||
              (d.permit
                ? 'The recorded call was allowed.'
                : 'The deny reason was not recorded for this historical call.')}
          </p>
        </div>
        {steps.length ? (
          <ol className="trace-path" aria-label="Recorded authorization path">
            {steps.map((step, i) => (
              <li
                key={`${step.key}-${i}`}
                data-state={step.state}
                tabIndex={0}
                title={`${states[step.state]}${step.detail ? ': ' + step.detail : ''}`}
              >
                <span className="trace-path-dot" />
                <strong>{labels[step.key] || step.key.replaceAll('_', ' ')}</strong>
                <small>{states[step.state]}</small>
                {step.detail ? <span className="trace-path-detail">{step.detail}</span> : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="trace-missing">
            The authorization path was not recorded for this historical decision.
          </p>
        )}
        <div className="trace-detail-columns">
          <section className="trace-rule">
            <h3>{d.permit ? 'Rules that allowed' : 'Rule that denied'}</h3>
            <p>
              {d.reason?.description ||
                (d.permit
                  ? 'The recorded grants allowed this tool.'
                  : 'The deny rule was not recorded for this historical call.')}
            </p>
            {d.evidence?.policies.length ? (
              d.evidence.policies.map((p, i) => (
                <div key={`${p.group_id}-${p.policy_id}-${i}`} className="trace-policy">
                  <strong>{p.name}</strong>
                  <span className={p.permit ? 'trace-policy-pass' : 'trace-policy-fail'}>
                    {p.permit ? 'Condition met' : 'Condition not met'}
                  </span>
                  <pre>{p.expression}</pre>
                  <small>
                    group_id: {p.group_id} · policy_id: {p.policy_id} · revision {p.revision}
                  </small>
                </div>
              ))
            ) : d.condition ? (
              <pre>{d.condition}</pre>
            ) : (
              <p className="cp-admin-muted">
                {d.reason?.label === 'condition'
                  ? 'The condition expression was not recorded.'
                  : d.reason
                    ? 'No condition was evaluated for this outcome.'
                    : 'No applicable condition was recorded.'}
              </p>
            )}
            {d.permit &&
              d.evidence?.grants.map((g, i) => (
                <small className="trace-grant" key={`${g.group_id}-${i}`}>
                  Granted by group {g.group_id} · revision {g.revision}
                </small>
              ))}
            <div className="trace-actions">
              {detail.actions.map((action, i) => {
                const path = actionPath(action, signalId, `/investigate?${state.params}`);
                return path ? (
                  <button key={i} className="cp-admin-button" onClick={() => navigate(path)}>
                    {action.label}
                    <ArrowRight size={15} />
                  </button>
                ) : (
                  <p className="cp-admin-muted" key={i}>
                    {action.unavailable_reason || `${action.label} is unavailable.`}
                  </p>
                );
              })}
            </div>
          </section>
          <section className="trace-repetition">
            <h3>Repeated in this window</h3>
            <p>Same server, tool, agent{d.reason ? ', reason' : ''} and result.</p>
            <strong>
              {detail.repeat.count} {d.permit ? 'allowed' : 'denied'}
            </strong>
            <small>
              Window {utcTime(detail.repeat.window_start)} – {utcTime(detail.repeat.window_end)}
            </small>
            <small>First {utcTime(detail.repeat.first_at)}</small>
            <small>Last {utcTime(detail.repeat.last_at)}</small>
          </section>
        </div>
        <DecisionBreakdown
          key={JSON.stringify(detail.problem && problemKey(detail.problem))}
          scope={scope}
          detail={detail}
          select={state.open}
        />
        <dl className="trace-facts">
          {[
            ['Principal', d.principal_name || d.subject],
            ['Agent', d.agent_name ? `${d.agent_name} (${d.agent})` : d.agent],
            ['Tool', d.tool],
            ['Server', d.server_name || d.server_id],
            ['Issuer', d.issuer],
            ['Subject', d.subject],
            ['Decided at (UTC)', utcTime(d.decided_at)],
            ['Condition', d.condition || 'No recorded condition'],
          ].map(([name, value]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </article>
    </>
  );
}
export function DecisionInspector({
  scope,
  state,
}: {
  scope: EnvironmentScope;
  state: ReturnType<typeof useInvestigation>;
}) {
  const navigate = useNavigate();
  function goBack() {
    const back = state.params.get('return_to');
    if (back && (back === '/' || back.startsWith('/investigate?'))) navigate(back);
    else {
      const next = new URLSearchParams(state.params);
      ['decision_id', 'window_start', 'signal_id', 'return_to'].forEach((k) => next.delete(k));
      state.setParams(next);
    }
  }
  const error = state.params.has('decision_id')
    ? state.detail.error
    : state.problem.error || state.detail.error;
  if (state.unavailableTarget)
    return (
      <section className="cp-admin-panel trace-empty">
        <h2>This recorded problem is no longer available</h2>
        <p>
          The originating Inbox item is retained, but it no longer identifies a retained
          reason-qualified problem. You can still keep it reviewed or mark it resolved when you
          leave.
        </p>
        <button className="cp-admin-button cp-admin-button--secondary" onClick={goBack}>
          Back to the list
        </button>
      </section>
    );
  const expired = error instanceof HttpError && error.status === 404;
  if (error)
    return (
      <section className="cp-admin-panel trace-empty">
        <h2>
          {expired
            ? 'This recorded history is no longer available'
            : 'The decision could not be loaded'}
        </h2>
        <p>
          {expired
            ? 'The trace may have expired or the item is unavailable in this environment. The originating Inbox item can still be reviewed or resolved when you leave.'
            : 'Check your connection and try again.'}
        </p>
        <button
          className="cp-admin-button cp-admin-button--secondary"
          onClick={() => {
            if (state.decisionId) void state.detail.refetch();
            else void state.problem.refetch();
          }}
        >
          Retry
        </button>
        <button className="cp-admin-button cp-admin-button--ghost" onClick={goBack}>
          Back to the list
        </button>
      </section>
    );
  return state.detail.data ? (
    <InspectorBody scope={scope} detail={state.detail.data} state={state} onBack={goBack} />
  ) : (
    <div className="trace-loading" role="status">
      Loading the recorded decision…
    </div>
  );
}
