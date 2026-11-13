import { httpClient } from '../../api/http-client';

// Backend 086: the events export destinations of the signed-in person.
export type DestinationType = 'otlp' | 'webhook';
export type OTLPProtocol = 'http' | 'grpc';
export type ExportEnvironment = 'production' | 'sandbox';
export type DestinationStatus = 'delivering' | 'failing' | 'disabled';

export type Destination = {
  id: string;
  name: string;
  type: DestinationType;
  endpoint: string;
  otlp_protocol: OTLPProtocol | null;
  enabled: boolean;
  headers: { name: string; value_configured: boolean }[];
  exports: { tenant_id: string; workspace_name: string; environment: ExportEnvironment }[];
  status: DestinationStatus;
  last_delivery_at: string | null;
  last_error: string | null;
  dropped: number;
  created_at: string;
  // The webhook secret, only in the response that created or replaced it.
  secret?: string;
};

export type DestinationInput = {
  name: string;
  type: DestinationType;
  endpoint: string;
  otlp_protocol: OTLPProtocol | '';
  enabled: boolean;
  // An empty value keeps the stored value of the same header.
  headers: { name: string; value: string }[];
  exports: { tenant_id: string; environment: ExportEnvironment }[];
};

export type TestResult = { delivered: boolean; status_code: number | null; duration_ms: number; error: string | null };

export const destinationsKey = ['account', 'events-export'] as const;
const base = '/v1/account/events-export';

export const eventsExportApi = {
  list: (page: number, size: number, signal: AbortSignal) =>
    httpClient<{ items: Destination[]; total: number; page: number; size: number }>(`${base}/destinations?page=${page}&size=${size}`, { signal }),
  get: (id: string, signal: AbortSignal) => httpClient<Destination>(`${base}/destinations/${encodeURIComponent(id)}`, { signal }),
  create: (input: DestinationInput) => httpClient<Destination>(`${base}/destinations`, { method: 'POST', json: input }),
  update: (id: string, input: DestinationInput) => httpClient<Destination>(`${base}/destinations/${encodeURIComponent(id)}`, { method: 'PUT', json: input }),
  remove: (id: string) => httpClient<void>(`${base}/destinations/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  rotateSecret: (id: string) => httpClient<{ secret: string }>(`${base}/destinations/${encodeURIComponent(id)}/rotate-secret`, { method: 'POST' }),
  test: (input: DestinationInput & { destination_id?: string }) =>
    httpClient<TestResult>(`${base}/test`, { method: 'POST', json: input }),
};
