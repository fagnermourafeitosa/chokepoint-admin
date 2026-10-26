import { useState } from 'react';
import { ToolMappingManager } from './ToolMappingManager';
import { useSearchParams } from 'react-router';
import { IdentityRegistry } from '../identity/IdentityRegistry';
import { Plus, Server, Users, RefreshCw, Pause } from 'lucide-react';
import { EmptyState } from '../../components/ui/empty-state/EmptyState';
import { MCPDialog } from './MCPDialog';
import { ToolRows } from './ToolRows';
import { useMCPRegistry } from './useMCPRegistry';
import type { EnvironmentScope } from '../access/environment-scope';
import './mcp.css';
export function MCPRegistry({ scope }: { scope: EnvironmentScope }) {
 const registry = useMCPRegistry(scope);
 const [mapping, setMapping] = useState<{ serverId: string; serverName: string; toolName: string }>();
 const [params, setParams] = useSearchParams();
 const kind = params.get('type') === 'identity' ? 'idp' : 'mcp';
 const setKind = (next: string) => setParams(next === 'idp' ? { type: 'identity' } : {});
 const server = registry.selected;
 if (mapping && kind !== 'idp') return <ToolMappingManager key={`${scope.userId}:${scope.tenantId}:${scope.environmentId}:${mapping.serverId}:${mapping.toolName}`} scope={scope} {...mapping} onClose={() => setMapping(undefined)} />;
 if (kind === 'idp') return <IdentityRegistry scope={scope} onMCP={() => setKind('mcp')} />;
 return <section aria-label="Integrations" className="mcp-registry">
  <header className="access-page-heading"><div><h1 className="cp-admin-title">Integrations</h1><p className="cp-admin-muted">Connect services and review the tools available in this environment.</p></div>{kind === 'mcp' ? <button className="cp-admin-button" onClick={() => registry.setDialog('new')}><Plus size={16} />Connect MCP server</button> : null}</header>
  <div className="mcp-types" role="group" aria-label="Integration type"><button aria-pressed={kind === 'mcp'} onClick={() => setKind('mcp')}><Server size={17} />MCP servers</button><button aria-pressed={false} onClick={() => setKind('idp')}><Users size={17} />Identity providers</button></div>
  {<>
   <div className="mcp-toolbar"><label htmlFor="mcp-search">Find a server</label><input id="mcp-search" type="search" className="cp-admin-input" placeholder="Search by name or endpoint" value={registry.search} onChange={e => registry.setSearch(e.target.value)} /></div>
   {registry.error ? <p role="alert" className="cp-admin-notice" data-tone="danger">{registry.error}</p> : null}
   {registry.isPending ? <p role="status">Loading MCP servers…</p> : registry.isError ? <div role="alert" className="cp-admin-notice">Could not load MCP servers. <button className="cp-admin-button cp-admin-button--ghost" onClick={() => void registry.refetch()}>Retry</button></div> : registry.servers.length ? <div className="cp-admin-table-scroll" role="region" aria-label="MCP servers table" tabIndex={0}><table className="cp-admin-table mcp-servers"><thead><tr><th>Server</th><th>Managed tools</th><th>Status</th><th>Actions</th></tr></thead><tbody>{registry.servers.map(item => <tr key={item.id} aria-selected={server?.id === item.id}>
    <td><button className="mcp-server-name" onClick={() => registry.setSelectedId(server?.id === item.id ? undefined : item.id)} aria-expanded={server?.id === item.id} aria-controls="mcp-server-details"><Server size={20} /><span><strong>{item.name}</strong><small>{item.endpoint}</small></span></button></td>
    <td>{item.tools.filter(tool => tool.selected && tool.change !== 'removed').length}<span className="cp-admin-muted"> tools</span>{item.tools.some(tool => !tool.reviewed && (tool.change === 'changed' || tool.change === 'removed')) ? <span className="mcp-badge" data-tone="warning">Review required</span> : null}</td>
    <td><span className="mcp-badge" data-tone={item.enabled ? 'success' : undefined}>{item.enabled ? 'Enabled' : 'Disabled'}</span></td>
    <td className="mcp-row-actions"><button className="cp-admin-button cp-admin-button--ghost" disabled={registry.pending} onClick={() => registry.setDialog(item)}><RefreshCw size={14} />{item.enabled ? 'Edit & discover' : 'Review & re-enable'}</button>{item.enabled ? <button className="cp-admin-button cp-admin-button--ghost" disabled={registry.pending} onClick={() => void registry.disable(item)} aria-label={`Disable ${item.name}`}><Pause size={14} />Disable</button> : null}</td>
   </tr>)}</tbody></table></div> : <EmptyState icon={Server} title={registry.search ? 'No matching servers' : 'No MCP servers yet'} description={registry.search ? 'Try another name or endpoint.' : 'Connect an MCP server to discover and select its tools.'} />}
   {registry.hasNextPage ? <button className="cp-admin-button cp-admin-button--secondary" disabled={registry.isFetchingNextPage} onClick={() => void registry.fetchNextPage()}>{registry.isFetchingNextPage ? 'Loading…' : 'Load more servers'}</button> : null}
   {registry.isFetchNextPageError ? <p role="alert">Could not load the next page. Use Load more servers to retry.</p> : null}
   {server ? <section id="mcp-server-details" className="mcp-details" aria-label={`${server.name} details`}><div className="mcp-details-heading"><div><h2>{server.name}</h2><p className="cp-admin-muted">Streamable HTTP · {server.auth_type === 'bearer' ? 'Bearer token configured' : 'No authentication'} · {server.enabled ? 'Enabled' : 'Disabled'}</p></div><button className="cp-admin-button cp-admin-button--secondary" onClick={() => registry.setDialog(server)}>Discover tools</button></div><ToolRows tools={server.tools} serverEnabled={server.enabled} onMapping={tool => setMapping({ serverId: server.id, serverName: server.name, toolName: tool.name })} /><details className="mcp-contract"><summary>Server metadata</summary><pre>{JSON.stringify(server.server_info, null, 2)}</pre></details></section> : null}
   <p className="mcp-footnote cp-admin-muted">Connections and tools belong to this workspace and environment. Disabling a server keeps its saved tools and settings.</p>
  </>}
  {registry.dialog ? <MCPDialog key={registry.dialog === 'new' ? 'new' : registry.dialog.id} scope={scope} server={registry.dialog === 'new' ? undefined : registry.dialog} onClose={() => registry.setDialog(null)} onRefresh={() => void registry.refresh()} onSaved={saved => { registry.setDialog(null); registry.setSelectedId(saved.id); void registry.refresh(); }} /> : null}
 </section>;
}
