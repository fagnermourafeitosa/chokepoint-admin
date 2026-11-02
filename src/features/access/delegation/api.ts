import { httpClient } from '../../../api/http-client';
import type { AgentScope } from '../agent-api';
import type { EnvironmentScope } from '../environment-scope';

// The agent permission document of Backend 033 (Admin contract 1). Times are RFC 3339 in UTC.
export type SubjectKind = 'person' | 'service';
export type ConsentRecord = { source: 'administrator'; recorded_by?: string; recorded_at?: string | null; recorded_by_name?: string };
export type ScopeRecord = { identity_connection_id: string; kinds: SubjectKind[]; expires_at: string | null; consent: ConsentRecord | null };
export type DelegationRecord = { identity_connection_id: string; subject: string; kind: SubjectKind };
export type CapabilityRecord = { server_id: string; tool: string; expires_at: string | null };
export type ResourceRecord = { server_id: string; type: string; id: string };
export type ConditionRecord = { id: string; name: string; server_id: string; tool: string; expression: string; required_bindings: string[]; required_limits: string[] };
export type PermissionDocument = { scopes: ScopeRecord[]; delegations: DelegationRecord[]; capabilities: CapabilityRecord[]; resources: ResourceRecord[]; conditions: ConditionRecord[] };
export type Reconciliation = { state: 'effective' | 'pending'; last_attempt_at?: string | null; last_error?: string };
export type Configuration = { agent_id: string; revision: number; draft?: PermissionDocument; published?: PermissionDocument; published_revision: number; effective_revision: number; reconciliation: Reconciliation };
// A resource that the effective mapping of a managed tool projects (Backend 037).
export type ServerResourceType = { tool: string; type: string; argument: string | null };

export const emptyDocument = (): PermissionDocument => ({ scopes: [], delegations: [], capabilities: [], resources: [], conditions: [] });
export const delegationKey = (s: AgentScope, id: string) => ['agent-permissions', s.userId, s.tenantId, s.environmentId, id] as const;
const path = (s: AgentScope, id: string): `/v1/${string}` => `/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/agents/${id}/permissions`;

// Edits stay in the browser until Review & publish saves the draft and publishes it (Admin 026 Resolved Decision 4).
export const permissionApi = {
  get: (s: AgentScope, id: string, signal: AbortSignal) => httpClient<Configuration>(path(s, id), { signal }),
  change: (s: AgentScope, id: string, action: 'draft' | 'publish' | 'discard', revision: number, document: PermissionDocument | undefined, signal: AbortSignal) =>
    httpClient<Configuration>(`${path(s, id)}/${action}`, { method: action === 'draft' ? 'PUT' : 'POST', json: { revision, ...(document ? { document } : {}) }, signal }),
};

export const resourceTypesApi = {
  list: (s: EnvironmentScope, serverId: string, signal: AbortSignal) => httpClient<{ items: ServerResourceType[] }>(`/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/mcp-servers/${encodeURIComponent(serverId)}/resource-types`, { signal }),
};
