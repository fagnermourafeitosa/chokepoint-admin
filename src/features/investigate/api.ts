import { httpClient } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
import type { AgentRef, Decision, DecisionDetail, Exchange, ExchangeDetail, ExchangeProblem, Page, Problem, ProblemKey, TraceFilters } from './types';
export const traceKey = (s: EnvironmentScope) =>
  ['decision-trace', s.userId, s.tenantId, s.environmentId] as const;
export const traceBase = (s: EnvironmentScope): `/v1/${string}` =>
  `/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/decision-trace`;
export function traceQuery(values: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value) q.set(key, value);
  return q;
}
export const traceApi = {
  problems: (s: EnvironmentScope, f: TraceFilters, signal: AbortSignal) =>
    httpClient<Page<Problem>>(`${traceBase(s)}/problems?${traceQuery(f)}`, { signal }),
  decisions: (s: EnvironmentScope, f: TraceFilters, signal: AbortSignal) =>
    httpClient<Page<Decision>>(`${traceBase(s)}/decisions?${traceQuery(f)}`, { signal }),
  detail: (s: EnvironmentScope, id: string, signal: AbortSignal) =>
    httpClient<DecisionDetail>(`${traceBase(s)}/decisions/${encodeURIComponent(id)}`, { signal }),
  problem: (s: EnvironmentScope, key: ProblemKey, signal: AbortSignal) =>
    httpClient<Problem>(`${traceBase(s)}/problem?${traceQuery(key)}`, { signal }),
  breakdown: (s: EnvironmentScope, key: ProblemKey, page: number, signal: AbortSignal) =>
    httpClient<Page<Decision>>(
      `${traceBase(s)}/problem/decisions?${traceQuery({ ...key, page: String(page) })}`,
      { signal },
    ),
  agents: (s: EnvironmentScope, f: TraceFilters, signal: AbortSignal) =>
    httpClient<Page<{ agent: AgentRef }>>(`${traceBase(s)}/agents?${traceQuery(f)}`, { signal }),
};

// Token exchange reads (Backend 034 Admin contract item 2).
export type ExchangeFilters = {
  q?: string;
  agent_id?: string;
  reason?: string;
  result?: string;
  from?: string;
  to?: string;
  page?: string;
};
const exchangeBase = (s: EnvironmentScope): `/v1/${string}` =>
  `/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/token-exchanges`;
export const exchangeApi = {
  list: (s: EnvironmentScope, f: ExchangeFilters, signal: AbortSignal) =>
    httpClient<Page<Exchange>>(`${exchangeBase(s)}?${traceQuery(f)}`, { signal }),
  problems: (s: EnvironmentScope, f: ExchangeFilters, signal: AbortSignal) =>
    httpClient<Page<ExchangeProblem>>(`${exchangeBase(s)}/problems?${traceQuery(f)}`, { signal }),
  detail: (s: EnvironmentScope, id: string, page: number, signal: AbortSignal) =>
    httpClient<ExchangeDetail>(`${exchangeBase(s)}/${encodeURIComponent(id)}?${traceQuery({ page: String(page) })}`, { signal }),
};
