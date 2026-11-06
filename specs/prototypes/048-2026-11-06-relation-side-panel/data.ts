import type { Configuration } from '../../../src/features/access/delegation/api';
import type { CatalogState } from '../../../src/features/access/delegation/catalog';
import type { Catalog, Doc } from '../../../src/features/access/delegation/model';

// Fixed data of the relation side panel prototype (Admin 048). Invented for the layout.
export const agentName = 'refunds-assistant';

const billing = 'srv-acme-billing', identity = 'idp-acme-identity', services = 'idp-acme-services';

const catalog: Catalog = {
  servers: [{ id: billing, name: 'Acme Billing', type: 'custom' }],
  tools: [
    { serverId: billing, tool: 'get_order', args: { order_id: 'string' } },
    { serverId: billing, tool: 'refund_order', args: { order_id: 'string', amount: 'number', reason: 'string' }, mapping: { pointer: '/order_id', kind: 'order_id' } },
    { serverId: billing, tool: 'list_refunds', args: { customer_id: 'string' } },
  ],
  // A fake context source, Acme Orders API, bound to refund_order and get_order (Admin 048 prototype).
  bindings: (serverId, tool) => serverId === billing && (tool === 'refund_order' || tool === 'get_order') ? [
    { id: 'acme-orders-order', source: 'Acme Orders API', entity: 'resource', attributes: [{ name: 'owner_id', type: 'string' }, { name: 'status', type: 'string' }, { name: 'total', type: 'number' }] },
    { id: 'acme-hr-person', source: 'Acme HR API', entity: 'subject', attributes: [{ name: 'department', type: 'string' }, { name: 'refund_ceiling', type: 'number' }] },
  ] : [],
  idps: [
    { id: identity, name: 'Acme Identity', enabled: true, provider: 'keycloak', groups: true, harnessLogin: false },
    { id: services, name: 'Acme Services', enabled: true, provider: 'keycloak', groups: false, harnessLogin: false },
  ],
  directory: issuer => issuer === services ? { truncated: false, subjects: [
    { subject: 'svc-billing-worker', name: 'billing-worker', kind: 'service' },
    { subject: 'svc-crm-sync', name: 'crm-sync', kind: 'service' },
    { subject: 'svc-support-bot', name: 'support-bot', kind: 'service' },
  ] } : ({ truncated: false, subjects: [
    { subject: 'u-ana', name: 'Ana Ribeiro', kind: 'person' },
    { subject: 'u-bruno', name: 'Bruno Costa', kind: 'person' },
    { subject: 'u-carla', name: 'Carla Mendes', kind: 'person' },
    { subject: 'u-diego', name: 'Diego Alves', kind: 'person' },
    { subject: 'u-elisa', name: 'Elisa Prado', kind: 'person' },
    { subject: 'u-fabio', name: 'Fábio Lima', kind: 'person' },
    { subject: 'u-gabi', name: 'Gabriela Rocha', kind: 'person' },
  ] }),
};

export const catalogState: CatalogState = {
  scope: { userId: 'prototype', tenantId: 'prototype', environmentId: 'prototype' },
  catalog, loading: false, error: false, retry: () => undefined, request: () => undefined, directoryFailed: () => false,
};

export const initialDoc: Doc = {
  scopes: [{ issuer: identity, kinds: ['person'] }, { issuer: services, kinds: ['service'] }],
  delegations: [
    { id: `${identity}/u-ana`, issuer: identity, subject: 'u-ana', kind: 'person' },
    { id: `${identity}/u-diego`, issuer: identity, subject: 'u-diego', kind: 'person' },
    { id: `${services}/svc-billing-worker`, issuer: services, subject: 'svc-billing-worker', kind: 'service' },
    { id: `${services}/svc-crm-sync`, issuer: services, subject: 'svc-crm-sync', kind: 'service' },
  ],
  capabilities: [
    { id: `${billing}/get_order`, serverId: billing, tool: 'get_order', conditions: [{ id: 'c-dept', name: 'Support and finance only', expression: 'subject.properties.chokepoint["acme-hr-person"].values["department"] in ["support", "finance"]', bindings: ['acme-hr-person'], limits: [] }] },
    { id: `${billing}/refund_order`, serverId: billing, tool: 'refund_order', conditions: [{ id: 'c-limit', name: 'Refund up to 200', expression: 'args.amount <= 200', bindings: [], limits: [] }, { id: 'c-orders', name: 'Only orders 1001 and 1002', expression: 'args.order_id in ["1001", "1002"]', bindings: [], limits: [] }, { id: 'c-open', name: 'Only open orders of the customer', expression: 'resource.properties.chokepoint["acme-orders-order"].values["status"] == "open" && resource.properties.chokepoint["acme-orders-order"].values["owner_id"] == subject.id', bindings: ['acme-orders-order'], limits: [] }] },
    { id: `${billing}/list_refunds`, serverId: billing, tool: 'list_refunds', conditions: [] },
  ],
  resources: [],
  blocked: [],
};

export const agents = [
  { name: 'refunds-assistant', description: 'Answers order questions and issues refunds within limits.', reportOnly: false, overdue: false },
  { name: 'support-assistant', description: 'Reads and answers support tickets of the first tier.', reportOnly: false, overdue: false },
  { name: 'issues-manager', description: 'Triages and updates issues in the Acme repositories.', reportOnly: true, overdue: true },
  { name: 'analytics-assistant', description: 'Runs read-only reports on the sales and inventory data.', reportOnly: false, overdue: false },
];

export const config: Configuration = {
  agent_id: 'agent-refunds', revision: 26, published_revision: 26, effective_revision: 26, reconciliation: { state: 'effective' },
  published_by: 'u-beatriz', published_by_name: 'Beatriz Nunes', published_at: '2026-11-05T18:11:00Z', note: null,
};

// The other agents of the environment that call each tool, for the mapping warning (invented).
export const toolCallers: Record<string, string[]> = {
  'srv-acme-billing/get_order': ['support-assistant', 'analytics-assistant'],
  'srv-acme-billing/list_refunds': ['support-assistant'],
};
