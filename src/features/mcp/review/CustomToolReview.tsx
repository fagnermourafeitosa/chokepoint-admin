import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router';
import { usePendingChanges } from '../../auth/pending/PendingChanges';
import type { EnvironmentScope } from '../../access/environment-scope';
import { mcpApi, mcpError, mcpKey, type Connection, type MCPServer, type Preview } from '../api';
import { ToolReviewPage } from './ToolReviewPage';

// Admin 055: the entry of the review page for a Custom MCP. It discovers the server (a new one with the
// connection that the Connect dialog collected, an existing one with its stored connection or the edited
// one) and confirms the review. The dialog passes an edited connection in the navigation state.
export type ReviewState = { connection?: Connection };

export function CustomToolReview({ scope, serverId, initialTool, enable, backTo, backLabel, onSaved }: { scope: EnvironmentScope; serverId?: string; initialTool?: string; enable?: boolean; backTo: string; backLabel: string; onSaved: (server: MCPServer) => void }) {
  const state = (useLocation().state ?? {}) as ReviewState;
  const cache = useQueryClient();
  const server = useQuery({ queryKey: ['mcp-detail', scope.userId, scope.tenantId, scope.environmentId, serverId], queryFn: ({ signal }) => mcpApi.get(scope, serverId!, signal), enabled: !!serverId, staleTime: 0 });
  const connection: Connection | undefined = state.connection ?? (server.data ? { name: server.data.name, endpoint: server.data.endpoint, transport: server.data.transport, auth_type: 'chokepoint_token', revision: server.data.revision } : undefined);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // The status switch of the list opens the review with Enable server after review checked (Admin 057).
  const [enableAfter, setEnableAfter] = useState(!!enable);
  // One discovery per visit. A query shares the request across the double mount of StrictMode, and no
  // abort signal is passed, so a remount never cancels a discovery that the backend already stores.
  const discovery = useQuery({
    queryKey: ['mcp-review-discovery', scope.userId, scope.tenantId, scope.environmentId, serverId ?? 'new', JSON.stringify(connection ?? null)],
    queryFn: () => mcpApi.discover(scope, serverId, connection!, new AbortController().signal),
    enabled: !!connection, retry: false, staleTime: Infinity, gcTime: 0, refetchOnWindowFocus: false, refetchOnReconnect: false,
  });
  const preview: Preview | undefined = discovery.data;
  usePendingChanges(!!preview);
  async function confirm(selected: string[]) {
    if (!preview) return;
    setBusy(true); setError('');
    try {
      const enable = selected.length > 0 && (server.data ? server.data.enabled || enableAfter : true);
      const saved = await mcpApi.confirm(scope, serverId, preview, selected, enable, new AbortController().signal);
      await cache.invalidateQueries({ queryKey: mcpKey(scope) });
      await cache.invalidateQueries({ queryKey: ['mcp-summaries', scope.userId, scope.tenantId, scope.environmentId] });
      onSaved(saved);
    } catch (cause) { setError(mcpError(cause)); setBusy(false); }
  }
  const name = connection?.name ?? server.data?.name ?? 'Custom MCP';
  if (!serverId && !state.connection) return <section className="tr-page" role="alert"><h1 className="cp-admin-title">Review discovered tools</h1><p>This review was not started from Connect custom MCP, or the page was reloaded. Connect the server again.</p></section>;
  if (server.isError) return <section className="tr-page" role="alert"><h1 className="cp-admin-title">Review discovered tools</h1><p>{mcpError(server.error)}</p></section>;
  if (discovery.isError) return <section className="tr-page"><p role="alert" className="cp-admin-notice cp-admin-notice--danger">{mcpError(discovery.error)}</p></section>;
  if (!preview) return <section className="tr-page"><p role="status">Discovering the tools of {name}…</p></section>;
  return <ToolReviewPage
    heading={<div><span className="cp-admin-label">{name} · Custom MCP</span><h1 className="cp-admin-title">Review discovered tools</h1><p className="cp-admin-muted">Decide each new or changed tool. Unchanged tools keep their settings.</p></div>}
    backTo={backTo} backLabel={backLabel} registryName={name} tools={preview.tools} serverInfo={preview.server_info}
    initialTool={initialTool} busy={busy} error={error} onConfirm={selected => void confirm(selected)}
    enableOption={server.data && !server.data.enabled ? { checked: enableAfter, onChange: setEnableAfter } : undefined} />;
}
