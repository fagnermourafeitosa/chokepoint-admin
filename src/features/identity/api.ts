import { httpClient, HttpError } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';

export type DirectorySettings = { client_id: string; issuing_client_id: string; client_secret?: string; has_secret: boolean; check_status: 'not_checked' | 'verified' | 'failed'; checked_at: string | null };
export type IssuingClient = { client_id: string; name?: string };
// The directory check result lists the Keycloak clients that can issue user tokens (Backend 019).
export type DirectoryCheck = DirectorySettings & { issuing_clients?: IssuingClient[]; truncated?: boolean };
export type IdentityFields = { provider: string; name: string; issuer: string; audiences: string[]; groups_claim: string; enabled: boolean; revision: number; directory: DirectorySettings | null };
export type IdentityConnection = IdentityFields & { id: string; created_at: string; updated_at: string; checked_at: string | null; check_status: 'not_checked' | 'verified' | 'failed' };
export type IdentityPage = { items: IdentityConnection[]; next_offset: number | null };
export type ProviderCapability = { provider: string; name: string; available: boolean; directory: boolean; runtime_identity: boolean; lifecycle: boolean };
export type DirectoryIdentity = { issuer: string; subject: string };
export type DirectoryUser = { identity: DirectoryIdentity; id: string; user_name: string; display_name: string; email?: string; given_name?: string; family_name?: string; active: boolean | null };
export type DirectoryPage = { items: DirectoryUser[]; total: number; start_index: number; next_start: number | null };
// Retained lifecycle state from Backend 016. Identities without events are absent.
export type LifecycleUserState = DirectoryIdentity & { display_name?: string; user_name?: string; email?: string; disabled: boolean; disabled_at: string | null; source_deleted: boolean; updated_at: string };
export const identityKey = (s: EnvironmentScope) => ['identity-connections', s.userId, s.tenantId, s.environmentId] as const;
const path = (s: EnvironmentScope): `/v1/${string}` => `/v1/workspaces/${encodeURIComponent(s.tenantId)}/environments/${encodeURIComponent(s.environmentId)}/identity-connections`;
export const identityApi = {
 list: (s: EnvironmentScope, offset: number, signal: AbortSignal) => httpClient<IdentityPage>(`${path(s)}?offset=${offset}`, { signal }),
 providers: (s: EnvironmentScope, signal: AbortSignal) => httpClient<ProviderCapability[]>(`${path(s)}/providers`, { signal }),
 save: (s: EnvironmentScope, id: string | undefined, input: IdentityFields, signal: AbortSignal) => httpClient<IdentityConnection>(`${path(s)}${id ? `/${encodeURIComponent(id)}` : ''}`, { method: id ? 'PUT' : 'POST', json: input, signal }),
 check: (s: EnvironmentScope, id: string | undefined, input: IdentityFields, signal: AbortSignal) => httpClient<IdentityConnection>(`${path(s)}${id ? `/${encodeURIComponent(id)}` : ''}/check`, { method: 'POST', json: input, signal }),
 directoryCheck: (s: EnvironmentScope, id: string | undefined, input: IdentityFields, signal: AbortSignal) => httpClient<DirectoryCheck>(`${path(s)}${id ? `/${encodeURIComponent(id)}` : ''}/directory-check`, { method: 'POST', json: input, signal }),
 users: (s: EnvironmentScope, id: string, search: string, start: number, signal: AbortSignal) => httpClient<DirectoryPage>(`${path(s)}/${encodeURIComponent(id)}/users?${new URLSearchParams({ q: search, start: String(start) })}`, { signal }),
 user: (s: EnvironmentScope, id: string, user: string, signal: AbortSignal) => httpClient<DirectoryUser>(`${path(s)}/${encodeURIComponent(id)}/users/${encodeURIComponent(user)}`, { signal }),
 lifecycleUsers: (s: EnvironmentScope, identities: DirectoryIdentity[], signal: AbortSignal) => httpClient<{ items: LifecycleUserState[] }>(`/v1/workspaces/${encodeURIComponent(s.tenantId)}/environments/${encodeURIComponent(s.environmentId)}/identity-lifecycle-users/lookup`, { method: 'POST', json: { identities }, signal }),
 remove: (s: EnvironmentScope, c: IdentityConnection, signal: AbortSignal) => httpClient<void>(`${path(s)}/${encodeURIComponent(c.id)}`, { method: 'DELETE', json: { revision: c.revision }, signal }),
};
export function identityError(error: unknown): string {
 if (error instanceof HttpError) {
  if (error.status === 422 && error.code === 'clients_unavailable') return 'Cannot read the Keycloak clients. Grant the service account the realm-management role view-clients, then check the connection again.';
  if (error.status === 422) return 'Cannot verify Keycloak directory and administrative access. Check the connection and network, grant the service account the realm-management roles view-users and view-clients (or equivalent), and ensure the directory contains a user.';
  if (error.status === 400) return 'Check the connection and directory fields.';
  if (error.status === 404) return 'This connection or user is no longer available.';
  if (error.status === 409) return 'The connection changed, or this issuer is already registered. Reload and retry.';
  if (error.status === 501) return 'This provider is not available yet.';
  if (error.status === 502) return 'Could not verify this provider. Check its settings and network access.';
  if (error.status === 429) return 'Configuration checks are busy. Try again shortly.';
 }
 return 'The request could not be completed. Retry when the service is available.';
}
// Lifecycle receiver state from Backend 016. The secret is present only in the
// create and rotate responses; rotation evidence only while a rotation runs.
export type LifecycleConfiguration = {
 configured: boolean; enabled: boolean; receiver_url?: string; rotation_in_progress: boolean; secret?: string;
 last_committed_at: string | null; last_failure_at: string | null; last_failure_code?: string;
 previous_secret_last_accepted_at?: string; current_secret_first_accepted_at?: string;
};
const lifecyclePath = (s: EnvironmentScope, id: string): `/v1/${string}` => `${path(s)}/${encodeURIComponent(id)}/lifecycle`;
export const lifecycleKey = (s: EnvironmentScope, id: string) => [...identityKey(s), id, 'lifecycle'] as const;
export const lifecycleApi = {
 get: (s: EnvironmentScope, id: string, signal: AbortSignal) => httpClient<LifecycleConfiguration>(lifecyclePath(s, id), { signal }),
 create: (s: EnvironmentScope, id: string, signal: AbortSignal) => httpClient<LifecycleConfiguration>(lifecyclePath(s, id), { method: 'POST', signal }),
 rotate: (s: EnvironmentScope, id: string, signal: AbortSignal) => httpClient<LifecycleConfiguration>(`${lifecyclePath(s, id)}/rotate-secret`, { method: 'POST', signal }),
 complete: (s: EnvironmentScope, id: string, signal: AbortSignal) => httpClient<LifecycleConfiguration>(`${lifecyclePath(s, id)}/complete-rotation`, { method: 'POST', signal }),
 remove: (s: EnvironmentScope, id: string, signal: AbortSignal) => httpClient<LifecycleConfiguration>(lifecyclePath(s, id), { method: 'DELETE', signal }),
};
