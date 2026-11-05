import { httpClient } from '../../../api/http-client';
import type { AgentScope } from '../agent-api';
import type { EnvironmentScope } from '../environment-scope';

// The agent permission document of Backend 033 (Admin contract 1). Times are RFC 3339 in UTC.
export type SubjectKind = 'person' | 'service';
export type ConsentRecord = { source: 'administrator'; recorded_by?: string; recorded_at?: string | null; recorded_by_name?: string };
// person_consent lets members of the chosen IdP groups consent at a harness login (Backend 045
// Administration API 3). null disables it. groups has at least one entry when published.
export type ConsentGroupRecord = { id: string; name: string; path?: string };
export type PersonConsentRecord = { groups: ConsentGroupRecord[]; default_validity_days: number; max_validity_days: number };
export type ScopeRecord = { identity_connection_id: string; kinds: SubjectKind[]; expires_at: string | null; consent: ConsentRecord | null; person_consent?: PersonConsentRecord | null };
// A person vetoed on the agent (Backend 045 Administration API 4).
export type BlockedRecord = { identity_connection_id: string; subject: string; reason?: string };
export type DelegationRecord = { identity_connection_id: string; subject: string; kind: SubjectKind };
export type CapabilityRecord = { server_id: string; tool: string; expires_at: string | null };
export type ResourceRecord = { server_id: string; type: string; id: string };
export type ConditionRecord = { id: string; name: string; server_id: string; tool: string; expression: string; required_bindings: string[]; required_limits: string[] };
export type PermissionDocument = { scopes: ScopeRecord[]; delegations: DelegationRecord[]; capabilities: CapabilityRecord[]; resources: ResourceRecord[]; conditions: ConditionRecord[]; blocked?: BlockedRecord[] };
export type Reconciliation = { state: 'effective' | 'pending'; last_attempt_at?: string | null; last_error?: string };
// published_by, published_by_name, published_at and note describe the latest published or
// revoked revision, all null before the first publication (Backend 038).
export type Configuration = { agent_id: string; revision: number; draft?: PermissionDocument; published?: PermissionDocument; published_revision: number; effective_revision: number; reconciliation: Reconciliation; published_by: string | null; published_by_name: string | null; published_at: string | null; note: string | null };
// One published or revoked revision of the history (Backend 038). document is set only by the read of one revision.
// Backend 057: the history also lists mode changes (kind enforcement), which have no revision number.
export type Revision = { kind?: 'revision' | 'enforcement'; revision: number; action: 'publish' | 'revoke' | 'enforcement'; published_by: string; published_by_name?: string; published_at: string; effective_at: string | null; note: string | null; document?: PermissionDocument; from?: 'enforce' | 'report_only'; to?: 'enforce' | 'report_only'; review_by?: string };
export type RevisionPage = { items: Revision[]; total: number; page: number; page_size: number };
// A resource that the effective mapping of a managed tool projects (Backend 037).
export type ServerResourceType = { tool: string; type: string; argument: string | null };

export const emptyDocument = (): PermissionDocument => ({ scopes: [], delegations: [], capabilities: [], resources: [], conditions: [], blocked: [] });
export const delegationKey = (s: AgentScope, id: string) => ['agent-permissions', s.userId, s.tenantId, s.environmentId, id] as const;
export const revisionsKey = (s: AgentScope, id: string) => [...delegationKey(s, id), 'revisions'] as const;
const path = (s: AgentScope, id: string): `/v1/${string}` => `/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/agents/${id}/permissions`;

// Edits stay in the browser until Review & publish saves the draft and publishes it (Admin 026 Resolved Decision 4).
export const permissionApi = {
  get: (s: AgentScope, id: string, signal: AbortSignal) => httpClient<Configuration>(path(s, id), { signal }),
  // note is the optional reason of a publication (Backend 038).
  change: (s: AgentScope, id: string, action: 'draft' | 'publish' | 'discard', revision: number, document: PermissionDocument | undefined, signal: AbortSignal, note?: string) =>
    httpClient<Configuration>(`${path(s, id)}/${action}`, { method: action === 'draft' ? 'PUT' : 'POST', json: { revision, ...(document ? { document } : {}), ...(note ? { note } : {}) }, signal }),
  revisions: (s: AgentScope, id: string, page: number, signal: AbortSignal) => httpClient<RevisionPage>(`${path(s, id)}/revisions?page=${page}&page_size=20`, { signal }),
  revision: (s: AgentScope, id: string, revision: number, signal: AbortSignal) => httpClient<Revision>(`${path(s, id)}/revisions/${revision}`, { signal }),
};

export const resourceTypesApi = {
  list: (s: EnvironmentScope, serverId: string, signal: AbortSignal) => httpClient<{ items: ServerResourceType[] }>(`/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/mcp-servers/${encodeURIComponent(serverId)}/resource-types`, { signal }),
};
