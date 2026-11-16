import { httpClient, HttpError } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
import type { MCPToolAnnotations } from '../access/types';
export type ToolContract = { name: string; title?: string; description?: string; annotations?: MCPToolAnnotations; inputSchema: unknown; outputSchema?: unknown; [key: string]: unknown };
// Backend 097: the lethal trifecta label of a tool contract. The model gives one level per leg; an
// administrator's correction (operator) wins. A failed label has no model levels.
export type TrifectaLevel = 'none' | 'low' | 'high';
export type TrifectaLeg = 'private_data' | 'untrusted_content' | 'external_communication';
export type TrifectaLabel = { state: 'labeled' | 'failed'; model?: Record<TrifectaLeg, TrifectaLevel>; operator?: Partial<Record<TrifectaLeg, TrifectaLevel>> };
export type LevelCorrection = { tool: string; leg: TrifectaLeg; level: TrifectaLevel | null };
export type ManagedTool = { reviewed: boolean; name: string; contract: ToolContract; previous?: ToolContract; change: 'new' | 'changed' | 'removed' | 'unchanged'; selected: boolean; enabled: boolean;
 trifecta?: TrifectaLabel;
 // Backend 096, response only: the agents that grant the tool, its criticality order and whether a changed tool was denied before.
 granted_agents?: number; review_order?: number; denied_before?: boolean };
export type MCPServer = { id: string; name: string; endpoint: string; transport: string; auth_type: 'chokepoint_token'; enabled: boolean;
 // Backend 035: what a custom server must trust; read only, never sent back.
 audience?: string; issuer?: string; jwks_uri?: string; revision: number; server_info: unknown; tools: ManagedTool[] };
// A custom server has only the Xokepoint token auth type (Backend 035 Resolved Decision 3).
export type Connection = { name: string; endpoint: string; transport: string; auth_type: 'chokepoint_token'; revision?: number };
export type Preview = { preview_id: string; expires_at: string; server_info: unknown; tools: ManagedTool[]; revision: number };
export type ServerPage = { items: MCPServer[]; next_offset: number | null; total: number };
// Backend 096: the review history of a server and the impact of a disable.
export type ReviewDecision = { tool: string; decision: 'approved' | 'denied' | 'change_trusted' | 'kept_disabled' | 'disabled_changed' | 'disabled_removed' | 'level_corrected'; contract: ToolContract; contract_sha256: string;
 // Backend 097: a level correction names its leg and level (empty when the correction was removed).
 leg?: TrifectaLeg; level?: TrifectaLevel | '' };
export type ReviewEvent = { id: number; kind: 'review' | 'rediscovery'; server_revision: number; reviewer_id?: string; reviewer_name?: string; occurred_at: string; decisions: ReviewDecision[] };
export type ReviewHistoryPage = { items: ReviewEvent[]; next_offset: number | null };
export type Impact = { tools: number; agents: { id: string; name: string }[]; allowed_calls_24h: number };
export const pageSize = 10;
export const mcpKey = (s: EnvironmentScope) => ['mcp-servers', s.userId, s.tenantId, s.environmentId] as const;
const path = (s: EnvironmentScope): `/v1/${string}` => `/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/mcp-servers`;
export const mcpApi = {
 get: (s: EnvironmentScope, id: string, signal: AbortSignal) => httpClient<MCPServer>(`${path(s)}/${id}`, { signal }),
 list: (s: EnvironmentScope, offset: number, signal: AbortSignal) => httpClient<ServerPage>(`${path(s)}?offset=${offset}`, { signal }),
 // One page of the Integrations list, with the search that the backend runs (Admin 057, Backend 096).
 page: (s: EnvironmentScope, offset: number, q: string, signal: AbortSignal) => httpClient<ServerPage>(`${path(s)}?${new URLSearchParams({ limit: String(pageSize), offset: String(offset), ...(q ? { q } : {}) })}`, { signal }),
 reviewHistory: (s: EnvironmentScope, id: string, offset: number, signal: AbortSignal) => httpClient<ReviewHistoryPage>(`${path(s)}/${id}/review-history?offset=${offset}`, { signal }),
 impact: (s: EnvironmentScope, id: string, signal: AbortSignal) => httpClient<Impact>(`${path(s)}/${id}/impact`, { signal }),
 discover: (s: EnvironmentScope, id: string | undefined, input: Connection, signal: AbortSignal) => httpClient<Preview>(`${path(s)}${id ? `/${id}` : ''}/discover`, { method: 'POST', json: input, signal }),
 // Backend 097: the lethal trifecta levels corrected in the review travel with it.
 confirm: (s: EnvironmentScope, id: string | undefined, preview: Preview, selected: string[], enable: boolean, signal: AbortSignal, corrections: LevelCorrection[] = []) => httpClient<MCPServer>(`${path(s)}${id ? `/${id}/confirm` : ''}`, { method: 'POST', json: { preview_id: preview.preview_id, selected_tools: selected, enable, ...(corrections.length ? { trifecta_corrections: corrections } : {}) }, signal }),
 disable: (s: EnvironmentScope, server: MCPServer, signal: AbortSignal) => httpClient<MCPServer>(`${path(s)}/${server.id}/disable`, { method: 'POST', json: { revision: server.revision }, signal }),
};
export function mcpError(error: unknown) {
 if (error instanceof HttpError) {
  if (error.status === 409) return 'This review expired or the server changed. Open the review again.';
  if (error.status === 502) return 'Could not discover tools. Check the endpoint, authentication, and whether the backend can reach this server.';
  if (error.status === 400) return 'Check the connection fields and selected tools, then try again.';
  if (error.status === 404) return 'This server is not available in the current workspace and environment.';
  if (error.status === 429) return 'Discovery is busy. Try again shortly.';
 }
 return 'The request could not be completed. Check your connection and retry.';
}
