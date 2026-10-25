import { httpClient, HttpError } from '../../api/http-client';
import type { AgentScope } from '../access/agent-api';
import type { MCPToolAnnotations } from '../access/types';
export type ToolContract = { name: string; title?: string; description?: string; annotations?: MCPToolAnnotations; inputSchema: unknown; outputSchema?: unknown; [key: string]: unknown };
export type ManagedTool = { reviewed: boolean; name: string; contract: ToolContract; previous?: ToolContract; change: 'new' | 'changed' | 'removed' | 'unchanged'; selected: boolean; enabled: boolean };
export type MCPServer = { id: string; name: string; endpoint: string; transport: string; auth_type: 'none' | 'bearer'; token_configured: boolean; enabled: boolean; revision: number; server_info: unknown; tools: ManagedTool[] };
export type Connection = { name: string; endpoint: string; transport: string; auth_type: 'none' | 'bearer'; token?: string; revision?: number };
export type Preview = { preview_id: string; expires_at: string; server_info: unknown; tools: ManagedTool[]; revision: number };
export type ServerPage = { items: MCPServer[]; next_offset: number | null };
export const mcpKey = (s: AgentScope) => ['mcp-servers', s.userId, s.tenantId, s.environmentId] as const;
const path = (s: AgentScope): `/v1/${string}` => `/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/mcp-servers`;
export const mcpApi = {
 list: (s: AgentScope, offset: number, signal: AbortSignal) => httpClient<ServerPage>(`${path(s)}?offset=${offset}`, { signal }),
 discover: (s: AgentScope, id: string | undefined, input: Connection, signal: AbortSignal) => httpClient<Preview>(`${path(s)}${id ? `/${id}` : ''}/discover`, { method: 'POST', json: input, signal }),
 confirm: (s: AgentScope, id: string | undefined, preview: Preview, selected: string[], enable: boolean, signal: AbortSignal) => httpClient<MCPServer>(`${path(s)}${id ? `/${id}/confirm` : ''}`, { method: 'POST', json: { preview_id: preview.preview_id, selected_tools: selected, enable }, signal }),
 disable: (s: AgentScope, server: MCPServer, signal: AbortSignal) => httpClient<MCPServer>(`${path(s)}/${server.id}/disable`, { method: 'POST', json: { revision: server.revision }, signal }),
};
export function mcpError(error: unknown) {
 if (error instanceof HttpError) {
  if (error.status === 409) return 'This preview expired or the server changed. Close this dialog and discover again.';
  if (error.status === 502) return 'Could not discover tools. Check the endpoint, authentication, and whether the backend can reach this server.';
  if (error.status === 400) return 'Check the connection fields and selected tools, then try again.';
  if (error.status === 404) return 'This server is not available in the current workspace and environment.';
  if (error.status === 429) return 'Discovery is busy. Try again shortly.';
 }
 return 'The request could not be completed. Check your connection and retry.';
}
