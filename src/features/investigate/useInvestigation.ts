import { useEffect } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { traceApi, traceKey } from './api';
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
  const view = params.get('view') === 'decisions' ? 'decisions' : 'problems';
  const canonical = ['server_id', 'tool', 'agent', 'reason', 'window_start'].every((key) =>
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
  const unavailableTarget = params.has('signal_id') && !requested && !canonical;
  const isDetail = !!requested || canonical || unavailableTarget;
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
