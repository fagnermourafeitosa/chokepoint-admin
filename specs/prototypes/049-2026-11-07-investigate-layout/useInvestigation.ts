import { useSearchParams } from 'react-router';
import type { ExchangeFilters } from '../../../src/features/investigate/api';
import type { ExchangeProblem, Page, TraceFilters } from '../../../src/features/investigate/types';
import { agentItems, decisions, exchanges, problems } from './data';

// Admin 049 prototype: the same shape as src/features/investigate/useInvestigation.ts, read from
// fixed data. Views and filters live in the URL; the lists do not filter the fixed rows.
const filterKeys = ['agent', 'from', 'to', 'q', 'server_id', 'tool', 'issuer', 'subject', 'reason', 'result', 'page'] as const;

function fixed<T>(data: Page<T>) {
  return { data, isError: false, isPending: false, isFetching: false, refetch: () => Promise.resolve() };
}

export function useInvestigation() {
  const [params, setParams] = useSearchParams();
  const filters: TraceFilters = {};
  for (const key of filterKeys) if (params.get(key)) filters[key] = params.get(key)!;
  const raw = params.get('view');
  const view = raw === 'decisions' ? 'decisions' : raw === 'exchanges' ? 'exchanges' : 'problems';
  const exchangeFilters: ExchangeFilters = {};
  for (const key of ['q', 'agent_id', 'reason', 'result', 'from', 'to', 'page'] as const) if (params.get(key)) exchangeFilters[key] = params.get(key)!;
  const groupedExchanges = exchangeFilters.result === 'deny';
  function update(values: Record<string, string | undefined>) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete('page');
      for (const [key, value] of Object.entries(values)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      return next;
    });
  }
  return {
    params,
    filters,
    view,
    problems: fixed(problems),
    decisions: fixed(decisions),
    exchanges: fixed(exchanges),
    exchangeProblems: fixed<ExchangeProblem>({ items: [], total: 0, page: 1, page_size: 6 }),
    groupedExchanges,
    exchangeFilters,
    agents: { hasNextPage: false, isFetchingNextPage: false, isError: false, fetchNextPage: () => Promise.resolve(), refetch: () => Promise.resolve() },
    agentItems,
    isDetail: params.has('decision_id'),
    update,
    open: (id: string) => setParams((previous) => { const next = new URLSearchParams(previous); next.set('decision_id', id); return next; }),
    back: () => setParams((previous) => { const next = new URLSearchParams(previous); next.delete('decision_id'); return next; }),
    // The token exchange detail is not part of this prototype yet.
    openExchange: (_id: string) => undefined,
  };
}
