import { httpClient } from '../../api/http-client';
import type { AgentScope } from '../access/agent-api';

export type MemberKind = 'person' | 'service';
// The kind labels a member; its identity is the issuer and subject.
export type Member = { issuer: string; subject: string; kind: MemberKind };
// A member is identified by issuer and subject alone; places that only look one up do not need its kind.
export type MemberIdentity = Pick<Member, 'issuer' | 'subject'>;
export type Grant = { server_id: string; tools: string[] };
export type Policy = { id: string; name: string; server_id: string; tool_name?: string; expression: string; required_bindings: string[] };
export type PermissionDocument = { members: Member[]; grants: Grant[]; policies: Policy[] };
export type Configuration = { agent_id: string; revision: number; draft?: PermissionDocument; published?: PermissionDocument };
export const emptyDocument = (): PermissionDocument => ({ members: [], grants: [], policies: [] });
export const permissionKey = (s: AgentScope, id: string) => ['permissions', s.userId, s.tenantId, s.environmentId, id] as const;
const path = (s: AgentScope, id: string): `/v1/${string}` => `/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/agents/${id}/permissions`;
// Nested CRUD edits a revisioned draft. Only publish and revoke change runtime state.
export const permissionApi = {
  get: (s: AgentScope, id: string, signal: AbortSignal) => httpClient<Configuration>(path(s, id), { signal }),
  change: (s: AgentScope, id: string, action: 'draft' | 'publish' | 'discard' | 'revoke', revision: number, document: PermissionDocument | undefined, signal: AbortSignal) =>
    httpClient<Configuration>(`${path(s, id)}${action === 'revoke' ? '' : `/${action}`}`, { method: action === 'draft' ? 'PUT' : action === 'revoke' ? 'DELETE' : 'POST', json: { revision, ...(document ? { document } : {}) }, signal }),
};
