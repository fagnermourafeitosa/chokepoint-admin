import { useEffect, useState } from 'react';
import { SelectMenu } from '../../components/ui/dropdown/SelectMenu';
import type { useInvestigation } from './useInvestigation';
import { denyText, exchangeShort } from './labels';
type State = ReturnType<typeof useInvestigation>;
export function InvestigationToolbar({ state }: { state: State }) {
  const exchanges = state.view === 'exchanges';
  const [query, setQuery] = useState(state.filters.q || '');
  useEffect(() => setQuery(state.filters.q || ''), [state.filters.q]);
  // The Token exchanges view filters by agent_id, the decision views by agent.
  const agentParam = exchanges ? 'agent_id' : 'agent';
  const agentValue = (exchanges ? state.exchangeFilters.agent_id : state.filters.agent) || '';
  const reasons = exchanges ? Object.entries(exchangeShort) : Object.entries(denyText).map(([label]) => [label, label.replaceAll('_', ' ')]);
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
          onClick={() => state.update({ view: undefined, result: undefined, agent_id: undefined, reason: undefined })}
        >
          By problem
        </button>
        <button
          aria-pressed={state.view === 'decisions'}
          onClick={() => state.update({ view: 'decisions', agent_id: undefined, reason: undefined })}
        >
          All decisions
        </button>
        <button
          aria-pressed={exchanges}
          onClick={() => state.update({ view: 'exchanges', agent: undefined, reason: undefined, result: undefined, server_id: undefined, tool: undefined, issuer: undefined, subject: undefined })}
        >
          Token exchanges
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
          {exchanges ? 'Search agent, subject or identity provider' : 'Search agent, server, tool or person'}
        </label>
        <input
          id="trace-search"
          type="search"
          maxLength={256}
          className="cp-admin-input"
          placeholder={exchanges ? 'Search agent, subject or identity provider…' : 'Search agent, server, tool or person…'}
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
        value={agentValue}
        onChange={(value) => state.update({ [agentParam]: value || undefined })}
        options={[
          { value: '', label: 'All agents' },
          ...(agentValue && !state.agentItems.some((a) => a.agent.id === agentValue) ? [{ value: agentValue, label: agentValue }] : []),
          ...state.agentItems.map((a) => ({ value: a.agent.id, label: a.agent.name || a.agent.id })),
        ]}
      />
      <SelectMenu
        group="investigate-filters"
        label="Reason"
        value={(exchanges ? state.exchangeFilters.reason : state.filters.reason) || ''}
        onChange={(value) => state.update({ reason: value || undefined })}
        options={[{ value: '', label: 'All reasons' }, ...reasons.map(([value, label]) => ({ value, label }))]}
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
      {state.view !== 'problems' ? (
        <SelectMenu
          group="investigate-filters"
          label="Result"
          value={(exchanges ? state.exchangeFilters.result : state.filters.result) || 'all'}
          onChange={(value) => state.update({ result: value })}
          options={[
            { value: 'all', label: 'All results' },
            { value: 'deny', label: exchanges ? 'Refused' : 'Deny' },
            { value: 'allow', label: exchanges ? 'Issued' : 'Allow' },
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
