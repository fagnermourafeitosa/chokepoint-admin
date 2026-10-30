import { useEffect, useState } from 'react';
import { SelectMenu } from '../../components/ui/dropdown/SelectMenu';
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
      <SelectMenu
        group="investigate-filters"
        label="Agent"
        value={state.filters.agent || ''}
        onChange={(value) => state.update({ agent: value || undefined })}
        options={[
          { value: '', label: 'All agents' },
          ...(state.filters.agent && !state.agentItems.some((a) => a.agent === state.filters.agent)
            ? [{ value: state.filters.agent, label: state.filters.agent }]
            : []),
          ...state.agentItems.map((a) => ({ value: a.agent, label: a.agent_name || a.agent })),
        ]}
      />
      <SelectMenu
        group="investigate-filters"
        label="Period"
        value={state.params.get('period') || (state.filters.from ? 'custom' : 'all')}
        onChange={period}
        options={[
          { value: 'all', label: 'All retained history' },
          { value: '1', label: 'Last 24 hours' },
          { value: '7', label: 'Last 7 days' },
          { value: '30', label: 'Last 30 days' },
          ...(state.filters.from && !state.params.has('period')
            ? [{ value: 'custom', label: 'Selected UTC period' }]
            : []),
        ]}
      />
      {state.view === 'decisions' ? (
        <SelectMenu
          group="investigate-filters"
          label="Result"
          value={state.filters.result || 'all'}
          onChange={(value) => state.update({ result: value })}
          options={[
            { value: 'all', label: 'All results' },
            { value: 'deny', label: 'Deny' },
            { value: 'allow', label: 'Allow' },
          ]}
        />
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
