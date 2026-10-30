import type { Action, Principal } from '../investigate/types';
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

export type SignalStatus = 'open' | 'reviewed' | 'resolved';
export type StatusFilter = 'active' | SignalStatus | 'all';
export type Signal = {
  id: string;
  type: SignalType;
  subject: string;
  context: Record<string, string>;
  target_route: string;
  target_params: Record<string, string>;
  target_label: string;
  occurred_at: string;
  status: SignalStatus;
  was_reviewed: boolean;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  note: string;
  principal?: Principal | null;
  actions: Action[];
};
export type SignalPage = { items: Signal[]; total: number; page: number; page_size: number };
export type SignalCounts = { pending: number; active: number; reviewed: number; resolved: number; by_type: Partial<Record<SignalType, number>> };

export const pageSize = 5;

const base = (s: EnvironmentScope): `/v1/${string}` =>
  `/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/attention-signals`;

// Keys include the scope, so a workspace or environment change never shows old data.
export const attentionKey = (s: EnvironmentScope) => ['attention-signals', s.userId, s.tenantId, s.environmentId] as const;

export const attentionApi = {
  list: (s: EnvironmentScope, type: SignalType | 'all', page: number, status: StatusFilter, signal: AbortSignal) => {
    const query = new URLSearchParams({ page: String(page), page_size: String(pageSize), status });
    if (type !== 'all') query.set('type', type);
    return httpClient<SignalPage>(`${base(s)}?${query}`, { signal });
  },
  counts: (s: EnvironmentScope, signal: AbortSignal) => httpClient<SignalCounts>(`${base(s)}/counts`, { signal }),
  get: (s: EnvironmentScope, id: string, signal: AbortSignal) => httpClient<Signal>(`${base(s)}/${encodeURIComponent(id)}`, { signal }),
  review: (s: EnvironmentScope, id: string, signal?: AbortSignal) =>
    httpClient<Signal>(`${base(s)}/${encodeURIComponent(id)}/review`, { method: 'POST', signal }),
  resolve: (s: EnvironmentScope, id: string, signal?: AbortSignal) =>
    httpClient<Signal>(`${base(s)}/${encodeURIComponent(id)}/resolve`, { method: 'POST', signal }),
};
