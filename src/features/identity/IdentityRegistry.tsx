import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { SelectMenu } from '../../components/ui/dropdown/SelectMenu';
import { Check, KeyRound, MoreHorizontal, Plus, Server, Shield, Users } from 'lucide-react';
import { EmptyState } from '../../components/ui/empty-state/EmptyState';
import { Dialog } from '../../components/ui/dialog/Dialog';
import type { EnvironmentScope } from '../access/environment-scope';
import { useAuth } from '../auth/AuthContext';
import { identityApi, identityKey } from './api';
import type { IdentityConnection } from './api';
import { ConnectionPeople } from './ConnectionPeople';
import { IdentityConnectionForm } from './IdentityConnectionForm';
import { useIdentityConnections } from './useIdentityConnections';
import { IntegrationTabs, type IntegrationType } from '../externalapps/IntegrationTabs';
import './identity.css';
// The count of people waiting for approval on a Generic OIDC connection (Admin 065 Solution 4).
function PendingBadge({ scope, connection }: { scope: EnvironmentScope; connection: IdentityConnection }) {
 const pending = useQuery({ queryKey: [...identityKey(scope), 'people', connection.id, 'pending'], queryFn: ({ signal }) => identityApi.people(scope, connection.id, { status: 'pending' }, signal), retry: false });
 const count = pending.data?.total ?? 0;
 return count ? <span className="mcp-badge" data-tone="warning">{count} pending approval</span> : null;
}
export function IdentityRegistry({ scope, onTab }: { scope: EnvironmentScope; onTab: (type: IntegrationType) => void }) {
 const registry = useIdentityConnections(scope);
 // The People page of a Generic OIDC connection opens from its row or from the Inbox (?people=<connection>).
 const [params, setParams] = useSearchParams();
 const peopleOf = registry.connections.find(c => c.id === params.get('people') && c.provider === 'oidc');
 const openPeople = (id: string | null) => setParams(current => { const next = new URLSearchParams(current); if (id) next.set('people', id); else next.delete('people'); return next; });
 const auth = useAuth();
 const [search, setSearch] = useState('');
 const [status, setStatus] = useState('all');
 const connections = registry.connections.filter(c => `${c.name} ${c.issuer}`.toLowerCase().includes(search.toLowerCase()) && (status === 'all' || (status === 'enabled') === c.enabled));
 if (peopleOf) return <ConnectionPeople scope={scope} connection={peopleOf} onBack={() => openPeople(null)} />;
 if (registry.editor) {
  const connection = registry.editor === 'new' ? undefined : registry.editor;
  return <IdentityConnectionForm key={connection?.id ?? 'new'} connection={connection} providers={registry.providerQuery.data ?? []} providerError={registry.providerQuery.isError} pending={registry.pending} error={registry.error} onCancel={() => registry.setEditor(null)} onSave={fields => registry.save(connection?.id, fields)} onCheck={async fields => { const result = await registry.run(signal => identityApi.check(scope, undefined, fields, signal)); return result?.check_status === 'verified'; }} onDirectoryCheck={fields => registry.run(signal => identityApi.directoryCheck(scope, connection?.id, fields, signal))} onCheckGeneric={fields => registry.run(signal => identityApi.check(scope, undefined, fields, signal))} />;
 }
 return <section aria-label="Identity providers" className="identity-registry">
  <header className="access-page-heading"><div><h1 className="cp-admin-title">Integrations</h1><p className="cp-admin-muted">Connect services to this environment.</p></div><button className="cp-admin-button" disabled={registry.pending} onClick={() => registry.setEditor('new')}><Plus size={16} />Connect identity provider</button></header>
  <IntegrationTabs current="identity" onTab={onTab} />
  <div className="identity-list-title"><h2>Identity providers</h2><span className="cp-admin-muted">{registry.connections.length} {registry.hasNextPage ? 'loaded ' : ''}connection{registry.connections.length === 1 ? '' : 's'}</span></div>
  <div className="identity-list-toolbar"><label><span className="identity-sr-only">Search identity connections</span><input type="search" className="cp-admin-input" placeholder="Search by name or issuer" value={search} onChange={e => setSearch(e.target.value)} /></label><label><span className="identity-sr-only">Connection status</span><SelectMenu label="Filter by status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All statuses' }, { value: 'enabled', label: 'Enabled' }, { value: 'disabled', label: 'Disabled' }]} /></label></div>
  {registry.error ? <p className="cp-admin-notice cp-admin-notice--danger" role="alert">{registry.error}</p> : null}
  {registry.notice ? <p className="cp-admin-notice" role="status">{registry.notice}</p> : null}
  {registry.isPending ? <p role="status">Loading identity connections…</p> : registry.isError ? <div className="cp-admin-notice" role="alert">Could not load identity connections. <button className="cp-admin-button cp-admin-button--ghost" onClick={() => void registry.refetch()}>Retry</button></div> : connections.length ? <div className="cp-admin-table-scroll identity-table-region" role="region" aria-label="Identity connections" tabIndex={0}><table className="cp-admin-table identity-table"><thead><tr><th>Connection</th><th>Accepted audiences</th><th>Status</th><th>Configuration check</th><th className="identity-actions-head">Actions</th></tr></thead><tbody>{connections.map(connection => <tr key={connection.id}>
   <td><div className="identity-name">{connection.provider === 'oidc' ? <KeyRound size={22} /> : <Shield size={22} />}<span><strong>{connection.name}</strong><small className="cp-admin-muted">{connection.issuer}{connection.provider === 'oidc' ? ' · Generic OIDC' : ''}</small></span></div></td>
   <td><div className="identity-audience-values">{connection.audiences.map(a => <code key={a}>{a}</code>)}</div></td>
   <td><div className="identity-status-cell"><span className="mcp-badge" data-tone={connection.enabled ? 'success' : undefined}>{connection.enabled ? 'Enabled' : 'Disabled'}</span>{connection.provider === 'oidc' ? <PendingBadge scope={scope} connection={connection} /> : null}</div></td>
   <td><span className="identity-check-result">{connection.check_status === 'verified' ? <Check size={16} aria-hidden="true" /> : null}{connection.check_status === 'verified' ? 'Verified' : connection.check_status === 'failed' ? 'Check failed' : 'Not checked'}</span>{connection.checked_at ? <small className="identity-check-date cp-admin-muted">{new Date(connection.checked_at).toLocaleString()}</small> : null}</td>
   <td><div className="identity-row-actions">{connection.provider === 'oidc' ? <button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => openPeople(connection.id)}>People</button> : null}<button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" disabled={registry.pending} onClick={() => registry.setEditor(connection)}>Edit</button><details className="identity-menu" name="identity-row-menu"><summary aria-label={`More actions for ${connection.name}`}><MoreHorizontal size={18} /></summary><div><button disabled={registry.pending} onClick={() => void registry.check(connection)}>Check configuration</button><button disabled={registry.pending} onClick={() => void registry.toggle(connection)}>{connection.enabled ? 'Disable connection' : 'Enable connection'}</button><button className="identity-delete-action" disabled={registry.pending} onClick={() => registry.setDeleting(connection)}>Delete connection</button></div></details></div></td>
  </tr>)}</tbody></table></div> : <EmptyState icon={Shield} title={search || status !== 'all' ? 'No matching connections' : 'No identity providers yet'} description={search || status !== 'all' ? 'Try another name, issuer or status.' : 'Connect your identity provider to verify users in incoming MCP requests.'} />}
  {registry.hasNextPage ? <button className="cp-admin-button cp-admin-button--secondary" disabled={registry.isFetchingNextPage} onClick={() => void registry.fetchNextPage()}>{registry.isFetchingNextPage ? 'Loading…' : 'Load more connections'}</button> : null}
  {registry.isFetchNextPageError ? <p role="alert">Could not load more connections. Retry with Load more connections.</p> : null}
  <p className="mcp-footnote cp-admin-muted">Connections apply only to {auth.workspace?.name} / {auth.environment?.name === 'production' ? 'Production' : 'Sandbox'}. Configuration checks verify issuer metadata and public keys.</p>
  {registry.deleting ? <Dialog title="Delete identity connection" onClose={() => { if (!registry.pending) registry.setDeleting(null); }}><div className="admin-dialog-body"><p>Delete “{registry.deleting.name}”? New requests can no longer use this connection.</p>{registry.error ? <p role="alert">{registry.error}</p> : null}</div><div className="admin-dialog-actions"><button className="cp-admin-button cp-admin-button--secondary" disabled={registry.pending} onClick={() => registry.setDeleting(null)}>Cancel</button><button className="cp-admin-button cp-admin-button--danger" disabled={registry.pending} onClick={() => void registry.remove()}>{registry.pending ? 'Deleting…' : 'Delete connection'}</button></div></Dialog> : null}
 </section>;
}
