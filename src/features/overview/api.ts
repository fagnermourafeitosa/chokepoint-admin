import { httpClient } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
import { traceBase } from '../investigate/api';
import type { Action, AgentRef, Page, Reason } from '../investigate/types';
// Backend 057: would_deny calls ran; they are in total, never in denied.
export type Totals = { from: string; to: string; allowed: number; denied: number; would_deny: number; total: number };
export type Bucket = {
  from: string;
  to: string;
  allowed: number;
  denied: number;
  would_deny: number;
  partial: boolean;
};
export type DeniedRank = {
  server_id: string;
  server_name?: string | null;
  tool: string;
  // The verified agent (Backend 034 Admin contract item 4).
  agent: AgentRef;
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
  // Present only while an agent of the environment is in Report-only (Backend 057).
  report_only?: { agents: number; would_deny_today: number };
};
// The summary of the Report-only banner (Backend 057).
export type ReportOnlySummary = {
  agents: { id: string; name: string; review_by: string | null; since: string | null }[];
  would_deny_last_24h: number;
  would_deny_last_7d: number;
  review_overdue: number;
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
  reportOnly: (s: EnvironmentScope, signal: AbortSignal) =>
    httpClient<ReportOnlySummary>(`${traceBase(s)}/report-only`, { signal }),
  unused: (s: EnvironmentScope, page: number, signal: AbortSignal) =>
    httpClient<Page<UnusedTool>>(`${traceBase(s)}/unused-tools?page=${page}&page_size=6`, {
      signal,
    }),
};
