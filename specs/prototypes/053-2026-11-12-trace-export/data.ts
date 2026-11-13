// Admin 053 prototype: fixed data for the layout. Not real fields or endpoints.
export const account = { email: 'beatriz@acme.test' };

export type WorkspaceOption = { tenantId: string; name: string };

// The workspaces of the account: only these can be chosen for a destination.
export const workspaces: WorkspaceOption[] = [
  { tenantId: 'acme-support', name: 'Acme Support' },
  { tenantId: 'acme-billing', name: 'Acme Billing' },
  { tenantId: 'acme-internal-tools', name: 'Acme Internal Tools' },
];

export type DestinationType = 'otlp' | 'webhook';
export type DestinationStatus = 'delivering' | 'failing' | 'disabled';
export type Header = { name: string; value: string };
export type Environment = 'production' | 'sandbox';

export type Destination = {
  id: string;
  name: string;
  type: DestinationType;
  endpoint: string;
  otlpProtocol?: 'grpc' | 'http';
  headers: Header[];
  // The environments each workspace exports to this destination.
  exports: Record<string, Environment[]>;
  status: DestinationStatus;
  lastDelivery: string;
  lastError?: string;
};

export const destinations: Destination[] = [
  {
    id: 'dst-splunk',
    name: 'Splunk security',
    type: 'otlp',
    endpoint: 'https://otel-collector.acme.internal:4318',
    otlpProtocol: 'http',
    headers: [{ name: 'Authorization', value: '••••••••' }],
    exports: { 'acme-support': ['production'], 'acme-billing': ['production', 'sandbox'] },
    status: 'delivering',
    lastDelivery: '2026-11-12 14:32',
  },
  {
    id: 'dst-datadog',
    name: 'Datadog platform',
    type: 'otlp',
    endpoint: 'https://otlp.datadoghq.com',
    otlpProtocol: 'http',
    headers: [{ name: 'dd-api-key', value: '••••••••' }],
    exports: { 'acme-internal-tools': ['production', 'sandbox'] },
    status: 'failing',
    lastDelivery: '2026-11-12 09:05',
    lastError: '401 Unauthorized from otlp.datadoghq.com',
  },
  {
    id: 'dst-oncall',
    name: 'On-call webhook',
    type: 'webhook',
    endpoint: 'https://hooks.acme.com/agent-calls',
    headers: [],
    exports: { 'acme-billing': ['production'] },
    status: 'disabled',
    lastDelivery: '2026-11-03 18:47',
  },
];
