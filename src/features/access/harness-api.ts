import { httpClient } from '../../api/http-client';
import type { EnvironmentScope } from './environment-scope';

// Harness login of an agent (Backend 045 Administration API 2, 3b and 5).
export type AgentLabel = { id: string; name: string };
// client_name comes from the cached client metadata document, null before the first login.
export type AllowedClient = { client_id: string; client_name: string | null; other_agents: AgentLabel[] };
export type ClientAllowlist = { revision: number; items: AllowedClient[] };
export type Harness = { id: string; name: string; icon: string; client_id: string };
export type InteractiveConsent = { id: string; agent_id: string; identity_connection_id: string; subject: string; group_ids: string[]; expires_at: string; state: 'active' | 'revoked' | 'expired'; created_at: string; revoked_at?: string; grant_count: number };
export type InteractiveGrant = { id: string; consent_id: string; identity_connection_id: string; subject: string; client_id: string; client_name: string | null; binding: 'dpop' | 'none'; state: 'active' | 'revoked' | 'expired'; created_at: string; last_used_at: string | null };

const environmentPath = (s: EnvironmentScope): `/v1/${string}` => `/v1/workspaces/${encodeURIComponent(s.tenantId)}/environments/${encodeURIComponent(s.environmentId)}`;
const agentPath = (s: EnvironmentScope, agentId: string): `/v1/${string}` => `${environmentPath(s)}/agents/${encodeURIComponent(agentId)}`;

export const allowlistKey = (s: EnvironmentScope, agentId: string) => ['agent-allowlist', s.userId, s.tenantId, s.environmentId, agentId] as const;
export const harnessCatalogKey = ['harness-catalog'] as const;
export const sessionsKey = (s: EnvironmentScope, agentId: string) => ['agent-harness-sessions', s.userId, s.tenantId, s.environmentId, agentId] as const;

export const harnessApi = {
  allowlist: (s: EnvironmentScope, agentId: string, signal: AbortSignal) => httpClient<ClientAllowlist>(`${agentPath(s, agentId)}/client/allowlist`, { signal }),
  // Replaces the allowlist when revision is current. The revision is shared with the agent key.
  saveAllowlist: (s: EnvironmentScope, agentId: string, clientIds: string[], revision: number) =>
    httpClient<ClientAllowlist>(`${agentPath(s, agentId)}/client/allowlist`, { method: 'PUT', json: { client_ids: clientIds, revision } }),
  catalog: (signal: AbortSignal) => httpClient<Harness[]>('/v1/platform/harness-catalog', { signal }),
  consents: (s: EnvironmentScope, agentId: string, signal: AbortSignal) => httpClient<{ items: InteractiveConsent[] }>(`${agentPath(s, agentId)}/consents`, { signal }),
  grants: (s: EnvironmentScope, agentId: string, signal: AbortSignal) => httpClient<{ items: InteractiveGrant[] }>(`${agentPath(s, agentId)}/grants`, { signal }),
  revokeConsent: (s: EnvironmentScope, agentId: string, consentId: string) => httpClient<void>(`${agentPath(s, agentId)}/consents/${encodeURIComponent(consentId)}`, { method: 'DELETE' }),
  revokeGrant: (s: EnvironmentScope, grantId: string) => httpClient<void>(`${environmentPath(s)}/grants/${encodeURIComponent(grantId)}`, { method: 'DELETE' }),
};

// The MCP URL of one server for developers: the ingress of the environment, the same origin as
// the issuer (Backend 030 Resolved Decision 15), then the server ID of the ingress path.
export const mcpServerUrl = (issuer: string, serverId: string) => `${issuer.replace(/\/as\/([^/]+)\/([^/]+)$/, '/api/v1/mcp/$1/$2')}/${serverId}`;
