import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { agentClientKey, type AgentClient } from '../../../src/features/access/agent-client-api';
import { allowlistKey, harnessCatalogKey, sessionsKey, type ClientAllowlist, type Harness, type InteractiveConsent, type InteractiveGrant } from '../../../src/features/access/harness-api';
import { delegationKey, type Configuration } from '../../../src/features/access/delegation/api';
import { config } from './data';

// Admin 048 prototype: the Identity and Harness sessions views are the real components, read from a
// query cache filled with fixed data. Nothing is fetched; an action that writes calls an agent that
// does not exist and shows the error of the real screen.
export const protoScope = { userId: 'prototype', tenantId: 'prototype', environmentId: 'prototype' };
export const protoAgentId = 'agent-refunds';

const connection = 'idp-acme-identity', issuerUrl = 'https://id.acme.test/realms/acme';
const asIssuer = 'https://acme.xokepoint.test/as/acme/production';

const client: AgentClient = {
  client_id: 'agent-refunds', issuer: asIssuer, token_endpoint: `${asIssuer}/token`, jwks_uri: `${asIssuer}/jwks`, revision: 7,
  key: { kid: 'refunds-2026-10', alg: 'ES256', thumbprint: 'Q3n8w0Yp1x6Kc2Tg9LrVb4HsZu7JmAeD5fNoIiWqXyE', created_by: 'u-beatriz', created_by_name: 'Beatriz Nunes', created_at: '2026-10-28T14:02:00Z' },
};

const harnesses: Harness[] = [
  { id: 'claude-code', name: 'Claude Code', icon: '/brands/claude-code.svg', client_id: 'https://claude.ai/oauth/claude-code-client-metadata' },
  { id: 'codex', name: 'Codex', icon: '/brands/codex.svg', client_id: 'https://chatgpt.com/oauth/codex/client.json' },
];

const allowlist: ClientAllowlist = { revision: 7, items: [
  { client_id: harnesses[0].client_id, client_name: 'Claude Code', other_agents: [{ id: 'agent-support', name: 'support-assistant' }] },
  { client_id: harnesses[1].client_id, client_name: null, other_agents: [] },
] };

const groups = [{ id: 'g-finance-ops', name: 'finance-ops', path: '/acme/finance-ops' }, { id: 'g-support-leads', name: 'support-leads', path: '/acme/support-leads' }];

const permissions: Configuration = {
  ...config,
  published: {
    scopes: [{ identity_connection_id: connection, kinds: ['person'], expires_at: null, consent: null, person_consent: { groups, default_validity_days: 30, max_validity_days: 90 } }],
    delegations: [], capabilities: [{ server_id: 'srv-acme-billing', tool: 'get_order', expires_at: null }, { server_id: 'srv-acme-billing', tool: 'refund_order', expires_at: null }, { server_id: 'srv-acme-billing', tool: 'list_refunds', expires_at: null }],
    resources: [], conditions: [], blocked: [],
  },
};

const consent = (id: string, subject: string, group: string, expires: string, count: number): InteractiveConsent => ({ id, agent_id: protoAgentId, identity_connection_id: connection, subject, group_ids: [group], expires_at: expires, state: 'active', created_at: '2026-11-01T12:00:00Z', grant_count: count });
const grant = (id: string, consentId: string, subject: string, h: Harness, binding: 'dpop' | 'none', created: string, used: string | null): InteractiveGrant => ({ id, consent_id: consentId, identity_connection_id: connection, subject, client_id: h.client_id, client_name: h.name, binding, state: 'active', created_at: created, last_used_at: used });

const sessions = {
  consents: [consent('c-ana', 'u-ana', 'g-finance-ops', '2026-12-01T12:00:00Z', 2), consent('c-diego', 'u-diego', 'g-support-leads', '2026-11-20T09:00:00Z', 1)],
  grants: [
    grant('g1', 'c-ana', 'u-ana', harnesses[0], 'dpop', '2026-11-01T12:03:00Z', '2026-11-06T10:41:00Z'),
    grant('g2', 'c-ana', 'u-ana', harnesses[1], 'none', '2026-11-03T16:20:00Z', '2026-11-05T19:02:00Z'),
    grant('g3', 'c-diego', 'u-diego', harnesses[0], 'dpop', '2026-11-04T08:15:00Z', null),
  ],
  issuers: new Map([[connection, issuerUrl]]),
  names: [{ issuer: issuerUrl, subject: 'u-ana', name: 'Ana Ribeiro' }, { issuer: issuerUrl, subject: 'u-diego', name: 'Diego Alves' }],
};

function seeded() {
  const q = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, gcTime: Infinity, retry: false, refetchOnMount: false, refetchOnWindowFocus: false }, mutations: { retry: false } } });
  q.setQueryData(agentClientKey(protoScope, protoAgentId), client);
  q.setQueryData(allowlistKey(protoScope, protoAgentId), allowlist);
  q.setQueryData(harnessCatalogKey, harnesses);
  q.setQueryData(delegationKey(protoScope, protoAgentId), permissions);
  q.setQueryData(['mcp-server-names', protoScope.userId, protoScope.tenantId, protoScope.environmentId], { items: [{ id: 'srv-acme-billing', name: 'Acme Billing' }] });
  q.setQueryData(sessionsKey(protoScope, protoAgentId), sessions);
  return q;
}

export function PrototypeQueries({ children }: { children: ReactNode }) {
  const [client] = useState(seeded);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
