import { ToolReviewCatalog } from './ToolReviewCatalog';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { Plus, Server, Users, Building2 } from 'lucide-react';
import { ToolMappingManager } from './ToolMappingManager';
import { IdentityRegistry } from '../identity/IdentityRegistry';
import { EmptyState } from '../../components/ui/empty-state/EmptyState';
import { MCPDialog } from './MCPDialog';
import { ToolRows } from './ToolRows';
import { useMCPRegistry } from './useMCPRegistry';
import { ConnectionTable } from './ConnectionTable';
import { EnterpriseCatalog } from './enterprise/EnterpriseCatalog';
import { EnterpriseReview } from './enterprise/EnterpriseReview';
import { useEnterpriseConnection } from './enterprise/useEnterpriseConnection';
import { mcpApi, type MCPServer } from './api';
import type { EnvironmentScope } from '../access/environment-scope';
import './mcp.css';

const oauthErrors: Record<string, string> = {
  cancelled: 'GitHub authorization was cancelled. Connect again when you are ready.',
  discovery_failed: 'GitHub authorized the account, but its tools could not be discovered. Check account permissions and try connecting again.',
  review_expired: 'This authorization attempt expired or the connection changed. Start a new connection review.',
  authentication_failed: 'Authorization could not be completed. Check account access and application approval, then connect again.',
};
export function MCPRegistry({ scope }: { scope: EnvironmentScope }) {
  const [params, setParams] = useSearchParams();
  const back = params.get('return_to');
  const returnTo = back && (back === '/' || back.startsWith('/investigate?')) ? back : undefined;
  const kind = params.get('type') === 'identity' ? 'identity' : params.get('type') === 'custom' ? 'custom' : 'enterprise';
  const registry = useMCPRegistry(scope, kind === 'custom');
  const enterprise = useEnterpriseConnection(scope);
  const [mapping, setMapping] = useState<{ serverId: string; serverName: string; toolName: string }>();
  const selectedId = params.get('server') ?? undefined;
  useEffect(() => { registry.setSelectedId(selectedId); }, [selectedId, registry.setSelectedId]);
  const details = useQuery({ queryKey: ['mcp-detail', scope.userId, scope.tenantId, scope.environmentId, selectedId], queryFn: ({ signal }) => mcpApi.get(scope, selectedId!, signal), enabled: !!selectedId });
  const server = details.data ?? registry.selected;
  const choose = (id?: string) => setParams({ type: kind, ...(id ? { server: id } : {}) });
  const saved = (s: MCPServer) => { registry.setDialog(null); setParams({ type: s.connection_type === 'enterprise' ? 'enterprise' : 'custom', server: s.id }); void registry.refresh(); };
  const connect = (s: MCPServer) => s.connection_type === 'enterprise' ? void enterprise.connect(s.provider_id!, s) : registry.setDialog(s);
  const servers = registry.servers.filter(s => kind === 'enterprise' ? s.connection_type === 'enterprise' : s.connection_type !== 'enterprise');
  const preview = params.get('preview');
  const correctScope = params.get('tenant') === scope.tenantId && params.get('environment') === scope.environmentId;
  if (params.get('review') === 'tools') return <ToolReviewCatalog scope={scope} />;
  if (kind === 'identity') return <IdentityRegistry scope={scope} onEnterprise={() => setParams({ type: 'enterprise' })} onCustom={() => setParams({ type: 'custom' })} />;
  if (mapping) return <ToolMappingManager key={`${scope.userId}:${scope.tenantId}:${scope.environmentId}:${mapping.serverId}:${mapping.toolName}`} scope={scope} {...mapping} onClose={() => setMapping(undefined)} />;
  return <section aria-label="Integrations" className="mcp-registry">
    {returnTo ? <Link className="cp-admin-button cp-admin-button--secondary trace-back" to={returnTo}>Back to {returnTo === '/' ? 'Overview' : 'Investigate'}</Link> : null}
    <header className="access-page-heading"><div><h1 className="cp-admin-title">Integrations</h1><p className="cp-admin-muted">Connect platforms and custom MCPs, then manage agent access.</p></div>{kind === 'custom' ? <button className="cp-admin-button" onClick={() => registry.setDialog('new')}><Plus size={16} />Connect custom MCP</button> : null}</header>
    <div className="mcp-types" role="group" aria-label="Integration type"><button aria-pressed={kind === 'enterprise'} onClick={() => setParams({ type: 'enterprise' })}><Building2 size={17} />Enterprise MCPs</button><button aria-pressed={kind === 'custom'} onClick={() => setParams({ type: 'custom' })}><Server size={17} />Custom MCPs</button><button aria-pressed={false} onClick={() => setParams({ type: 'identity' })}><Users size={17} />Identity providers</button></div>
    {preview && !correctScope ? <p role="alert" className="cp-admin-notice">This authorization belongs to another workspace or environment. Select its original context to review it.</p> : preview ? <EnterpriseReview key={preview} scope={scope} id={preview} onClose={() => setParams({ type: 'enterprise' })} onSaved={saved} /> : <>
      {kind === 'enterprise' ? <EnterpriseCatalog state={enterprise} pending={registry.pending} onSelect={choose} onDisable={s => void registry.disable(s)} /> : null}
      {params.has('oauth_error') ? <p role="alert" className="cp-admin-notice" data-tone="danger">{oauthErrors[params.get('oauth_error') ?? ''] ?? oauthErrors.authentication_failed}</p> : null}
      {kind === 'custom' ? <><div className="mcp-toolbar"><label htmlFor="mcp-search">Find a connection</label><input id="mcp-search" type="search" className="cp-admin-input" placeholder="Search by name or endpoint" value={registry.search} onChange={e => registry.setSearch(e.target.value)} /></div>
      {registry.isPending ? <p role="status">Loading MCP servers…</p> : registry.isError ? <div role="alert">Could not load MCP servers. <button className="cp-admin-button cp-admin-button--ghost" onClick={() => void registry.refetch()}>Retry</button></div> : servers.length ? <ConnectionTable servers={servers} selected={server} pending={registry.pending || enterprise.busy} onSelect={choose} onConnect={connect} onDisable={s => void registry.disable(s)} /> : <EmptyState icon={Server} title={registry.search ? 'No matching connections' : 'No connections yet'} description="Connect your MCP endpoint to discover and select its tools." />}
      {registry.hasNextPage ? <button className="cp-admin-button cp-admin-button--secondary" disabled={registry.isFetchingNextPage} onClick={() => void registry.fetchNextPage()}>Load more connections</button> : null}
      {registry.isFetchNextPageError ? <p role="alert">Could not load the next page. Retry loading more connections.</p> : null}
      </> : null}
      {registry.error ? <p role="alert" className="cp-admin-notice" data-tone="danger">{registry.error}</p> : null}
      {selectedId && details.isError ? <p role="alert">Connection details are unavailable. <button className="cp-admin-button cp-admin-button--ghost" onClick={() => void details.refetch()}>Retry</button></p> : null}
      {server ? <section id="mcp-server-details" className="mcp-details" aria-label={`${server.name} details`}><header className="mcp-details-heading"><div><h2>{server.name}</h2><p className="cp-admin-muted">{server.connection_type === 'enterprise' ? `Enterprise MCP · ${server.account || 'Account unavailable'}` : 'Custom MCP'} · {server.transport} · {server.enabled ? 'Enabled' : 'Disabled'}</p></div><button className="cp-admin-button cp-admin-button--secondary" disabled={enterprise.busy} onClick={() => connect(server)}>{server.connection_type === 'enterprise' ? 'Reconnect & review tools' : 'Discover tools'}</button></header><ToolRows tools={server.tools} focusTool={params.get('tool') || undefined} serverEnabled={server.enabled} onMapping={tool => setMapping({ serverId: server.id, serverName: server.name, toolName: tool.name })} /></section> : null}
    </>}
    <p className="mcp-footnote cp-admin-muted">Connections belong to this workspace and environment. Agent permissions determine who can use their tools.</p>
    {registry.dialog ? <MCPDialog key={registry.dialog === 'new' ? 'new' : registry.dialog.id} scope={scope} server={registry.dialog === 'new' ? undefined : registry.dialog} onClose={() => registry.setDialog(null)} onRefresh={() => void registry.refresh()} onSaved={saved} /> : null}
  </section>;
}
