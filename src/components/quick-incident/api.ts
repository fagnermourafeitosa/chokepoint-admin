import { httpClient } from '../../api/http-client';
import type { EnvironmentScope } from '../../features/access/environment-scope';

// The kinds of incident that a reference code names (Backend 053).
export type IncidentKind = 'decision' | 'exchange';
export type Incident = { kind: IncidentKind; id: string; occurred_at: string };
export type IncidentLookup = { code: string; items: Incident[] };

// The Investigate inspector of each kind. A new kind of incident is one entry here.
export const incidentRoutes: Record<IncidentKind, (id: string) => string> = {
  decision: (id) => `/investigate?view=decisions&decision_id=${encodeURIComponent(id)}`,
  exchange: (id) => `/investigate?view=exchanges&exchange_id=${encodeURIComponent(id)}`,
};

export const incidentLabels: Record<IncidentKind, string> = {
  decision: 'Denied tool call',
  exchange: 'Refused token exchange or login',
};

const code = /^([a-z2-7]{4})-?([a-z2-7]{4})$/;

// normalizeCode returns the stored form of a typed code (Backend 053 incident.Normalize), or null.
export function normalizeCode(raw: string) {
  const match = code.exec(raw.trim().toLowerCase());
  return match ? `${match[1]}-${match[2]}` : null;
}

export const incidentApi = {
  find: (s: EnvironmentScope, value: string, signal?: AbortSignal) =>
    httpClient<IncidentLookup>(`/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/incidents/${encodeURIComponent(value)}`, { signal }),
};
