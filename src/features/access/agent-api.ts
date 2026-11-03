import { httpClient } from '../../api/http-client';
import type { AgentIconKey } from './agent-icons';

export type AgentRecord = {
  id: string;
  tenant_id: string;
  environment_id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  visual_kind: 'icon' | 'image';
  icon_key: AgentIconKey | null;
  image_revision: string;
  // Backend 032: the revision advances on every change; the status is the kill switch.
  revision: number;
  status: AgentStatus;
  status_changed_by: string | null;
  status_changed_at: string | null;
};
export type AgentStatus = 'active' | 'disabled';
export type AgentPage = { items: AgentRecord[]; next_offset: number | null };
export type AgentScope = { userId: string; tenantId: string; environmentId: string };
export type AgentFields = { name: string; description: string; icon_key?: AgentIconKey };
export const agentKey = (scope: AgentScope) => ['agents', scope.userId, scope.tenantId, scope.environmentId] as const;
export const agentPath = (scope: AgentScope): `/v1/${string}` => `/v1/workspaces/${encodeURIComponent(scope.tenantId)}/environments/${encodeURIComponent(scope.environmentId)}/agents`;
export const agentApi = {
  list: (scope: AgentScope, offset: number, signal: AbortSignal) => httpClient<AgentPage>(`${agentPath(scope)}?offset=${offset}`, { signal }),
  get: (scope: AgentScope, id: string, signal: AbortSignal) => httpClient<AgentRecord>(`${agentPath(scope)}/${encodeURIComponent(id)}`, { signal }),
  create: (scope: AgentScope, input: AgentFields) => httpClient<AgentRecord>(agentPath(scope), { method: 'POST', json: input }),
  update: (scope: AgentScope, id: string, input: AgentFields) => httpClient<AgentRecord>(`${agentPath(scope)}/${encodeURIComponent(id)}`, { method: 'PATCH', json: input }),
  // Backend 038: a soft delete with the agent revision; it revokes all access first.
  remove: (scope: AgentScope, id: string, revision: number) => httpClient<void>(`${agentPath(scope)}/${encodeURIComponent(id)}`, { method: 'DELETE', json: { revision } }),
  upload: (scope: AgentScope, id: string, file: File) => {
    const form = new FormData(); form.set('image', file);
    return httpClient<AgentRecord>(`${agentPath(scope)}/${encodeURIComponent(id)}/image`, { method: 'PUT', form });
  },
  // A disable applies to the next token exchange and the next call (Backend 032 Resolved Decision 2).
  setStatus: (scope: AgentScope, id: string, status: AgentStatus, revision: number) => httpClient<AgentRecord>(`${agentPath(scope)}/${encodeURIComponent(id)}/${status === 'disabled' ? 'disable' : 'enable'}`, { method: 'POST', json: { revision } }),
  image: (scope: AgentScope, id: string, signal: AbortSignal) => httpClient<Blob>(`${agentPath(scope)}/${encodeURIComponent(id)}/image`, { signal, responseType: 'blob' }),
};
