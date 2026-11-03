import { useEffect } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { exchangeApi, traceApi, traceKey, type ExchangeFilters } from './api';
import type { EnvironmentScope } from '../access/environment-scope';
import type { ProblemKey, TraceFilters } from './types';
const filterKeys = [
  'agent',
  'from',
  'to',
  'q',
  'server_id',
  'tool',
  'issuer',
  'subject',
  'reason',
  'result',
  'page',
] as const;
export function useInvestigation(scope: EnvironmentScope) {
  const [params, setParams] = useSearchParams();
  const filters: TraceFilters = {};
  for (const key of filterKeys) if (params.get(key)) filters[key] = params.get(key)!;
  const raw = params.get('view');
  const view = raw === 'decisions' ? 'decisions' : raw === 'exchanges' ? 'exchanges' : 'problems';
  // The Token exchanges view filters by agent_id, as the signal target does (Backend 034).
  const exchangeFilters: ExchangeFilters = {};
  for (const key of ['q', 'agent_id', 'reason', 'result', 'from', 'to', 'page'] as const) if (params.get(key)) exchangeFilters[key] = params.get(key)!;
  const exchangeId = params.get('exchange_id');
  const canonical = view !== 'exchanges' && ['server_id', 'tool', 'agent', 'reason', 'window_start'].every((key) =>
    params.has(key),
  );
  const key: ProblemKey = {
    server_id: params.get('server_id') || '',
    tool: params.get('tool') || '',
    agent: params.get('agent') || '',
    reason: params.get('reason') || '',
    window_start: params.get('window_start') || '',
  };
  const requested = params.get('decision_id');
  const problem = useQuery({
    queryKey: [...traceKey(scope), 'problem', key],
    queryFn: ({ signal }) => traceApi.problem(scope, key, signal),
    enabled: !requested && canonical,
    retry: false,
  });
  const decisionId = requested || problem.data?.latest_decision_id;
  // A token exchange signal opens the Token exchanges list, not a decision.
  const unavailableTarget = view !== 'exchanges' && params.has('signal_id') && !requested && !canonical;
  const isDetail = !!requested || canonical || unavailableTarget || !!exchangeId;
  const detail = useQuery({
    queryKey: [...traceKey(scope), 'detail', decisionId],
    queryFn: ({ signal }) => traceApi.detail(scope, decisionId!, signal),
    enabled: !!decisionId,
    retry: false,
  });
  const linkedSignal = detail.data?.problem?.signal?.id;
  useEffect(() => {
    if (linkedSignal && !params.has('signal_id'))
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          next.set('signal_id', linkedSignal);
          return next;
        },
        { replace: true },
      );
  }, [linkedSignal, params, setParams]);
  const problems = useQuery({
    queryKey: [...traceKey(scope), 'problems', filters],
    queryFn: ({ signal }) => traceApi.problems(scope, filters, signal),
    enabled: !isDetail && view === 'problems',
  });
  // Refused exchanges are grouped like their signal, with the count in the window.
  const groupedExchanges = exchangeFilters.result === 'deny';
  const exchanges = useQuery({
    queryKey: [...traceKey(scope), 'exchanges', exchangeFilters],
    queryFn: ({ signal }) => exchangeApi.list(scope, exchangeFilters, signal),
    enabled: !isDetail && view === 'exchanges' && !groupedExchanges,
  });
  const exchangeProblems = useQuery({
    queryKey: [...traceKey(scope), 'exchange-problems', exchangeFilters],
    queryFn: ({ signal }) => exchangeApi.problems(scope, exchangeFilters, signal),
    enabled: !isDetail && view === 'exchanges' && groupedExchanges,
  });
  const decisions = useQuery({
    queryKey: [...traceKey(scope), 'decisions', filters],
    queryFn: ({ signal }) => traceApi.decisions(scope, filters, signal),
    enabled: !isDetail && view === 'decisions',
  });
  const agents = useInfiniteQuery({
    queryKey: [...traceKey(scope), 'agents', filters.from, filters.to, filters.q],
    initialPageParam: 1,
    queryFn: ({ signal, pageParam }) =>
      traceApi.agents(
        scope,
        {
          from: filters.from,
          to: filters.to,
          q: filters.q,
          page_size: '50',
          page: String(pageParam),
        },
        signal,
      ),
    getNextPageParam: (page) =>
      page.page * page.page_size < page.total ? page.page + 1 : undefined,
  });
  const agentItems = agents.data?.pages.flatMap((p) => p.items) || [];
  function update(values: Record<string, string | undefined>, replace = false) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('page');
        for (const [key, value] of Object.entries(values)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace },
    );
  }
  function openExchange(id: string) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (!isDetail) next.set('return_to', `/investigate?${previous}`);
      next.set('exchange_id', id);
      return next;
    });
  }
  function open(id: string, signalId?: string) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (!isDetail) next.set('return_to', `/investigate?${previous}`);
      next.set('decision_id', id);
      if (signalId) next.set('signal_id', signalId);
      else if (!isDetail) next.delete('signal_id');
      return next;
    });
  }
  return {
    params,
    filters,
    view,
    problem,
    detail,
    problems,
    decisions,
    exchanges,
    exchangeProblems,
    groupedExchanges,
    exchangeFilters,
    exchangeId,
    openExchange,
    agents,
    agentItems,
    isDetail,
    unavailableTarget,
    decisionId,
    update,
    open,
    setParams,
  };
}
