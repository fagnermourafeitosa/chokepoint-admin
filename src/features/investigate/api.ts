import { httpClient } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
import type { Decision, DecisionDetail, Page, Problem, ProblemKey, TraceFilters } from './types';
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
    httpClient<Page<{ agent: string; agent_name?: string | null }>>(
      `${traceBase(s)}/agents?${traceQuery(f)}`,
      { signal },
    ),
};
