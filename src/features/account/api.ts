import { httpClient } from '../../api/http-client';
import type { Workspace } from '../auth/AuthContext';

// Backend 084: the account and the workspaces of the signed-in person.
export type Account = { display_name: string; email: string };
export type DeletionPreview = { workspaces: { tenant_id: string; name: string; agent_count: number }[] };

export const accountKey = ['account', 'profile'] as const;
export const previewKey = ['account', 'deletion-preview'] as const;

export const accountApi = {
  get: (signal: AbortSignal) => httpClient<Account>('/v1/account', { signal }),
  rename: (displayName: string) => httpClient<Account>('/v1/account', { method: 'PATCH', json: { display_name: displayName } }),
  preview: (signal: AbortSignal) => httpClient<DeletionPreview>('/v1/account/deletion-preview', { signal }),
  remove: (confirmEmail: string) => httpClient<void>('/v1/account', { method: 'DELETE', json: { confirm_email: confirmEmail } }),
  createWorkspace: (name: string, key: string) => httpClient<Workspace>('/v1/workspaces', { method: 'POST', json: { name }, headers: { 'Idempotency-Key': key } }),
  renameWorkspace: (tenantId: string, name: string) => httpClient<Workspace>(`/v1/workspaces/${encodeURIComponent(tenantId)}`, { method: 'PATCH', json: { name } }),
  deleteWorkspace: (tenantId: string, confirmName: string) => httpClient<void>(`/v1/workspaces/${encodeURIComponent(tenantId)}`, { method: 'DELETE', json: { confirm_name: confirmName } }),
};
