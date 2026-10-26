import { HttpError, httpClient } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';

export type MappingDocument = Record<string, unknown>;
export type MappingVersion = { document: MappingDocument; schema_hash: string; revision: number };
export type MappingView = { tool_name: string; server_revision: number; schema_hash: string; source: 'default' | 'server' | 'local'; effective: MappingDocument; fallback_source: 'default' | 'server'; fallback: MappingDocument; local?: MappingVersion; draft?: MappingVersion; needs_review: boolean; can_approve: boolean };
export type MappingPreview = { sample_only: true; evaluations: unknown[] };
const path = (s: EnvironmentScope, serverId: string): `/v1/${string}` => `/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/mcp-servers/${encodeURIComponent(serverId)}/tool-mapping`;
export const mappingKey = (s: EnvironmentScope, id: string, name: string) => ['tool-mapping', s.userId, s.tenantId, s.environmentId, id, name] as const;

// All mapping operations use the existing authenticated same-origin client.
// Preview claims are explicitly sample data and never enter customer ingress.
export const mappingApi = {
 get: (s: EnvironmentScope, id: string, name: string, signal: AbortSignal) => httpClient<MappingView>(`${path(s, id)}?tool_name=${encodeURIComponent(name)}`, { signal }),
 save: (s: EnvironmentScope, id: string, name: string, revision: number, mapping: MappingDocument, signal: AbortSignal) => httpClient<MappingView>(`${path(s, id)}/draft`, { method: 'PUT', json: { tool_name: name, revision, mapping }, signal }),
 change: (s: EnvironmentScope, id: string, name: string, revision: number, action: 'approve' | 'remove' | 'discard', signal: AbortSignal) => httpClient<MappingView>(`${path(s, id)}/${action === 'discard' ? 'draft' : action}`, { method: action === 'discard' ? 'DELETE' : 'POST', json: { tool_name: name, revision }, signal }),
 preview: (s: EnvironmentScope, id: string, name: string, revision: number, mapping: MappingDocument, args: unknown, claims: unknown, signal: AbortSignal) => httpClient<MappingPreview>(`${path(s, id)}/preview`, { method: 'POST', json: { tool_name: name, revision, mapping, arguments: args, sample_claims: claims }, signal }),
};

export function mappingError(error: unknown) {
 if (error instanceof HttpError) {
  if (error.status === 409) return 'The server or schema changed. Reload the current mapping before reviewing again.';
  if (error.status === 400) return 'Check the mapping structure, CEL expressions and required sample values. Subject identity must use $token.sub.';
  if (error.status === 404) return 'This tool is not available in the selected workspace and environment.';
 }
 return 'The mapping request could not be completed. Retry when the service is available.';
}
