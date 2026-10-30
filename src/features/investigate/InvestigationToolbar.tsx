import { useEffect, useState } from 'react';
import type { useInvestigation } from './useInvestigation';
type State = ReturnType<typeof useInvestigation>;
export function InvestigationToolbar({ state }: { state: State }) {
  const [query, setQuery] = useState(state.filters.q || '');
  useEffect(() => setQuery(state.filters.q || ''), [state.filters.q]);
  function period(value: string) {
    const days = Number(value);
    if (!days) state.update({ period: 'all', from: undefined, to: undefined });
    else {
      const now = new Date();
      state.update({
        period: value,
        from: new Date(now.getTime() - days * 86400000).toISOString(),
        to: now.toISOString(),
      });
    }
  }
  return (
    <div className="trace-toolbar">
      <div className="trace-segments" role="group" aria-label="Investigation view">
        <button
          aria-pressed={state.view === 'problems'}
          onClick={() => state.update({ view: undefined, result: undefined })}
        >
          By problem
        </button>
        <button
          aria-pressed={state.view === 'decisions'}
          onClick={() => state.update({ view: 'decisions' })}
        >
          All decisions
        </button>
      </div>
      <form
        className="trace-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          state.update({ q: query.trim() || undefined });
        }}
      >
        <label className="attention-sr-only" htmlFor="trace-search">
          Search agent, server, tool or person
        </label>
        <input
          id="trace-search"
          type="search"
          maxLength={256}
          className="cp-admin-input"
          placeholder="Search agent, server, tool or person…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) state.update({ q: undefined });
          }}
        />
        <button className="cp-admin-button cp-admin-button--secondary" type="submit">
          Search
        </button>
      </form>
      <label>
        <span className="attention-sr-only">Agent</span>
        <select
          className="cp-admin-input"
          value={state.filters.agent || ''}
          onChange={(e) => state.update({ agent: e.target.value || undefined })}
        >
          <option value="">All agents</option>
          {state.filters.agent && !state.agentItems.some((a) => a.agent === state.filters.agent) ? (
            <option value={state.filters.agent}>{state.filters.agent}</option>
          ) : null}
          {state.agentItems.map((a) => (
            <option key={a.agent} value={a.agent}>
              {a.agent_name || a.agent}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="attention-sr-only">Period</span>
        <select
          className="cp-admin-input"
          value={state.params.get('period') || (state.filters.from ? 'custom' : 'all')}
          onChange={(e) => period(e.target.value)}
        >
          <option value="all">All retained history</option>
          <option value="1">Last 24 hours</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          {state.filters.from && !state.params.has('period') ? (
            <option value="custom">Selected UTC period</option>
          ) : null}
        </select>
      </label>
      {state.view === 'decisions' ? (
        <label>
          <span className="attention-sr-only">Result</span>
          <select
            className="cp-admin-input"
            value={state.filters.result || 'all'}
            onChange={(e) => state.update({ result: e.target.value })}
          >
            <option value="all">All results</option>
            <option value="deny">Deny</option>
            <option value="allow">Allow</option>
          </select>
        </label>
      ) : null}
      {state.agents.hasNextPage ? (
        <button
          className="cp-admin-button cp-admin-button--ghost"
          disabled={state.agents.isFetchingNextPage}
          onClick={() => void state.agents.fetchNextPage()}
        >
          Load more agents
        </button>
      ) : null}
      {state.agents.isError ? (
        <button
          className="cp-admin-button cp-admin-button--ghost"
          onClick={() => void state.agents.refetch()}
        >
          Retry agent options
        </button>
      ) : null}
      <span className="trace-sort">Latest first · UTC</span>
      {state.filters.server_id ||
      state.filters.tool ||
      state.filters.issuer ||
      state.filters.reason ? (
        <button
          className="cp-admin-button cp-admin-button--ghost"
          onClick={() =>
            state.update({
              server_id: undefined,
              tool: undefined,
              issuer: undefined,
              subject: undefined,
              reason: undefined,
            })
          }
        >
          Clear row filters
        </button>
      ) : null}
    </div>
  );
}
