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
};
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
  remove: (scope: AgentScope, id: string) => httpClient<void>(`${agentPath(scope)}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  upload: (scope: AgentScope, id: string, file: File) => {
    const form = new FormData(); form.set('image', file);
    return httpClient<AgentRecord>(`${agentPath(scope)}/${encodeURIComponent(id)}/image`, { method: 'PUT', form });
  },
  image: (scope: AgentScope, id: string, signal: AbortSignal) => httpClient<Blob>(`${agentPath(scope)}/${encodeURIComponent(id)}/image`, { signal, responseType: 'blob' }),
};
