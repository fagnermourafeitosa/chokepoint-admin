import { httpClient, HttpError } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';

// delegated_admin, domain and customer_id are the Google Workspace settings (Backend 026). customer_id is read by the check, not typed.
// private_key is the write-only private JWK of an Okta API Services app (Backend 059 Protocol contract 2).
export type DirectorySettings = { client_id: string; issuing_client_id: string; client_secret?: string; private_key?: string; has_secret: boolean; delegated_admin?: string; domain?: string; customer_id?: string; check_status: 'not_checked' | 'verified' | 'failed'; checked_at: string | null };
export type IssuingClient = { client_id: string; name?: string };
// The directory check result lists the Keycloak clients that can issue user tokens (Backend 019).
// groups_readable is absent for a provider without the groups capability (Backend 045).
export type DirectoryCheck = DirectorySettings & { issuing_clients?: IssuingClient[]; truncated?: boolean; groups_readable?: boolean };
// The harness login client (Backend 045 Administration API 1). client_secret is write-only;
// the read returns has_secret and the redirect URI to register at the provider. null removes the client.
export type LoginSettings = { enabled: boolean; client_id: string; client_secret?: string; has_secret?: boolean; redirect_uri?: string };
// token_issuer is the custom authorization server of an Okta connection (Backend 059, 060); the backend derives it for Entra.
export type IdentityFields = { provider: string; name: string; issuer: string; audiences: string[]; enabled: boolean; revision: number; directory: DirectorySettings | null; login: LoginSettings | null; token_issuer?: string };
export type IdentityConnection = Omit<IdentityFields, 'login'> & { login: LoginSettings | null; id: string; created_at: string; updated_at: string; checked_at: string | null; check_status: 'not_checked' | 'verified' | 'failed' };
export type IdentityPage = { items: IdentityConnection[]; next_offset: number | null };
export type ProviderCapability = { provider: string; name: string; available: boolean; directory: boolean; runtime_identity: boolean; groups: boolean };
// A directory group (Backend 045 Resolved Decision 26). id is the match key; path is set for nested groups (Keycloak).
export type DirectoryGroup = { id: string; name: string; path?: string };
export type GroupPage = { items: DirectoryGroup[]; next_cursor: string | null };
export type DirectoryIdentity = { issuer: string; subject: string };
export type DirectoryUser = { kind: 'person' | 'service'; identity: DirectoryIdentity; id: string; user_name: string; display_name: string; email?: string; given_name?: string; family_name?: string; active: boolean | null };
// Service principals of one connection (Backend 027), for example Keycloak clients with service accounts. truncated means the provider has more.
export type ServicePage = { items: DirectoryUser[]; truncated: boolean };
// total is null when the provider reports none (Google). next_cursor is opaque and null on the last page (Backend 026).
export type DirectoryPage = { items: DirectoryUser[]; total: number | null; next_cursor: string | null };
export type PrincipalName = DirectoryIdentity & { name: string };
export const nameLookupLimit = 200;
export const identityKey = (s: EnvironmentScope) => ['identity-connections', s.userId, s.tenantId, s.environmentId] as const;
const path = (s: EnvironmentScope): `/v1/${string}` => `/v1/workspaces/${encodeURIComponent(s.tenantId)}/environments/${encodeURIComponent(s.environmentId)}/identity-connections`;
export const identityApi = {
 list: (s: EnvironmentScope, offset: number, signal: AbortSignal) => httpClient<IdentityPage>(`${path(s)}?offset=${offset}`, { signal }),
 providers: (s: EnvironmentScope, signal: AbortSignal) => httpClient<ProviderCapability[]>(`${path(s)}/providers`, { signal }),
 save: (s: EnvironmentScope, id: string | undefined, input: IdentityFields, signal: AbortSignal) => httpClient<IdentityConnection>(`${path(s)}${id ? `/${encodeURIComponent(id)}` : ''}`, { method: id ? 'PUT' : 'POST', json: input, signal }),
 check: (s: EnvironmentScope, id: string | undefined, input: IdentityFields, signal: AbortSignal) => httpClient<IdentityConnection>(`${path(s)}${id ? `/${encodeURIComponent(id)}` : ''}/check`, { method: 'POST', json: input, signal }),
 directoryCheck: (s: EnvironmentScope, id: string | undefined, input: IdentityFields, signal: AbortSignal) => httpClient<DirectoryCheck>(`${path(s)}${id ? `/${encodeURIComponent(id)}` : ''}/directory-check`, { method: 'POST', json: input, signal }),
 users: (s: EnvironmentScope, id: string, search: string, cursor: string, signal: AbortSignal) => httpClient<DirectoryPage>(`${path(s)}/${encodeURIComponent(id)}/users?${new URLSearchParams(cursor ? { q: search, cursor } : { q: search })}`, { signal }),
 services: (s: EnvironmentScope, id: string, signal: AbortSignal) => httpClient<ServicePage>(`${path(s)}/${encodeURIComponent(id)}/services`, { signal }),
 user: (s: EnvironmentScope, id: string, user: string, signal: AbortSignal) => httpClient<DirectoryUser>(`${path(s)}/${encodeURIComponent(id)}/users/${encodeURIComponent(user)}`, { signal }),
 // Current directory names of exact identities, at most nameLookupLimit per request; an unreadable name is absent.
 names: (s: EnvironmentScope, identities: DirectoryIdentity[], signal: AbortSignal) => httpClient<{ items: PrincipalName[] }>(`${path(s)}/names`, { method: 'POST', json: { identities }, signal }),
 // One page of directory groups, or the chosen groups found by ids (Backend 045 Administration API 3a).
 groups: (s: EnvironmentScope, id: string, query: { q?: string; cursor?: string; ids?: string[] }, signal: AbortSignal) => {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.ids?.length) params.set('ids', query.ids.join(','));
  return httpClient<GroupPage>(`${path(s)}/${encodeURIComponent(id)}/groups?${params}`, { signal });
 },
 remove: (s: EnvironmentScope, c: IdentityConnection, signal: AbortSignal) => httpClient<void>(`${path(s)}/${encodeURIComponent(c.id)}`, { method: 'DELETE', json: { revision: c.revision }, signal }),
};
const entraErrors: Record<string, string> = {
 entra_tenant_not_found: 'Microsoft Entra does not know this tenant ID. Copy the Directory (tenant) ID from the app Overview.',
 entra_client_not_found: 'This application is not in the tenant. Check the Application (client) ID and the tenant ID.',
 entra_secret_invalid: 'Microsoft Entra rejected the secret. Paste the secret Value, not the Secret ID.',
 entra_secret_expired: 'The client secret expired. Create a new secret (step 2) and paste its value.',
 entra_permission_missing: 'The app can not read users. Add User.Read.All and grant admin consent (step 3).',
 entra_member_groups_denied: 'Microsoft Entra does not let the app read the groups of a person with GroupMember.Read.All. Add the Microsoft Graph application permission Directory.Read.All, grant admin consent, then check the connection again.',
};
// Okta setup errors (Admin 043 Solution 6, Backend 059 Protocol contract 11).
const oktaErrors: Record<string, string> = {
 okta_org_not_found: 'Could not read this Okta org. Check the org URL: https://acme.okta.com or your custom domain, without "-admin".',
 okta_authorization_server_not_found: 'Could not read this custom authorization server. Copy its Issuer from Security, API, Authorization Servers.',
 okta_client_rejected: 'Okta rejected the app. Check the client ID, paste the private key of this app, and check that its client authentication is Public key / Private key (step 2).',
 okta_scope_missing: 'A scope is not granted. Grant okta.users.read and okta.groups.read (step 3).',
 okta_role_missing: 'The app can not read users. Assign it the Read-only Administrator role (step 4).',
};
export function identityError(error: unknown): string {
 if (error instanceof HttpError) {
  if (error.status === 422 && error.code === 'directory_api_disabled') return 'The Admin SDK API is not enabled in the Google Cloud project of the service account. Enable it, then check the connection again.';
  if (error.status === 422 && error.code === 'directory_not_authorized') return 'The service account may not read the directory as this administrator. In the Google Admin console, authorize domain-wide delegation with the read-only user scope and check the administrator e-mail. A change can take up to 24 hours.';
  // Microsoft Entra ID setup errors (Admin 042 Solution 7, Backend 058 Protocol contract 9).
  const entra = error.status === 422 && error.code ? entraErrors[error.code] : undefined;
  if (entra) return entra;
  const okta = error.status === 422 && error.code ? oktaErrors[error.code] : undefined;
  if (okta) return okta;
  if (error.status === 422 && error.code === 'clients_unavailable') return 'Cannot read the Keycloak clients. Grant the service account the realm-management role view-clients, then check the connection again.';
  if (error.status === 422) return 'Cannot verify Keycloak directory and administrative access. Check the connection and network, grant the service account the realm-management roles view-users and view-clients (or equivalent), and ensure the directory contains a user.';
  if (error.status === 409 && error.code === 'groups_unsupported') return 'This identity provider can not list groups yet, so harness login is not available for it.';
  if (error.status === 400) return 'Check the connection, directory and harness login fields.';
  if (error.status === 404) return 'This connection or user is no longer available.';
  if (error.status === 409) return 'The connection changed, or this issuer is already registered. Reload and retry.';
  if (error.status === 501) return 'This provider is not available yet.';
  if (error.status === 502) return 'Could not verify this provider. Check its settings and network access.';
  if (error.status === 429) return 'Configuration checks are busy. Try again shortly.';
 }
 return 'The request could not be completed. Retry when the service is available.';
}
