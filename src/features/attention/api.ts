import { httpClient } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';

// SignalType mirrors the backend attention_signal_type enum.
export type SignalType = 'tool-discovery' | 'requests-denied' | 'idp-user-disable';

export const signalTypeLabels: Record<SignalType, string> = {
  'tool-discovery': 'Tool discovery',
  'requests-denied': 'Requests denied',
  'idp-user-disable': 'IdP user disabled',
};

// typeLabel shows the raw value for a type this Admin version does not know yet.
export const typeLabel = (type: string) => (signalTypeLabels as Record<string, string>)[type] ?? type;

export type Signal = {
  id: string;
  type: SignalType;
  subject: string;
  context: Record<string, string>;
  target_route: string;
  target_params: Record<string, string>;
  target_label: string;
  occurred_at: string;
};
export type SignalPage = { items: Signal[]; total: number; page: number; page_size: number };
export type SignalCounts = { pending: number; by_type: Partial<Record<SignalType, number>> };

export const pageSize = 5;

const base = (s: EnvironmentScope): `/v1/${string}` =>
  `/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/attention-signals`;

// Keys include the scope, so a workspace or environment change never shows old data.
export const attentionKey = (s: EnvironmentScope) => ['attention-signals', s.userId, s.tenantId, s.environmentId] as const;

// DeniedCounts mirrors the backend 021 decision trace counters.
export type DeniedCounts = { denied_today: number };

// deniedKey holds the decision trace counters. It sits outside attentionKey,
// because a review does not change the denied count.
export const deniedKey = (s: EnvironmentScope) => ['decision-trace', s.userId, s.tenantId, s.environmentId] as const;

export const decisionTraceApi = {
  counts: (s: EnvironmentScope, signal: AbortSignal) =>
    httpClient<DeniedCounts>(`/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/decision-trace/counts`, { signal }),
};

export const attentionApi = {
  list: (s: EnvironmentScope, type: SignalType | 'all', page: number, signal: AbortSignal) => {
    const query = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (type !== 'all') query.set('type', type);
    return httpClient<SignalPage>(`${base(s)}?${query}`, { signal });
  },
  counts: (s: EnvironmentScope, signal: AbortSignal) => httpClient<SignalCounts>(`${base(s)}/counts`, { signal }),
  review: (s: EnvironmentScope, id: string, signal?: AbortSignal) =>
    httpClient<void>(`${base(s)}/${id}/review`, { method: 'POST', signal }),
};
