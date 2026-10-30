import { httpClient } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
import { traceBase } from '../investigate/api';
import type { Action, Page, Reason } from '../investigate/types';
export type Totals = { from: string; to: string; allowed: number; denied: number; total: number };
export type Bucket = {
  from: string;
  to: string;
  allowed: number;
  denied: number;
  partial: boolean;
};
export type DeniedRank = {
  server_id: string;
  server_name?: string | null;
  tool: string;
  agent: string;
  agent_name?: string | null;
  reason: Reason;
  count: number;
  latest_decision_id: string;
  window_start: string;
  from: string;
  to: string;
};
export type Overview = {
  generated_at: string;
  timezone: 'UTC';
  approximate: boolean;
  retention_days: number;
  today: Totals;
  yesterday_same_time: Totals;
  denied_share: number | null;
  total_change_percent: number | null;
  denied_change_percent: number | null;
  traffic: { from: string; to: string; buckets: Bucket[] };
  most_denied: DeniedRank[];
  tools: { total: number; reviewed: number; needs_review: number; observed_at: string };
  unused_tools: { count: number; from: string; to: string };
};
export type UnusedTool = {
  server_id: string;
  server_name?: string | null;
  tool: string;
  actions: Action[];
};
export const overviewApi = {
  get: (s: EnvironmentScope, signal: AbortSignal) =>
    httpClient<Overview>(`${traceBase(s)}/overview`, { signal }),
  unused: (s: EnvironmentScope, page: number, signal: AbortSignal) =>
    httpClient<Page<UnusedTool>>(`${traceBase(s)}/unused-tools?page=${page}&page_size=6`, {
      signal,
    }),
};
