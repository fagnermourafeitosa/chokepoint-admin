import { httpClient, HttpError } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
export type IdentityFields = { name: string; issuer: string; audiences: string[]; groups_claim: string; enabled: boolean; revision: number };
export type IdentityConnection = IdentityFields & { id: string; created_at: string; updated_at: string; checked_at: string | null; check_status: 'not_checked' | 'verified' | 'failed' };
export type IdentityPage = { items: IdentityConnection[]; next_offset: number | null };
export const identityKey = (s: EnvironmentScope) => ['identity-connections', s.userId, s.tenantId, s.environmentId] as const;
const path = (s: EnvironmentScope): `/v1/${string}` => `/v1/workspaces/${encodeURIComponent(s.tenantId)}/environments/${encodeURIComponent(s.environmentId)}/identity-connections`;
export const identityApi = {
 list: (s: EnvironmentScope, offset: number, signal: AbortSignal) => httpClient<IdentityPage>(`${path(s)}?offset=${offset}`, { signal }),
 save: (s: EnvironmentScope, id: string | undefined, input: IdentityFields, signal: AbortSignal) => httpClient<IdentityConnection>(`${path(s)}${id ? `/${encodeURIComponent(id)}` : ''}`, { method: id ? 'PUT' : 'POST', json: input, signal }),
 check: (s: EnvironmentScope, id: string | undefined, input: IdentityFields, signal: AbortSignal) => httpClient<IdentityConnection>(`${path(s)}${id ? `/${encodeURIComponent(id)}` : ''}/check`, { method: 'POST', json: { name: input.name, issuer: input.issuer, audiences: input.audiences, groups_claim: input.groups_claim, enabled: input.enabled, revision: input.revision }, signal }),
 remove: (s: EnvironmentScope, c: IdentityConnection, signal: AbortSignal) => httpClient<void>(`${path(s)}/${encodeURIComponent(c.id)}`, { method: 'DELETE', json: { revision: c.revision }, signal }),
};
export function identityError(error: unknown): string {
 if (error instanceof HttpError) {
  if (error.status === 400) return 'Check the connection name, issuer, audiences and groups claim.';
  if (error.status === 404) return 'This connection is no longer available in this environment.';
  if (error.status === 409) return 'The connection changed, or this issuer is already registered. Reload the list and retry.';
  if (error.status === 502) return 'Could not verify the issuer. Check the URL, public keys and network access.';
  if (error.status === 429) return 'Configuration checks are busy. Try again shortly.';
 }
 return 'The request could not be completed. Retry when the service is available.';
}
