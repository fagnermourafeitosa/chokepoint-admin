import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import type { AgentScope } from '../access/agent-api';
import { HttpError } from '../../api/http-client';
import { identityApi, identityError, type IdentityConnection, type ServicePage } from '../identity/api';
import { KindChip } from './KindChip';
import type { Member } from './api';

type Props = {
 scope: AgentScope; connection: IdentityConnection; members: Member[]; selected: Record<string, Member>; disabled: boolean;
 memberKey: (member: Member) => string; onSelect: (key: string, member: Member | undefined) => void; onRemove: (member: Member) => void;
};

// Lists the services of one identity connection. A service acts by itself with its own
// token and has no search or pages: the backend returns the whole list, truncated if large.
export function ServiceDirectory({ scope, connection, members, selected, disabled, memberKey, onSelect, onRemove }: Props) {
 const [page, setPage] = useState<ServicePage>();
 const [loading, setLoading] = useState(false), [error, setError] = useState(''), [retry, setRetry] = useState(0);
 useEffect(() => {
  const controller = new AbortController(); setLoading(true); setError(''); setPage(undefined);
  identityApi.services(scope, connection.id, controller.signal).then(result => { if (!controller.signal.aborted) setPage(result); }).catch(reason => { if (!controller.signal.aborted) setError(servicesError(reason)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
  return () => controller.abort();
 }, [scope.userId, scope.tenantId, scope.environmentId, connection.id, retry]);
 return <>
  <p className="cp-admin-muted">A service acts by itself with its own token, for example a Keycloak client with a service account. An application ID in the decision history grants nothing: the service needs to be in a group.</p>
  {loading ? <p role="status">Loading services…</p> : null}
  {error ? <p role="alert">{error} <button type="button" className="identity-text-button" onClick={() => setRetry(value => value + 1)}>Retry</button></p> : null}
  {page?.truncated ? <div className="cp-admin-notice people-lifecycle-warning"><TriangleAlert size={18} aria-hidden="true" /><div><strong>The list is not complete</strong><span>Only some services are listed. The provider has more, or the read took too long. Try again, or reduce the number of clients in the provider.</span></div></div> : null}
  {page ? <div className="cp-admin-table-scroll"><table className="cp-admin-table people-directory-table"><thead><tr><th><span className="identity-sr-only">Select</span></th><th>Service</th><th>Status</th><th>Association</th></tr></thead><tbody>
   {page.items.map(service => { const member: Member = { ...service.identity, kind: 'service' }, id = memberKey(member), associated = members.some(m => memberKey(m) === id), label = service.display_name || service.user_name || service.id; return <tr key={id}>
    <td><input type="checkbox" aria-label={`Select ${label}`} checked={associated || !!selected[id]} disabled={disabled || associated} onChange={e => onSelect(id, e.target.checked ? member : undefined)} /></td>
    <td>{label}<KindChip kind="service" />{service.user_name && service.display_name !== service.user_name ? <small>{service.user_name}</small> : null}</td>
    <td>{service.active === false ? 'Inactive' : service.active === true ? 'Active' : 'Unknown'}</td>
    <td>{associated ? <><span>Associated</span> <button type="button" className="identity-text-button" disabled={disabled} onClick={() => onRemove(member)}>Remove</button></> : 'Not associated'}</td>
   </tr>; })}
  </tbody></table></div> : null}
  {page && page.items.length === 0 ? <p>No services found. A service is a client with service accounts turned on.</p> : null}
 </>;
}

// A provider without a service list answers HTTP 501 (Backend 027).
function servicesError(reason: unknown): string {
 if (reason instanceof HttpError && reason.status === 501) return 'This identity provider does not list services.';
 return identityError(reason);
}
