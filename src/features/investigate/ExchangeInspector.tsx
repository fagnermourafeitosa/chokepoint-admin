import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { HttpError } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
import { exchangeApi, traceKey } from './api';
import type { Exchange, ExchangeReasonLabel, LoginErrorCause } from './types';
import type { useInvestigation } from './useInvestigation';
import { QueryError, TracePager, utcTime } from './TraceUI';
import { exchangeText, kindText, subjectName, agentText } from './labels';
import { accessPath } from './DecisionInspector';

type State = ReturnType<typeof useInvestigation>;

// What to check for each reason, and the place that fixes it (Admin 030 section 4, Admin 037).
const hints: Record<ExchangeReasonLabel, { hint: string; label: string }> = {
  invalid_client: { hint: 'If the key file is old or exposed, replace the key and give the new file to the agent.', label: 'Open the agent' },
  subject_token_expired: { hint: 'Check if the provider disabled this user. If not, the agent must renew the token of the user.', label: 'Open the identity provider' },
  subject_token_invalid: { hint: 'Check the issuer and the accepted audiences of the connection, and the token that the agent sends.', label: 'Open the identity provider' },
  subject_connection_disabled: { hint: 'An administrator disabled this connection. Enable it if its users must use agents again.', label: 'Open the identity provider' },
  no_delegation: { hint: 'Select this subject in the identity provider of the agent if it must use the agent.', label: 'Open who can delegate' },
  invalid_authorization_details: { hint: 'The instance asked for a tool or limits that the agent does not have. Check the servers and tools of the agent.', label: 'Open the servers and tools' },
  no_group: { hint: 'Check if this person must be in a group chosen in the Harness login of the identity provider.', label: 'Open the harness login' },
  blocked: { hint: 'Check if the block of this person is still needed. Unblock the person in the Harness login of the identity provider.', label: 'Open the harness login' },
  not_allowed_client: { hint: 'Check the allowed harnesses of the agent. Add this harness if the agent must accept it.', label: 'Open the agent identity' },
  code_reuse: { hint: 'Check if the code leaked from the computer of the person. Xokepoint revoked the machine; the person must log in again.', label: 'Open the harness sessions' },
  refresh_reuse: { hint: 'Check if the refresh token was copied from the computer of the person. Xokepoint revoked the machine; the person must log in again.', label: 'Open the harness sessions' },
  dpop_invalid: { hint: 'Check if the token was copied from the harness that holds the key.', label: 'Open the harness sessions' },
  login_error: { hint: 'Check the cause below.', label: 'Open the agent identity' },
};

// What to check for each cause of a login_error (Admin 039). The first
// sentence is also the Cause fact.
const causes: Record<LoginErrorCause, { text: string; hint: string; fix?: 'identity' | 'provider' }> = {
  invalid_request: { text: 'The harness sent a malformed authorization request.', hint: 'Check the harness version.' },
  invalid_client_id: { text: 'The harness did not send a valid client metadata URL.', hint: 'Check the harness version.' },
  client_metadata_invalid: { text: 'The client metadata document of the harness could not be read or is not valid.', hint: 'Check its URL in the allowed harnesses.', fix: 'identity' },
  redirect_uri_invalid: { text: 'The harness asked to return to an address its metadata document does not list.', hint: 'Check the harness version and its document.', fix: 'identity' },
  transaction_expired: { text: 'The sign-in expired, was used twice or was continued in another browser.', hint: 'The person must start again from the harness.' },
  provider_not_available: { text: 'The chosen identity provider does not allow harness login for this harness.', hint: 'Check the Harness login of the identity provider.', fix: 'provider' },
  server_error: { text: 'Xokepoint could not complete the sign-in.', hint: 'Check the backend logs at this time.' },
};

// noAgent explains an action without an agent. A refused harness login names an
// agent only when one agent is a candidate for the harness (Backend 045).
function noAgent(reason?: ExchangeReasonLabel) {
  if (reason === 'no_group' || reason === 'blocked' || reason === 'not_allowed_client') return 'Several agents or no agent use this harness. Check the Harness login of each agent that must accept this person.';
  if (reason === 'code_reuse' || reason === 'refresh_reuse' || reason === 'dpop_invalid') return 'The request named no agent of this environment.';
  return 'The assertion named no agent of this environment.';
}

// providerFix: a refused harness login has no subject when its connection is
// disabled or no longer allows harness login (Backend 045), so the fix is the connection.
function providerFix(x: Exchange) {
  const reason = x.reason?.label;
  if (reason === 'login_error') return !!x.cause && causes[x.cause]?.fix === 'provider';
  return reason === 'subject_token_expired' || reason === 'subject_token_invalid' || reason === 'subject_connection_disabled' ||
    ((reason === 'no_group' || reason === 'blocked') && !x.subject?.identity_connection_id);
}

function fixPath(x: Exchange, returnTo: string): string | undefined {
  const reason = x.reason?.label;
  if (!reason) return undefined;
  if (providerFix(x)) return '/access/integrations?type=identity';
  if (!x.agent) return undefined;
  if (reason === 'no_delegation') return accessPath({ agent_id: x.agent.id, section: 'people', connection_id: x.subject?.identity_connection_id ?? undefined }, undefined, returnTo);
  if (reason === 'invalid_authorization_details') return accessPath({ agent_id: x.agent.id, section: 'grants' }, undefined, returnTo);
  if (reason === 'no_group' || reason === 'blocked') return accessPath({ agent_id: x.agent.id, section: 'people', connection_id: x.subject?.identity_connection_id ?? undefined }, undefined, returnTo);
  if (reason === 'not_allowed_client') return accessPath({ agent_id: x.agent.id, view: 'identity' }, undefined, returnTo);
  // A login_error opens the agent identity only for a harness document problem.
  if (reason === 'login_error') return x.cause && causes[x.cause]?.fix === 'identity' ? accessPath({ agent_id: x.agent.id, view: 'identity' }, undefined, returnTo) : undefined;
  if (reason === 'code_reuse' || reason === 'refresh_reuse' || reason === 'dpop_invalid') return accessPath({ agent_id: x.agent.id, view: 'sessions' }, undefined, returnTo);
  return accessPath({ agent_id: x.agent.id }, undefined, returnTo);
}

// unverified explains a missing subject: the backend records it only after a
// valid signature of the subject token (Backend 034 Solution 6), or from the
// login or the machine of a harness (Backend 045).
function unverified(reason?: ExchangeReasonLabel) {
  if (reason === 'invalid_client') return 'Not checked: the agent key failed first';
  if (reason === 'subject_connection_disabled') return 'Not verified: the identity provider is disabled';
  if (reason === 'no_group' || reason === 'blocked') return 'Not recorded: the identity provider is disabled or does not allow harness login';
  if (reason === 'not_allowed_client') return 'Not checked: the harness was refused before the login';
  if (reason === 'dpop_invalid') return 'Not checked: the DPoP proof failed first';
  if (reason === 'code_reuse' || reason === 'refresh_reuse') return 'Not recorded: the machine was not found';
  if (reason === 'login_error') return 'Not signed in: the sign-in stopped before the identity provider';
  return 'Not verified: the token signature was not valid';
}

// returned names what the client got (Backend 034 Resolved Decision 4, Backend 045).
function returned(x: Exchange) {
  const reason = x.reason?.label;
  if (x.permit) return 'A Xokepoint token for 5 minutes';
  if (reason === 'invalid_client' || reason === 'invalid_authorization_details') return reason;
  if (reason === 'no_group' || reason === 'blocked' || (reason === 'not_allowed_client' && x.reference)) return 'A refused page with the reference code';
  if (reason === 'login_error') return 'A generic page with the reference code';
  if (reason === 'dpop_invalid') return 'invalid_dpop_proof or invalid_grant';
  return 'invalid_grant';
}

export function ExchangeInspector({ scope, id, state, onBack }: { scope: EnvironmentScope; id: string; state: State; onBack: () => void }) {
  const [page, setPage] = useState(1);
  const detail = useQuery({
    queryKey: [...traceKey(scope), 'exchange', id, page],
    queryFn: ({ signal }) => exchangeApi.detail(scope, id, page, signal),
    retry: false,
    placeholderData: (previous) => previous,
  });
  if (detail.error) {
    const expired = detail.error instanceof HttpError && detail.error.status === 404;
    return (
      <section className="cp-admin-panel trace-empty">
        <h2>{expired ? 'This recorded exchange is no longer available' : 'The token exchange could not be loaded'}</h2>
        <p>{expired ? 'The record may have expired or it is unavailable in this environment.' : 'Check your connection and try again.'}</p>
        <button className="cp-admin-button cp-admin-button--secondary" onClick={() => void detail.refetch()}>Retry</button>
        <button className="cp-admin-button cp-admin-button--ghost" onClick={onBack}>Back to the list</button>
      </section>
    );
  }
  if (!detail.data) return <div className="trace-loading" role="status">Loading the recorded token exchange…</div>;
  const { exchange: x, repeat, occurrences, problem } = detail.data;
  const agent = x.agent ? agentText(x.agent) : 'No agent of this environment';
  // The key of a deleted agent is still in use: there is no agent to open (Admin 032 section 7).
  const deleted = x.agent?.status === 'deleted';
  const reason = x.reason?.label;
  const cause = reason === 'login_error' && x.cause ? causes[x.cause] : undefined;
  const fix = cause ? { hint: `${cause.text} ${cause.hint}`, label: 'Open the agent identity' } : reason ? hints[reason] : undefined;
  const to = deleted ? undefined : fixPath(x, `/investigate?${state.params}`);
  const label = fix && providerFix(x) ? 'Open the identity provider' : fix?.label;
  const kind = x.subject ? kindText(x.subject) : undefined;
  return (
    <>
      <button className="cp-admin-button cp-admin-button--secondary trace-back" onClick={onBack}>
        <ArrowLeft size={15} aria-hidden="true" />
        Back to the list
      </button>
      <article className="cp-admin-panel trace-inspector">
        <header className="trace-inspector-header">
          <span className="attention-kicker">Token exchange</span>
          <code>{x.id} · {utcTime(x.occurred_at)}</code>
        </header>
        <div className="trace-title">
          <span className={`trace-outcome trace-outcome-large ${x.permit ? 'trace-allow' : 'trace-deny'}`}>
            {x.permit ? <Check size={19} /> : <X size={19} />}
            {x.permit ? 'Issued' : 'Refused'}
          </span>
          <h2>{agent}</h2>
          <p>{reason ? exchangeText[reason] ?? x.reason!.description : 'Xokepoint issued a token for 5 minutes.'}</p>
        </div>
        {x.subject ? (
          <p className="trace-who"><strong>{agent}</strong> asked for a token for <strong>{subjectName(x.subject)}</strong> ({[kind, x.subject.issuer].filter(Boolean).join(' · ')})</p>
        ) : null}
        <div className="trace-detail-columns">
          <section className="trace-rule">
            <h3>{x.permit ? 'What happened' : 'What to check'}</h3>
            {deleted && !x.permit ? (
              <p>This agent was deleted, but something still uses its key. Find and stop the deployment that uses it.</p>
            ) : fix ? (
              <>
                <p>{fix.hint}</p>
                {to ? <div className="trace-actions"><Link className="cp-admin-button" to={to}>{label}<ArrowRight size={15} /></Link></div> : reason === 'login_error' ? null : <p className="cp-admin-muted">{noAgent(reason)}</p>}
              </>
            ) : (
              <p>The agent proved its key, the token of the subject was valid and the subject delegated to the agent.</p>
            )}
          </section>
          <section className="trace-repetition">
            <h3>Repeated in this window</h3>
            <p>Same agent{problem?.subject ? ', subject' : ''} and {x.permit ? 'result' : 'reason'}.</p>
            <strong>{repeat.count} {x.permit ? 'issued' : 'refused'}</strong>
            <small>Window {utcTime(repeat.window_start)} – {utcTime(repeat.window_end)}</small>
            <small>First {utcTime(repeat.first_at)}</small>
            <small>Last {utcTime(repeat.last_at)}</small>
          </section>
        </div>
        {problem ? (
          <section className="trace-breakdown">
            <h3>Exchanges in this problem · {problem.count}</h3>
            {occurrences.items.length ? (
              <div className="trace-breakdown-list">
                {occurrences.items.map((o) => (
                  <button key={o.id} className={o.id === x.id ? 'is-selected' : ''} onClick={() => state.setParams((previous) => { const next = new URLSearchParams(previous); next.set('exchange_id', o.id); return next; })}>
                    <time dateTime={o.occurred_at}>{utcTime(o.occurred_at)}</time>
                    <span>{o.subject ? subjectName(o.subject) : unverified(o.reason?.label)}</span>
                    <code>{o.reason?.label ?? 'issued'}</code>
                  </button>
                ))}
              </div>
            ) : (
              <QueryError text="The exchanges in this problem could not be loaded." retry={() => void detail.refetch()} />
            )}
            <TracePager page={page} total={occurrences.total} size={occurrences.page_size || 6} busy={detail.isFetching} onPage={setPage} />
          </section>
        ) : null}
        <dl className="trace-facts">
          {[
            ['Agent', x.agent ? (x.agent.name ? `${agentText(x.agent)} (${x.agent.id})` : x.agent.id) : 'No agent of this environment'],
            ['Subject', x.subject ? (x.subject.name ? `${x.subject.name} (${x.subject.subject})` : x.subject.subject) : unverified(reason)],
            ['Identity provider', x.subject?.issuer ?? '—'],
            ['Reason', reason ?? '—'],
            ...(cause ? [['Cause', cause.text]] : []),
            ...(x.client_id ? [['Harness', x.client_id]] : []),
            ...(x.reference ? [['Reference', x.reference]] : []),
            ['Returned to the agent', returned(x)],
            ['At (UTC)', utcTime(x.occurred_at)],
          ].map(([name, value]) => (
            <div key={name}><dt>{name}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      </article>
    </>
  );
}
