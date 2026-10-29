import { httpClient } from '../../../api/http-client';
import type { EnvironmentScope } from '../../access/environment-scope';
import type { MCPServer, Preview } from '../api';
export type Provider = { id: string; name: string; description: string; available: boolean };
export type ApplicationStatus = { client_id: string; configured: boolean; revision: number; callback_url: string };
export type ApplicationInput = { client_id: string; client_secret: string; revision: number };
export type EnterprisePreview = { server: MCPServer; preview: Preview; existing_id?: string };
export type ConnectionSummary = Pick<MCPServer, 'id' | 'name' | 'endpoint' | 'connection_type' | 'provider_id' | 'account' | 'authentication_status' | 'enabled' | 'revision'> & { review_required: boolean };
const path = (s: EnvironmentScope): `/v1/${string}` => `/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/mcp-servers`;
export const enterpriseApi = {
  connection: (s: EnvironmentScope, provider: string, signal: AbortSignal) => httpClient<{ connection: MCPServer | null }>(`${path(s)}/providers/${provider}/connection`, { signal }),
  application: (s: EnvironmentScope, provider: string, signal: AbortSignal) => httpClient<ApplicationStatus>(`${path(s)}/providers/${provider}/application`, { signal }),
  saveApplication: (s: EnvironmentScope, provider: string, input: ApplicationInput, signal: AbortSignal) => httpClient<ApplicationStatus>(`${path(s)}/providers/${provider}/application`, { method: 'PUT', json: input, signal }),
  providers: (s: EnvironmentScope, signal: AbortSignal) => httpClient<{ items: Provider[] }>(`${path(s)}/providers`, { signal }),
  start: (s: EnvironmentScope, provider: string, server: MCPServer | undefined, signal: AbortSignal) => httpClient<{ authorization_url: string }>(`${path(s)}/enterprise/start`, { method: 'POST', json: { provider_id: provider, ...(server ? { server_id: server.id, revision: server.revision } : {}) }, signal }),
  preview: (s: EnvironmentScope, id: string, signal: AbortSignal) => httpClient<EnterprisePreview>(`${path(s)}/enterprise/previews/${id}`, { signal }),
  summaries: (s: EnvironmentScope, offset: number, signal: AbortSignal) => httpClient<{ items: ConnectionSummary[]; next_offset: number | null }>(`${path(s)}/summaries?offset=${offset}`, { signal }),
};
