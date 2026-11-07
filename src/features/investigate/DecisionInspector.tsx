import './inspector.css';
import { DecisionBreakdown } from './DecisionBreakdown';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Check, CircleHelp, Eye, X } from 'lucide-react';
import { Tooltip } from '../../components/ui/tooltip/Tooltip';
import { QuickIncident } from '../../components/quick-incident/QuickIncident';
import { useRuleSentence } from './useRuleSentence';
import { ReportOnlyChip } from '../../components/report-only/ReportOnlyChip';
import { HttpError } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
import { actionPath } from '../access/target-context';
import { problemKey } from './types';
import type { Decision, DecisionDetail, StepState } from './types';
import type { useInvestigation } from './useInvestigation';
import { utcTime } from './TraceUI';
import { agentText, denyText, stateText, stepLabel, subjectName } from './labels';
import { ExchangeInspector } from './ExchangeInspector';
import { InboxItemStatus } from '../attention/InboxItemStatus';

type State = ReturnType<typeof useInvestigation>;

import { RevisionHistory } from '../access/delegation/RevisionHistory';
import { CatalogProvider } from '../access/delegation/catalog';

// The history panel names servers and identity providers; it loads no directory.
const noIssuers: string[] = [];



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
    case 'tool_not_reviewed': {
      const review = detail.actions.find((a) => a.route === 'tool-catalog');
      const to = review ? actionPath(review, returnTo) : undefined;
      return to ? { label: 'Review the tool', to } : { label: 'Review the tool', unavailable: review?.unavailable_reason || 'The server of this tool is no longer available.' };
    }
  }
  return undefined;
}

// Admin 049 item 7: the path reads the recorded steps as Delegation, Agent, MCP server, Tool and Rules.
// The PDP checks agent → tool once: the Agent dot passes (a failed identity check shows as its own
// step), the MCP server dot passes when the tool step was evaluated, and the Tool dot carries the
// capability state. The Rules dot names the failed rule.
type PathNode = { key: string; label: string; state: StepState; value?: string };
function pathNodes(steps: { key: string; state: StepState }[], d: Decision, failedRules: string[]): PathNode[] {
  const agent = d.agent.name || d.agent.id;
  return steps.flatMap((step): PathNode[] => {
    if (step.key === 'delegation') return [
      { key: 'delegation', label: 'Delegation', state: step.state, value: `${subjectName(d.subject)} → ${agent}` },
      { key: 'agent', label: 'Agent', state: 'passed', value: agent },
    ];
    if (step.key === 'capability') return [
      { key: 'server', label: 'MCP server', state: step.state === 'not_evaluated' ? 'not_evaluated' : 'passed', value: d.server_name || d.server_id },
      { key: 'tool', label: 'Tool', state: step.state, value: d.tool },
    ];
    if (step.key === 'condition') return [{ key: 'condition', label: 'Rules', state: step.state, value: failedRules.join(', ') || undefined }];
    if (step.key === 'resource') return [];
    return [{ key: step.key, label: stepLabel[step.key] || step.key.replaceAll('_', ' '), state: step.state }];
  });
}

function Help({ text, label }: { text: string; label: string }) {
  return <Tooltip content={text}><CircleHelp size={14} aria-label={label} /></Tooltip>;
}

function InspectorBody({ scope, detail, state, onBack }: { scope: EnvironmentScope; detail: DecisionDetail; state: State; onBack: () => void }) {
  const [history, setHistory] = useState(false);
  const d = detail.decision;
  // The checks before the PDP (identity, tool review) show only when they did not pass.
  const steps = [...(d.evidence?.steps || [])]
    .filter((s) => !preDecisionStep.has(s.key) || s.state !== 'passed')
    .sort((a, b) => a.order - b.order);
  const rules = (d.evidence?.policies || []).filter((p) => p.server_id === d.server_id && (!p.tool || p.tool === d.tool));
  const agent = d.agent.name || d.agent.id;
  const server = d.server_name || d.server_id;
  const sentence = useRuleSentence(d.condition, d.server_id, d.tool);
  // Backend 057: three outcomes; a would deny ran in Report-only.
  const permit = d.outcome === 'permit';
  const wouldDeny = d.outcome === 'would_deny';
  const action = reasonAction(d, detail, `/investigate?${state.params}`);
  const cause = d.reason?.label === 'condition' && d.condition
    ? <span className="relation-label">Rule not met: <strong>{sentence ?? <code className="trace-mono">{d.condition}</code>}</strong><Help label="About the recorded rule" text="The values of the call and of the attribute sources are never recorded. The rule shows what was checked, not the value that failed." /></span>
    : d.reason ? denyText[d.reason.label] ?? d.reason.description : permit ? 'Every check passed.' : 'The deny reason was not recorded for this historical call.';
  const facts: [string, ReactNode, string?][][] = [
    [
      ['Identity provider', d.subject.issuer],
      ['On behalf of', d.subject.name ? `${d.subject.name} (${d.subject.subject})` : d.subject.subject],
      ['Agent', d.agent.name ? `${agentText(d.agent)} (${d.agent.id})` : d.agent.id],
      ['MCP server', server],
      ['Tool', d.tool],
    ],
    [
      // Backend 057: the mode of the agent at decision time.
      ...(d.enforcement ? [['Mode', d.enforcement === 'report_only' ? <ReportOnlyChip key="mode" /> : 'Enforce', 'The mode of the agent when the call was decided. Enforce blocks a denied call. Report-only lets the call run and records it as would deny.'] as [string, ReactNode, string]] : []),
      ['Reference', wouldDeny ? 'None: the caller was not refused' : d.reference ? <span className="mcp-badge trace-reference">{d.reference}</span> : '—', 'The code that the caller receives with a denied call. Paste it in Quick incident to open this decision.'],
      ['Permission revision', d.effective_revision == null ? 'Not recorded' : (
        <span className="trace-revision">
          {d.agent.status ? <button type="button" className="trace-revision-link" onClick={() => setHistory(true)}>Revision {d.effective_revision}</button> : `Revision ${d.effective_revision}`}
          {d.published_revision != null && d.published_revision !== d.effective_revision ? <small>Revision {d.published_revision} was applying</small> : null}
        </span>
      )],
      ['Decided at (UTC)', utcTime(d.decided_at)],
    ],
  ];
  return (
    <>
      <div className="quick-incident-row trace-detail-bar">
        <button className="cp-admin-button cp-admin-button--secondary trace-back" onClick={onBack}>
          <ArrowLeft size={15} aria-hidden="true" />
          Back to the list
        </button>
        <QuickIncident />
      </div>
      <article className="cp-admin-panel trace-inspector">
        <header className="trace-inspector-header">
          <span className="trace-inspector-meta">
            {detail.problem?.signal ? <InboxItemStatus key={detail.problem.signal.id} scope={scope} id={detail.problem.signal.id} status={detail.problem.signal.status} reviewOnOpen label="Inbox item" /> : null}
            <code>{utcTime(d.decided_at)}</code>
          </span>
        </header>
        {steps.length ? (
          <ol className="trace-path trace-path-relations" aria-label="Recorded authorization path">
            {pathNodes(steps, d, rules.filter((r) => !r.permit).map((r) => r.name)).map((node, i) => (
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
          <p>{cause}{wouldDeny ? ` The call ran because ${agent} was in Report-only.` : ''}</p>
          {action ? (
            action.to ? <Link className="cp-admin-button trace-title-action" to={action.to}>{action.label}<ArrowRight size={15} /></Link> : <p className="cp-admin-muted">{action.unavailable}</p>
          ) : null}
        </div>
        {wouldDeny ? (
          <div className="cp-admin-notice cp-report-only-notice trace-report-only-notice">
            <Eye size={18} aria-hidden="true" />
            <div><strong>Not blocked</strong>The policy of this call denies it, but {agent} was in Report-only, so the call reached {server}. In Enforce, the same call is denied and the caller gets a reference code.</div>
          </div>
        ) : null}
        <div className="trace-facts-columns">
          {facts.map((column, c) => (
            <dl key={c} className="trace-facts trace-facts-list">
              {column.map(([name, value, help]) => (
                <div key={name}>
                  <dt>{help ? <span className="relation-label">{name}<Help label={`About ${name.toLowerCase()}`} text={help} /></span> : name}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ))}
        </div>
        <DecisionBreakdown key={JSON.stringify(detail.problem && problemKey(detail.problem))} scope={scope} detail={detail} select={state.open} />
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
      ['decision_id', 'exchange_id', 'window_start', 'return_to'].forEach((k) => next.delete(k));
      state.setParams(next);
    }
  }
  if (state.exchangeId) return <ExchangeInspector scope={scope} id={state.exchangeId} state={state} onBack={goBack} />;
  const error = state.params.has('decision_id') ? state.detail.error : state.problem.error || state.detail.error;
  const expired = error instanceof HttpError && error.status === 404;
  if (error)
    return (
      <section className="cp-admin-panel trace-empty">
        <h2>{expired ? 'This recorded history is no longer available' : 'The decision could not be loaded'}</h2>
        <p>
          {expired
            ? 'The trace may have expired or the item is unavailable in this environment. Its Inbox item can still be resolved in the Inbox.'
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
