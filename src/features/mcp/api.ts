import { httpClient, HttpError } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
import type { MCPToolAnnotations } from '../access/types';
export type ToolContract = { name: string; title?: string; description?: string; annotations?: MCPToolAnnotations; inputSchema: unknown; outputSchema?: unknown; [key: string]: unknown };
export type ManagedTool = { reviewed: boolean; name: string; contract: ToolContract; previous?: ToolContract; change: 'new' | 'changed' | 'removed' | 'unchanged'; selected: boolean; enabled: boolean };
export type MCPServer = { id: string; name: string; endpoint: string; transport: string; auth_type: 'chokepoint_token' | 'oauth'; connection_type?: 'custom' | 'enterprise'; provider_id?: string; account?: string; authentication_status?: string; enabled: boolean;
 // Backend 035: what a custom server must trust; read only, never sent back.
 audience?: string; issuer?: string; jwks_uri?: string; revision: number; server_info: unknown; tools: ManagedTool[] };
// A custom server has only the Xokepoint token auth type (Backend 035 Resolved Decision 3).
export type Connection = { name: string; endpoint: string; transport: string; auth_type: 'chokepoint_token'; revision?: number };
export type Preview = { preview_id: string; expires_at: string; server_info: unknown; tools: ManagedTool[]; revision: number };
export type ServerPage = { items: MCPServer[]; next_offset: number | null };
export const mcpKey = (s: EnvironmentScope) => ['mcp-servers', s.userId, s.tenantId, s.environmentId] as const;
const path = (s: EnvironmentScope): `/v1/${string}` => `/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/mcp-servers`;
export const mcpApi = {
 get: (s: EnvironmentScope, id: string, signal: AbortSignal) => httpClient<MCPServer>(`${path(s)}/${id}`, { signal }),
 list: (s: EnvironmentScope, offset: number, signal: AbortSignal) => httpClient<ServerPage>(`${path(s)}?offset=${offset}`, { signal }),
 discover: (s: EnvironmentScope, id: string | undefined, input: Connection, signal: AbortSignal) => httpClient<Preview>(`${path(s)}${id ? `/${id}` : ''}/discover`, { method: 'POST', json: input, signal }),
 confirm: (s: EnvironmentScope, id: string | undefined, preview: Preview, selected: string[], enable: boolean, signal: AbortSignal) => httpClient<MCPServer>(`${path(s)}${id ? `/${id}/confirm` : ''}`, { method: 'POST', json: { preview_id: preview.preview_id, selected_tools: selected, enable }, signal }),
 disable: (s: EnvironmentScope, server: MCPServer, signal: AbortSignal) => httpClient<MCPServer>(`${path(s)}/${server.id}/disable`, { method: 'POST', json: { revision: server.revision }, signal }),
};
export function mcpError(error: unknown) {
 if (error instanceof HttpError) {
  if (error.status === 409) return 'This preview expired or the server changed. Close this dialog and discover again.';
  if (error.status === 502) return 'Could not discover tools. Check the endpoint, authentication, and whether the backend can reach this server.';
  if (error.status === 400) return 'Check the connection fields and selected tools, then try again.';
  if (error.status === 404) return 'This server is not available in the current workspace and environment.';
  if (error.status === 422) return 'Provider authentication is unavailable. Reconnect the account.';
  if (error.status === 429) return 'Discovery is busy. Try again shortly.';
 }
 return 'The request could not be completed. Check your connection and retry.';
}
