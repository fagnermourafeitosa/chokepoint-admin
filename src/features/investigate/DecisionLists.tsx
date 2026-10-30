import { ArrowRight } from 'lucide-react';
import type { Decision, Problem } from './types';
import type { useInvestigation } from './useInvestigation';
import { QueryError, TracePager, utcTime } from './TraceUI';
type State = ReturnType<typeof useInvestigation>;
function Row({
  decision,
  problem,
  state,
}: {
  decision?: Decision;
  problem?: Problem;
  state: State;
}) {
  const item = problem || decision!;
  const permit = decision?.permit || false;
  const principal = problem?.principal || {
    issuer: decision!.issuer,
    subject: decision!.subject,
    name: decision!.principal_name,
  };
  const id = problem?.latest_decision_id || decision!.id;
  return (
    <div className="trace-list-row" role="row">
      <div role="cell">
        <span className={`trace-outcome ${permit ? 'trace-allow' : 'trace-deny'}`}>
          {permit ? 'ALLOW' : 'DENY'}
        </span>
        {item.reason ? (
          <small className="trace-reason" title={item.reason.description}>
            {item.reason.description}
          </small>
        ) : !permit ? (
          <small className="trace-reason">Deny reason not recorded</small>
        ) : null}
      </div>
      <div role="cell">
        <button className="trace-filter-link" onClick={() => state.update({ agent: item.agent })}>
          {item.agent_name || item.agent}
        </button>
        {item.agent_name ? (
          <small>
            <code>{item.agent}</code>
          </small>
        ) : null}
      </div>
      <div role="cell">
        <small>{item.server_name || item.server_id}</small>
        <button
          className="trace-filter-link trace-mono"
          onClick={() => state.update({ server_id: item.server_id, tool: item.tool })}
        >
          {item.tool}
        </button>
        <small className="trace-repeat">
          {problem ? `×${problem.count} in window · last ` : ''}
          {utcTime(problem?.last_at || decision!.decided_at)}
        </small>
      </div>
      <div role="cell">
        <button
          className="trace-filter-link"
          onClick={() => state.update({ issuer: principal.issuer, subject: principal.subject })}
        >
          {principal.name || principal.subject}
        </button>
        {problem && problem.principal_count > 1 ? (
          <small>+{problem.principal_count - 1} more</small>
        ) : null}
      </div>
      <div role="cell" className="trace-condition">
        {item.condition ||
          (item.reason?.label === 'condition'
            ? 'Condition evidence not recorded'
            : 'No recorded condition')}
      </div>
      <div role="cell">
        <button
          className="trace-row-open"
          aria-label={`Inspect ${item.tool} at ${utcTime(problem?.last_at || decision!.decided_at)}`}
          onClick={() => state.open(id, problem?.signal?.id)}
        >
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
export function DecisionLists({ state }: { state: State }) {
  const query = state.view === 'problems' ? state.problems : state.decisions;
  const page = Math.max(1, Number(state.filters.page) || 1);
  const filtered = Object.entries(state.filters).some(
    ([key, value]) => key !== 'page' && key !== 'page_size' && value && value !== 'all',
  );
  return (
    <>
      <div className="trace-list-title">
        <span className="attention-kicker">
          {state.view === 'problems' ? 'Problems' : 'Recent decisions'}
        </span>
        <span>
          {query.data?.total ?? '…'} {state.view === 'problems' ? 'problems' : 'decisions'}
        </span>
      </div>
      {query.data?.search_truncated ? (
        <p role="status" className="cp-admin-muted trace-search-truncated">
          Many people match this search, so some may be missing. Refine the search to see them
          all.
        </p>
      ) : null}
      {query.isError ? (
        <QueryError
          text="The recorded history could not be loaded."
          retry={() => void query.refetch()}
        />
      ) : query.isPending ? (
        <div role="status" className="trace-loading">
          Loading recorded history…
        </div>
      ) : query.data?.items.length ? (
        <div
          className="trace-table"
          role="table"
          aria-label={state.view === 'problems' ? 'Denied problems' : 'Recorded decisions'}
        >
          <div className="trace-list-row trace-list-head" role="row">
            {['Result', 'Agent', 'MCP server / tool', 'Principal', 'Condition', ''].map(
              (name, i) => (
                <span role="columnheader" key={i}>
                  {name || <span className="attention-sr-only">Open detail</span>}
                </span>
              ),
            )}
          </div>
          {state.view === 'problems'
            ? state.problems.data?.items.map((p) => (
                <Row
                  key={JSON.stringify([
                    p.server_id,
                    p.tool,
                    p.agent,
                    p.reason.label,
                    p.window_start,
                  ])}
                  problem={p}
                  state={state}
                />
              ))
            : state.decisions.data?.items.map((d) => <Row key={d.id} decision={d} state={state} />)}
        </div>
      ) : (
        <div className="trace-empty">
          <strong>
            {filtered
              ? 'No records match these filters.'
              : state.view === 'problems'
                ? 'No denied calls in the retained history.'
                : 'No recorded calls in the retained history.'}
          </strong>
          <p>Choose another period or check again after new calls are recorded.</p>
        </div>
      )}
      <TracePager
        page={page}
        size={query.data?.page_size || 6}
        total={query.data?.total || 0}
        busy={query.isFetching}
        onPage={(p) => state.update({ page: String(p) })}
      />
    </>
  );
}
