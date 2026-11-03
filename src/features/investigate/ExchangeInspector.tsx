import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { HttpError } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
import { exchangeApi, traceKey } from './api';
import type { Exchange, ExchangeReasonLabel } from './types';
import type { useInvestigation } from './useInvestigation';
import { QueryError, TracePager, utcTime } from './TraceUI';
import { exchangeText, kindText, subjectName } from './labels';
import { accessPath } from './DecisionInspector';

type State = ReturnType<typeof useInvestigation>;

// What to check for each reason, and the place that fixes it (Admin 030 section 4).
const hints: Record<ExchangeReasonLabel, { hint: string; label: string }> = {
  invalid_client: { hint: 'If the key file is old or exposed, replace the key and give the new file to the agent.', label: 'Open the agent' },
  subject_token_expired: { hint: 'Check if the provider disabled this user. If not, the agent must renew the token of the user.', label: 'Open the identity provider' },
  subject_token_invalid: { hint: 'Check the issuer and the accepted audiences of the connection, and the token that the agent sends.', label: 'Open the identity provider' },
  subject_connection_disabled: { hint: 'An administrator disabled this connection. Enable it if its users must use agents again.', label: 'Open the identity provider' },
  no_delegation: { hint: 'Select this subject in the identity provider of the agent if it must use the agent.', label: 'Open who can delegate' },
  invalid_authorization_details: { hint: 'The instance asked for a tool or limits that the agent does not have. Check the servers and tools of the agent.', label: 'Open the servers and tools' },
};

function fixPath(x: Exchange, returnTo: string): string | undefined {
  const reason = x.reason?.label;
  if (!reason) return undefined;
  if (reason === 'subject_token_expired' || reason === 'subject_token_invalid' || reason === 'subject_connection_disabled') return '/access/integrations?type=identity';
  if (!x.agent) return undefined;
  if (reason === 'no_delegation') return accessPath({ agent_id: x.agent.id, section: 'people', connection_id: x.subject?.identity_connection_id ?? undefined }, undefined, returnTo);
  if (reason === 'invalid_authorization_details') return accessPath({ agent_id: x.agent.id, section: 'grants' }, undefined, returnTo);
  return accessPath({ agent_id: x.agent.id }, undefined, returnTo);
}

// unverified explains a missing subject: the backend records it only after a
// valid signature of the subject token (Backend 034 Solution 6).
function unverified(reason?: ExchangeReasonLabel) {
  if (reason === 'invalid_client') return 'Not checked: the agent key failed first';
  if (reason === 'subject_connection_disabled') return 'Not verified: the identity provider is disabled';
  return 'Not verified: the token signature was not valid';
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
  const agent = x.agent ? x.agent.name || x.agent.id : 'No agent of this environment';
  const reason = x.reason?.label;
  const fix = reason ? hints[reason] : undefined;
  const to = fixPath(x, `/investigate?${state.params}`);
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
          <p>{reason ? exchangeText[reason] ?? x.reason!.description : 'Chokepoint issued a token for 5 minutes.'}</p>
        </div>
        {x.subject ? (
          <p className="trace-who"><strong>{agent}</strong> asked for a token for <strong>{subjectName(x.subject)}</strong> ({[kind, x.subject.issuer].filter(Boolean).join(' · ')})</p>
        ) : null}
        <div className="trace-detail-columns">
          <section className="trace-rule">
            <h3>{x.permit ? 'What happened' : 'What to check'}</h3>
            {fix ? (
              <>
                <p>{fix.hint}</p>
                {to ? <div className="trace-actions"><Link className="cp-admin-button" to={to}>{fix.label}<ArrowRight size={15} /></Link></div> : <p className="cp-admin-muted">The assertion named no agent of this environment.</p>}
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
            ['Agent', x.agent ? (x.agent.name ? `${x.agent.name} (${x.agent.id})` : x.agent.id) : 'No agent of this environment'],
            ['Subject', x.subject ? (x.subject.name ? `${x.subject.name} (${x.subject.subject})` : x.subject.subject) : unverified(reason)],
            ['Identity provider', x.subject?.issuer ?? '—'],
            ['Reason', reason ?? '—'],
            ['Returned to the agent', x.permit ? 'A Chokepoint token for 5 minutes' : reason === 'invalid_client' || reason === 'invalid_authorization_details' ? reason : 'invalid_grant'],
            ['At (UTC)', utcTime(x.occurred_at)],
          ].map(([name, value]) => (
            <div key={name}><dt>{name}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      </article>
    </>
  );
}
