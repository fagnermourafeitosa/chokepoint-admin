import { ArrowRight, Eye } from 'lucide-react';
import { ReportOnlyChip } from '../../components/report-only/ReportOnlyChip';
import type { Decision, Exchange, ExchangeProblem, Problem, SubjectRef } from './types';
import type { useInvestigation } from './useInvestigation';
import { QueryError, TracePager, utcTime } from './TraceUI';
import { denyText, exchangeShort, exchangeText, kindText, subjectName, agentText } from './labels';
type State = ReturnType<typeof useInvestigation>;

// The subject with its Person or Service chip and its identity provider (Admin 030 section 2).
export function SubjectCell({ subject, onFilter }: { subject?: SubjectRef | null; onFilter?: () => void }) {
  if (!subject) return <span className="cp-admin-muted">Not verified</span>;
  const kind = kindText(subject);
  const name = onFilter ? <button className="trace-filter-link" onClick={onFilter}>{subjectName(subject)}</button> : <span>{subjectName(subject)}</span>;
  return <>
    <strong className="trace-subject">{name}{kind ? <span className="people-kind-chip" data-kind={subject.kind}>{kind}</span> : null}</strong>
    <small>{subject.issuer}</small>
  </>;
}

// A click anywhere on a row opens its detail; buttons inside keep their own click.
function openRow(open: () => void) {
  return (event: React.MouseEvent) => {
    if ((event.target as Element).closest('button, a')) return;
    open();
  };
}

function Row({ decision, problem, state }: { decision?: Decision; problem?: Problem; state: State }) {
  const item = problem || decision!;
  // A problem groups denies; a decision has its own outcome (Backend 057).
  const outcome = decision?.outcome ?? 'deny';
  const permit = outcome === 'permit';
  const id = problem?.latest_decision_id || decision!.id;
  const at = problem?.last_at || decision!.decided_at;
  const open = () => state.open(id, problem?.signal?.id);
  const resource = problem ? problem.resource : decision!.resource;
  return (
    <div className="trace-list-row trace-list-row--open trace-row-decision" role="row" title="Open the decision details" onClick={openRow(open)}>
      <div role="cell">
        {outcome === 'would_deny'
          ? <span className="trace-outcome cp-would-deny"><Eye size={12} aria-hidden="true" />WOULD DENY</span>
          : <span className={`trace-outcome ${permit ? 'trace-allow' : 'trace-deny'}`}>{permit ? 'ALLOW' : 'DENY'}</span>}
        {item.reason ? (
          <small className="trace-reason" title={item.reason.description}>{denyText[item.reason.label] ?? item.reason.description}</small>
        ) : !permit ? (
          <small className="trace-reason">Deny reason not recorded</small>
        ) : null}
        {outcome === 'would_deny' ? <small className="trace-reason">The call ran</small> : null}
      </div>
      <div role="cell">
        <button className="trace-filter-link" onClick={() => state.update({ agent: item.agent.id })}>{agentText(item.agent)}</button>
        <small>{item.agent.status === 'deleted' ? 'Deleted agent' : item.agent.name ? 'Verified agent' : 'Agent not found'}</small>
        {decision?.enforcement === 'report_only' ? <ReportOnlyChip /> : null}
      </div>
      <div role="cell">
        <SubjectCell subject={item.subject} onFilter={() => state.update({ issuer: item.subject.issuer, subject: item.subject.subject })} />
        {problem && problem.principal_count > 1 ? <small>+{problem.principal_count - 1} more</small> : null}
      </div>
      <div role="cell">
        <small>{item.server_name || item.server_id}</small>
        <button className="trace-filter-link trace-mono" onClick={() => state.update({ server_id: item.server_id, tool: item.tool })}>{item.tool}</button>
        <small className="trace-repeat">{problem ? `×${problem.count} in window · last ` : ''}{utcTime(at)}</small>
      </div>
      <div role="cell">
        {resource ? (
          <><small>{resource.type}</small><strong className="trace-mono">{resource.id}</strong></>
        ) : (
          <small>No resource check</small>
        )}
      </div>
      <div role="cell">
        <button className="trace-row-open" aria-label={`Open the decision details of ${item.tool} at ${utcTime(at)}`} title="Open the decision details" onClick={open}>
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function ExchangeRow({ exchange, problem, state }: { exchange?: Exchange; problem?: ExchangeProblem; state: State }) {
  const item = problem || exchange!;
  const id = problem?.latest_exchange_id || exchange!.id;
  const at = problem?.last_at || exchange!.occurred_at;
  const permit = exchange?.permit || false;
  const open = () => state.openExchange(id);
  return (
    <div className="trace-list-row trace-list-row--open trace-row-exchange" role="row" title="Open the token exchange details" onClick={openRow(open)}>
      <div role="cell">
        <span className={`trace-outcome ${permit ? 'trace-allow' : 'trace-deny'}`}>{permit ? 'ISSUED' : 'REFUSED'}</span>
        <small className="trace-reason" title={item.reason ? exchangeText[item.reason.label] : undefined}>
          {item.reason ? exchangeShort[item.reason.label] ?? item.reason.description : 'Token for 5 minutes'}
        </small>
      </div>
      <div role="cell">
        {item.agent ? (
          <button className="trace-filter-link" onClick={() => state.update({ agent_id: item.agent!.id })}>{agentText(item.agent)}</button>
        ) : (
          <span className="cp-admin-muted">No agent of this environment</span>
        )}
      </div>
      <div role="cell">
        {problem && !problem.subject && problem.reason.label !== 'subject_token_expired' && problem.reason.label !== 'subject_token_invalid' ? (
          <span className="cp-admin-muted">Grouped by agent and reason</span>
        ) : (
          <SubjectCell subject={item.subject} />
        )}
      </div>
      <div role="cell"><small className={problem ? 'trace-repeat' : undefined}>{problem ? `×${problem.count} in window · last ` : ''}{utcTime(at)}</small></div>
      <div role="cell">
        <button className="trace-row-open" aria-label={`Open the token exchange details at ${utcTime(at)}`} title="Open the token exchange details" onClick={open}>
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function DecisionLists({ state }: { state: State }) {
  const exchanges = state.view === 'exchanges';
  const query = exchanges ? (state.groupedExchanges ? state.exchangeProblems : state.exchanges) : state.view === 'problems' ? state.problems : state.decisions;
  const filters = exchanges ? state.exchangeFilters : state.filters;
  const page = Math.max(1, Number(filters.page) || 1);
  const filtered = Object.entries(filters).some(([key, value]) => key !== 'page' && key !== 'page_size' && value && value !== 'all');
  const noun = exchanges ? (state.groupedExchanges ? 'problems' : 'exchanges') : state.view === 'problems' ? 'problems' : 'decisions';
  return (
    <>
      <div className="trace-list-title">
        <span className="attention-kicker">{exchanges ? 'Token exchanges' : state.view === 'problems' ? 'Problems' : 'Recent decisions'}</span>
        <span>{query.data?.total ?? '…'} {noun}</span>
      </div>
      {query.data?.search_truncated ? (
        <p role="status" className="cp-admin-muted trace-search-truncated">
          Many people match this search, so some may be missing. Refine the search to see them all.
        </p>
      ) : null}
      {query.isError ? (
        <QueryError text="The recorded history could not be loaded." retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <div role="status" className="trace-loading">Loading recorded history…</div>
      ) : query.data?.items.length ? (
        exchanges ? (
          <div className="trace-table" role="table" aria-label="Token exchanges">
            <div className="trace-list-row trace-list-head trace-row-exchange" role="row">
              {['Result', 'Agent', 'Subject', 'When', ''].map((name, i) => (
                <span role="columnheader" key={i}>{name || <span className="attention-sr-only">Open detail</span>}</span>
              ))}
            </div>
            {state.groupedExchanges
              ? state.exchangeProblems.data?.items.map((p) => <ExchangeRow key={p.latest_exchange_id} problem={p} state={state} />)
              : state.exchanges.data?.items.map((x) => <ExchangeRow key={x.id} exchange={x} state={state} />)}
          </div>
        ) : (
          <div className="trace-table" role="table" aria-label={state.view === 'problems' ? 'Denied problems' : 'Recorded decisions'}>
            <div className="trace-list-row trace-list-head trace-row-decision" role="row">
              {['Result', 'Agent', 'On behalf of', 'MCP server / tool', 'Resource', ''].map((name, i) => (
                <span role="columnheader" key={i}>{name || <span className="attention-sr-only">Open detail</span>}</span>
              ))}
            </div>
            {state.view === 'problems'
              ? state.problems.data?.items.map((p) => (
                  <Row key={JSON.stringify([p.server_id, p.tool, p.agent.id, p.reason.label, p.window_start])} problem={p} state={state} />
                ))
              : state.decisions.data?.items.map((d) => <Row key={d.id} decision={d} state={state} />)}
          </div>
        )
      ) : (
        <div className="trace-empty">
          <strong>
            {filtered
              ? 'No records match these filters.'
              : exchanges
                ? 'No token exchanges in the retained history.'
                : state.view === 'problems'
                  ? 'No denied calls in the retained history.'
                  : 'No recorded calls in the retained history.'}
          </strong>
          <p>Choose another period or check again after new calls are recorded.</p>
        </div>
      )}
      <TracePager page={page} size={query.data?.page_size || 6} total={query.data?.total || 0} busy={query.isFetching} onPage={(p) => state.update({ page: String(p) })} />
    </>
  );
}
