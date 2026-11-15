import { ToolReviewCatalog } from './ToolReviewCatalog';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Plus, Server, Users } from 'lucide-react';
import { IdentityRegistry } from '../identity/IdentityRegistry';
import { EmptyState } from '../../components/ui/empty-state/EmptyState';
import { MCPDialog } from './MCPDialog';
import { ToolRows } from './ToolRows';
import { useMCPRegistry } from './useMCPRegistry';
import { ConnectionTable } from './ConnectionTable';
import { ChokepointTokenSetup } from './ChokepointTokenSetup';
import { CustomToolReview } from './review/CustomToolReview';
import { mcpApi, type Connection, type MCPServer } from './api';
import type { EnvironmentScope } from '../access/environment-scope';
import './mcp.css';

export function MCPRegistry({ scope }: { scope: EnvironmentScope }) {
  const [params, setParams] = useSearchParams();
  const back = params.get('return_to');
  const returnTo = back && (back === '/' || back.startsWith('/investigate?')) ? back : undefined;
  const kind = params.get('type') === 'identity' ? 'identity' : 'custom';
  const registry = useMCPRegistry(scope, kind === 'custom');
  const selectedId = params.get('server') ?? undefined;
  useEffect(() => { registry.setSelectedId(selectedId); }, [selectedId, registry.setSelectedId]);
  const details = useQuery({ queryKey: ['mcp-detail', scope.userId, scope.tenantId, scope.environmentId, selectedId], queryFn: ({ signal }) => mcpApi.get(scope, selectedId!, signal), enabled: !!selectedId });
  const server = details.data ?? registry.selected;
  const choose = (id?: string) => setParams({ type: kind, ...(id ? { server: id } : {}) });
  const saved = (s: MCPServer) => { registry.setDialog(null); setParams({ type: 'custom', server: s.id }); void registry.refresh(); };
  const navigate = useNavigate();
  // Discover tools in the Connect or Edit dialog opens the review page with the typed connection.
  const startReview = (connection: Connection) => {
    const dialog = registry.dialog;
    registry.setDialog(null);
    navigate(`/access/integrations?${new URLSearchParams(dialog && dialog !== 'new' ? { type: 'custom', server: dialog.id, review: 'server' } : { type: 'custom', review: 'new' })}`, { state: { connection } });
  };
  const connect = (s: MCPServer) => registry.setDialog(s);
  const servers = registry.servers;
  if (params.get('review') === 'tools') return <ToolReviewCatalog scope={scope} />;
  // Admin 055: the review of a discovery is a page. review=server opens the review of a stored server
  // (tool opens that tool) and review=new the review of a Custom MCP that the Connect dialog started.
  const review = params.get('review');
  const reviewTool = params.get('tool') ?? undefined;
  const reviewLabel = returnTo === '/' ? 'Overview' : returnTo ? 'Investigate' : 'Integrations';
  const reviewBack = returnTo ?? `/access/integrations?${new URLSearchParams({ type: kind, ...(selectedId ? { server: selectedId } : {}) })}`;
  if ((review === 'server' && selectedId && kind === 'custom') || review === 'new') return <CustomToolReview key={selectedId ?? 'new'} scope={scope} serverId={review === 'server' ? selectedId : undefined} initialTool={reviewTool} backTo={reviewBack} backLabel={reviewLabel} onSaved={saved} />;
  if (kind === 'identity') return <IdentityRegistry scope={scope} onCustom={() => setParams({ type: 'custom' })} />;
  return <section aria-label="Integrations" className="mcp-registry">
    {returnTo ? <Link className="cp-admin-button cp-admin-button--secondary trace-back" to={returnTo}>Back to {returnTo === '/' ? 'Overview' : 'Investigate'}</Link> : null}
    <header className="access-page-heading"><div><h1 className="cp-admin-title">Integrations</h1><p className="cp-admin-muted">Connect custom MCPs and identity providers, then manage agent access.</p></div><button className="cp-admin-button" onClick={() => registry.setDialog('new')}><Plus size={16} />Connect custom MCP</button></header>
    <div className="mcp-types" role="group" aria-label="Integration type"><button aria-pressed={kind === 'custom'} onClick={() => setParams({ type: 'custom' })}><Server size={17} />Custom MCPs</button><button aria-pressed={false} onClick={() => setParams({ type: 'identity' })}><Users size={17} />Identity providers</button></div>
    <>
      <><div className="mcp-toolbar"><label htmlFor="mcp-search">Find a connection</label><input id="mcp-search" type="search" className="cp-admin-input" placeholder="Search by name or endpoint" value={registry.search} onChange={e => registry.setSearch(e.target.value)} /></div>
      {registry.isPending ? <p role="status">Loading MCP servers…</p> : registry.isError ? <div role="alert">Could not load MCP servers. <button className="cp-admin-button cp-admin-button--ghost" onClick={() => void registry.refetch()}>Retry</button></div> : servers.length ? <ConnectionTable servers={servers} selected={server} pending={registry.pending} onSelect={choose} onConnect={connect} onDisable={s => void registry.disable(s)} /> : <EmptyState icon={Server} title={registry.search ? 'No matching connections' : 'No connections yet'} description="Connect your MCP endpoint to discover and select its tools." />}
      {registry.hasNextPage ? <button className="cp-admin-button cp-admin-button--secondary" disabled={registry.isFetchingNextPage} onClick={() => void registry.fetchNextPage()}>Load more connections</button> : null}
      {registry.isFetchNextPageError ? <p role="alert">Could not load the next page. Retry loading more connections.</p> : null}
      </>
      {registry.error ? <p role="alert" className="cp-admin-notice" data-tone="danger">{registry.error}</p> : null}
      {selectedId && details.isError ? <p role="alert">Connection details are unavailable. <button className="cp-admin-button cp-admin-button--ghost" onClick={() => void details.refetch()}>Retry</button></p> : null}
      {server ? <section id="mcp-server-details" className="mcp-details" aria-label={`${server.name} details`}><header className="mcp-details-heading"><div><h2>{server.name}</h2><p className="cp-admin-muted">Custom MCP · {server.transport} · {server.enabled ? 'Enabled' : 'Disabled'}</p></div><button className="cp-admin-button cp-admin-button--secondary" onClick={() => connect(server)}>Discover tools</button></header><ChokepointTokenSetup issuer={server.issuer} jwksUri={server.jwks_uri} audience={server.audience} unavailable={!server.issuer} />{/* Admin 050: no mapping screen and no Resource block on the tool rows. */}<ToolRows tools={server.tools} focusTool={params.get('tool') || undefined} serverEnabled={server.enabled} /></section> : null}
    </>
    <p className="mcp-footnote cp-admin-muted">Connections belong to this workspace and environment. Agent permissions determine who can use their tools.</p>
    {registry.dialog ? <MCPDialog key={registry.dialog === 'new' ? 'new' : registry.dialog.id} scope={scope} server={registry.dialog === 'new' ? undefined : registry.dialog} onClose={() => registry.setDialog(null)} onReview={startReview} /> : null}
  </section>;
}
