import { ToolReviewCatalog } from './ToolReviewCatalog';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { Plus, Server, Users } from 'lucide-react';
import { IdentityRegistry } from '../identity/IdentityRegistry';
import { EmptyState } from '../../components/ui/empty-state/EmptyState';
import { TracePager } from '../investigate/TraceUI';
import { MCPDialog } from './MCPDialog';
import { useMCPRegistry } from './useMCPRegistry';
import { ConnectionTable } from './ConnectionTable';
import { DisableDialog } from './DisableDialog';
import { ReviewHistory } from './ReviewHistory';
import { CustomToolReview } from './review/CustomToolReview';
import { pageSize, type Connection, type MCPServer } from './api';
import type { EnvironmentScope } from '../access/environment-scope';
import '../identity/identity.css';
import '../investigate/investigate.css';
import './mcp.css';

export function MCPRegistry({ scope }: { scope: EnvironmentScope }) {
  const [params, setParams] = useSearchParams();
  const back = params.get('return_to');
  const returnTo = back && (back === '/' || back.startsWith('/investigate?')) ? back : undefined;
  const kind = params.get('type') === 'identity' ? 'identity' : 'custom';
  const registry = useMCPRegistry(scope, kind === 'custom');
  const selectedId = params.get('server') ?? undefined;
  const [history, setHistory] = useState<MCPServer>();
  const [disabling, setDisabling] = useState<MCPServer>();
  const navigate = useNavigate();
  const saved = () => { registry.setDialog(null); setParams({ type: 'custom' }); void registry.refresh(); };
  // Discover tools in the Connect or Edit dialog opens the review page with the typed connection.
  const startReview = (connection: Connection) => {
    const dialog = registry.dialog;
    registry.setDialog(null);
    navigate(`/access/integrations?${new URLSearchParams(dialog && dialog !== 'new' ? { type: 'custom', server: dialog.id, review: 'server' } : { type: 'custom', review: 'new' })}`, { state: { connection } });
  };
  // Review, Discover and the switch turned on open the review page with the stored connection; the
  // switch also checks Enable server after review (Admin 057).
  const openReview = (s: MCPServer, enable?: boolean) => navigate(`/access/integrations?${new URLSearchParams({ type: 'custom', server: s.id, review: 'server', ...(enable ? { enable: '1' } : {}) })}`);
  if (params.get('review') === 'tools') return <ToolReviewCatalog scope={scope} />;
  // Admin 055: the review of a discovery is a page. review=server opens the review of a stored server
  // (tool opens that tool) and review=new the review of a Custom MCP that the Connect dialog started.
  // Admin 057: the server details below the list are gone, so a link to a server opens its review.
  const review = params.get('review');
  if (selectedId && kind === 'custom' && review !== 'server') {
    const next = new URLSearchParams(params);
    next.set('review', 'server');
    return <Navigate replace to={`/access/integrations?${next}`} />;
  }
  const reviewTool = params.get('tool') ?? undefined;
  const reviewLabel = returnTo === '/' ? 'Overview' : returnTo ? 'Investigate' : 'Integrations';
  const reviewBack = returnTo ?? '/access/integrations?type=custom';
  if ((review === 'server' && selectedId && kind === 'custom') || review === 'new') return <CustomToolReview key={selectedId ?? 'new'} scope={scope} serverId={review === 'server' ? selectedId : undefined} initialTool={reviewTool} enable={params.get('enable') === '1'} backTo={reviewBack} backLabel={reviewLabel} onSaved={saved} />;
  if (kind === 'identity') return <IdentityRegistry scope={scope} onCustom={() => setParams({ type: 'custom' })} />;
  const servers = registry.servers;
  return <section aria-label="Integrations" className="mcp-registry">
    {returnTo ? <Link className="cp-admin-button cp-admin-button--secondary trace-back" to={returnTo}>Back to {returnTo === '/' ? 'Overview' : 'Investigate'}</Link> : null}
    <header className="access-page-heading"><div><h1 className="cp-admin-title">Integrations</h1><p className="cp-admin-muted">Connect custom MCPs and identity providers, then manage agent access.</p></div><button className="cp-admin-button" onClick={() => registry.setDialog('new')}><Plus size={16} />Connect custom MCP</button></header>
    <div className="mcp-types" role="group" aria-label="Integration type"><button aria-pressed={kind === 'custom'} onClick={() => setParams({ type: 'custom' })}><Server size={17} />Custom MCPs</button><button aria-pressed={false} onClick={() => setParams({ type: 'identity' })}><Users size={17} />Identity providers</button></div>
    <div className="mcp-toolbar"><label htmlFor="mcp-search">Find a connection</label><input id="mcp-search" type="search" className="cp-admin-input" placeholder="Search by name or endpoint" value={registry.search} onChange={e => registry.setSearch(e.target.value)} /></div>
    {registry.isPending ? <p role="status">Loading MCP servers…</p>
      : registry.isError ? <div role="alert">Could not load MCP servers. <button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => void registry.refetch()}>Retry</button></div>
        : servers.length ? <>
          <ConnectionTable servers={servers} pending={registry.pending} onReview={openReview} onEdit={s => registry.setDialog(s)} onHistory={setHistory} onDisable={setDisabling} />
          <TracePager page={registry.page} size={pageSize} total={registry.total} onPage={registry.setPage} busy={registry.isFetching} />
        </>
          : <EmptyState icon={Server} title={registry.searching ? 'No matching connections' : 'No connections yet'} description={registry.searching ? 'Try another name or endpoint.' : 'Connect your MCP endpoint to discover and select its tools.'} />}
    {registry.error && !disabling ? <p role="alert" className="cp-admin-notice" data-tone="danger">{registry.error}</p> : null}
    {registry.dialog ? <MCPDialog key={registry.dialog === 'new' ? 'new' : registry.dialog.id} scope={scope} server={registry.dialog === 'new' ? undefined : registry.dialog} onClose={() => registry.setDialog(null)} onReview={startReview} /> : null}
    {history ? <ReviewHistory scope={scope} server={history} onClose={() => setHistory(undefined)} /> : null}
    {disabling ? <DisableDialog scope={scope} server={disabling} pending={registry.pending} error={registry.error} onCancel={() => setDisabling(undefined)} onConfirm={() => void registry.disable(disabling).then(ok => { if (ok) setDisabling(undefined); })} /> : null}
  </section>;
}
