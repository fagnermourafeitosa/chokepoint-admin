import { useState } from 'react';
import { Building2, Check, MoreHorizontal, Plus, Server, Shield, Users } from 'lucide-react';
import { EmptyState } from '../../components/ui/empty-state/EmptyState';
import { Dialog } from '../../components/ui/dialog/Dialog';
import type { EnvironmentScope } from '../access/environment-scope';
import { useAuth } from '../auth/AuthContext';
import { identityApi } from './api';
import { IdentityConnectionForm } from './IdentityConnectionForm';
import { useIdentityConnections } from './useIdentityConnections';
import './identity.css';
export function IdentityRegistry({ scope, onEnterprise, onCustom }: { scope: EnvironmentScope; onEnterprise: () => void; onCustom: () => void }) {
 const registry = useIdentityConnections(scope);
 const auth = useAuth();
 const [search, setSearch] = useState('');
 const [status, setStatus] = useState('all');
 const connections = registry.connections.filter(c => `${c.name} ${c.issuer}`.toLowerCase().includes(search.toLowerCase()) && (status === 'all' || (status === 'enabled') === c.enabled));
 if (registry.editor) {
  const connection = registry.editor === 'new' ? undefined : registry.editor;
  return <IdentityConnectionForm key={connection?.id ?? 'new'} scope={scope} connection={connection} providers={registry.providerQuery.data ?? []} providerError={registry.providerQuery.isError} pending={registry.pending} error={registry.error} onCancel={() => registry.setEditor(null)} onSave={fields => registry.save(connection?.id, fields)} onCheck={async fields => { const result = await registry.run(signal => identityApi.check(scope, undefined, fields, signal)); return result?.check_status === 'verified'; }} onDirectoryCheck={async fields => { const result = await registry.run(signal => identityApi.directoryCheck(scope, connection?.id, fields, signal)); return result?.check_status === 'verified'; }} />;
 }
 return <section aria-label="Identity providers" className="identity-registry">
  <header className="access-page-heading"><div><h1 className="cp-admin-title">Integrations</h1><p className="cp-admin-muted">Connect services to this environment.</p></div><button className="cp-admin-button" disabled={registry.pending} onClick={() => registry.setEditor('new')}><Plus size={16} />Connect identity provider</button></header>
  <div className="mcp-types" role="group" aria-label="Integration type"><button onClick={onEnterprise} aria-pressed="false"><Building2 size={17} />Enterprise MCPs</button><button onClick={onCustom} aria-pressed="false"><Server size={17} />Custom MCPs</button><button aria-pressed="true"><Users size={17} />Identity providers</button></div>
  <div className="identity-list-title"><h2>Identity providers</h2><span className="cp-admin-muted">{registry.connections.length} {registry.hasNextPage ? 'loaded ' : ''}connection{registry.connections.length === 1 ? '' : 's'}</span></div>
  <div className="identity-list-toolbar"><label><span className="identity-sr-only">Search identity connections</span><input type="search" className="cp-admin-input" placeholder="Search by name or issuer" value={search} onChange={e => setSearch(e.target.value)} /></label><label><span className="identity-sr-only">Connection status</span><select className="cp-admin-input" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></label></div>
  {registry.error ? <p className="cp-admin-notice cp-admin-notice--danger" role="alert">{registry.error}</p> : null}
  {registry.notice ? <p className="cp-admin-notice" role="status">{registry.notice}</p> : null}
  {registry.isPending ? <p role="status">Loading identity connections…</p> : registry.isError ? <div className="cp-admin-notice" role="alert">Could not load identity connections. <button className="cp-admin-button cp-admin-button--ghost" onClick={() => void registry.refetch()}>Retry</button></div> : connections.length ? <div className="cp-admin-table-scroll identity-table-region" role="region" aria-label="Identity connections" tabIndex={0}><table className="cp-admin-table identity-table"><thead><tr><th>Connection</th><th>Accepted audiences</th><th>Status</th><th>Configuration check</th><th>Actions</th></tr></thead><tbody>{connections.map(connection => <tr key={connection.id}>
   <td><div className="identity-name"><Shield size={22} /><span><strong>{connection.name}</strong><small className="cp-admin-muted">{connection.issuer}</small></span></div></td>
   <td><div className="identity-audience-values">{connection.audiences.map(a => <code key={a}>{a}</code>)}</div></td>
   <td><span className="mcp-badge" data-tone={connection.enabled ? 'success' : undefined}>{connection.enabled ? 'Enabled' : 'Disabled'}</span></td>
   <td><span className="identity-check-result">{connection.check_status === 'verified' ? <Check size={16} aria-hidden="true" /> : null}{connection.check_status === 'verified' ? 'Verified' : connection.check_status === 'failed' ? 'Check failed' : 'Not checked'}</span>{connection.checked_at ? <small className="identity-check-date cp-admin-muted">{new Date(connection.checked_at).toLocaleString()}</small> : null}</td>
   <td><div className="identity-row-actions"><button className="cp-admin-button cp-admin-button--ghost" disabled={registry.pending} onClick={() => registry.setEditor(connection)}>Edit</button><details className="identity-menu"><summary aria-label={`More actions for ${connection.name}`}><MoreHorizontal size={18} /></summary><div><button disabled={registry.pending} onClick={() => void registry.check(connection)}>Check configuration</button><button disabled={registry.pending} onClick={() => void registry.toggle(connection)}>{connection.enabled ? 'Disable connection' : 'Enable connection'}</button><button className="identity-delete-action" disabled={registry.pending} onClick={() => registry.setDeleting(connection)}>Delete connection</button></div></details></div></td>
  </tr>)}</tbody></table></div> : <EmptyState icon={Shield} title={search || status !== 'all' ? 'No matching connections' : 'No identity providers yet'} description={search || status !== 'all' ? 'Try another name, issuer or status.' : 'Connect your identity provider to verify users in incoming MCP requests.'} />}
  {registry.hasNextPage ? <button className="cp-admin-button cp-admin-button--secondary" disabled={registry.isFetchingNextPage} onClick={() => void registry.fetchNextPage()}>{registry.isFetchingNextPage ? 'Loading…' : 'Load more connections'}</button> : null}
  {registry.isFetchNextPageError ? <p role="alert">Could not load more connections. Retry with Load more connections.</p> : null}
  <p className="mcp-footnote cp-admin-muted">Connections apply only to {auth.workspace?.name} / {auth.environment?.name === 'production' ? 'Production' : 'Sandbox'}. Configuration checks verify issuer metadata and public keys.</p>
  {registry.deleting ? <Dialog title="Delete identity connection" onClose={() => { if (!registry.pending) registry.setDeleting(null); }}><div className="admin-dialog-body"><p>Delete “{registry.deleting.name}”? New requests can no longer use this connection.</p>{registry.error ? <p role="alert">{registry.error}</p> : null}</div><div className="admin-dialog-actions"><button className="cp-admin-button cp-admin-button--secondary" disabled={registry.pending} onClick={() => registry.setDeleting(null)}>Cancel</button><button className="cp-admin-button cp-admin-button--danger" disabled={registry.pending} onClick={() => void registry.remove()}>{registry.pending ? 'Deleting…' : 'Delete connection'}</button></div></Dialog> : null}
 </section>;
}
