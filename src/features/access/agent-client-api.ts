import { httpClient } from '../../api/http-client';
import type { EnvironmentScope } from './environment-scope';

// The agent as a client of the Xokepoint authorization server (Backend 030 Admin contract, Backend 040).
export type ClientKey = { kid: string; alg: 'ES256' | 'RS256'; thumbprint: string; created_by: string; created_by_name?: string; created_at: string };
export type AgentClient = { client_id: string; issuer: string; token_endpoint: string; jwks_uri: string; revision: number; key: ClientKey | null };
export type AuthorizationServer = { issuer: string; token_endpoint: string; jwks_uri: string };

const environmentPath = (s: EnvironmentScope): `/v1/${string}` => `/v1/workspaces/${encodeURIComponent(s.tenantId)}/environments/${encodeURIComponent(s.environmentId)}`;
const clientPath = (s: EnvironmentScope, agentId: string): `/v1/${string}` => `${environmentPath(s)}/agents/${encodeURIComponent(agentId)}/client`;

export const agentClientKey = (s: EnvironmentScope, agentId: string) => ['agent-client', s.userId, s.tenantId, s.environmentId, agentId] as const;
export const authorizationServerKey = (s: EnvironmentScope) => ['authorization-server', s.userId, s.tenantId, s.environmentId] as const;

export const agentClientApi = {
  get: (s: EnvironmentScope, agentId: string, signal: AbortSignal) => httpClient<AgentClient>(clientPath(s, agentId), { signal }),
  // Registers or replaces the public key. The previous key stops working at once (one key for each agent).
  saveKey: (s: EnvironmentScope, agentId: string, publicJwk: JsonWebKey, kid: string | undefined, revision: number) =>
    httpClient<AgentClient>(`${clientPath(s, agentId)}/key`, { method: 'PUT', json: { public_jwk: publicJwk, ...(kid ? { kid } : {}), revision } }),
  // What a custom MCP server must trust, before the server is saved (Backend 040).
  authorizationServer: (s: EnvironmentScope, signal: AbortSignal) => httpClient<AuthorizationServer>(`${environmentPath(s)}/authorization-server`, { signal }),
};
