import { httpClient, HttpError } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';

export type DirectorySettings = { base_url: string; token_url: string; client_id: string; issuing_client_id: string; client_secret?: string; has_secret: boolean; check_status: 'not_checked' | 'verified' | 'failed'; checked_at: string | null };
export type IdentityFields = { provider: string; name: string; issuer: string; audiences: string[]; groups_claim: string; enabled: boolean; revision: number; directory: DirectorySettings | null };
export type IdentityConnection = IdentityFields & { id: string; created_at: string; updated_at: string; checked_at: string | null; check_status: 'not_checked' | 'verified' | 'failed' };
export type IdentityPage = { items: IdentityConnection[]; next_offset: number | null };
export type ProviderCapability = { provider: string; name: string; available: boolean; directory: boolean; runtime_identity: boolean; lifecycle: boolean };
export type DirectoryIdentity = { issuer: string; subject: string };
export type DirectoryUser = { identity: DirectoryIdentity; id: string; user_name: string; display_name: string; email?: string; given_name?: string; family_name?: string; active: boolean | null };
export type DirectoryPage = { items: DirectoryUser[]; total: number; start_index: number; next_start: number | null };
export const identityKey = (s: EnvironmentScope) => ['identity-connections', s.userId, s.tenantId, s.environmentId] as const;
const path = (s: EnvironmentScope): `/v1/${string}` => `/v1/workspaces/${encodeURIComponent(s.tenantId)}/environments/${encodeURIComponent(s.environmentId)}/identity-connections`;
export const identityApi = {
 list: (s: EnvironmentScope, offset: number, signal: AbortSignal) => httpClient<IdentityPage>(`${path(s)}?offset=${offset}`, { signal }),
 providers: (s: EnvironmentScope, signal: AbortSignal) => httpClient<ProviderCapability[]>(`${path(s)}/providers`, { signal }),
 save: (s: EnvironmentScope, id: string | undefined, input: IdentityFields, signal: AbortSignal) => httpClient<IdentityConnection>(`${path(s)}${id ? `/${encodeURIComponent(id)}` : ''}`, { method: id ? 'PUT' : 'POST', json: input, signal }),
 check: (s: EnvironmentScope, id: string | undefined, input: IdentityFields, signal: AbortSignal) => httpClient<IdentityConnection>(`${path(s)}${id ? `/${encodeURIComponent(id)}` : ''}/check`, { method: 'POST', json: input, signal }),
 directoryCheck: (s: EnvironmentScope, id: string | undefined, input: IdentityFields, signal: AbortSignal) => httpClient<DirectorySettings>(`${path(s)}${id ? `/${encodeURIComponent(id)}` : ''}/directory-check`, { method: 'POST', json: input, signal }),
 users: (s: EnvironmentScope, id: string, search: string, start: number, signal: AbortSignal) => httpClient<DirectoryPage>(`${path(s)}/${encodeURIComponent(id)}/users?${new URLSearchParams({ q: search, start: String(start) })}`, { signal }),
 user: (s: EnvironmentScope, id: string, user: string, signal: AbortSignal) => httpClient<DirectoryUser>(`${path(s)}/${encodeURIComponent(id)}/users/${encodeURIComponent(user)}`, { signal }),
 remove: (s: EnvironmentScope, c: IdentityConnection, signal: AbortSignal) => httpClient<void>(`${path(s)}/${encodeURIComponent(c.id)}`, { method: 'DELETE', json: { revision: c.revision }, signal }),
};
export function identityError(error: unknown): string {
 if (error instanceof HttpError) {
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
