import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '../../../api/http-client';
import { usePendingChanges } from '../../auth/pending/PendingChanges';
import type { EnvironmentScope } from '../../access/environment-scope';
import { mcpApi, mcpError, mcpKey, type MCPServer, type Preview } from '../api';
import { ProviderMark } from '../ProviderMark';
import { enterpriseApi } from '../enterprise/api';
import { ToolReviewPage } from './ToolReviewPage';

// Admin 055: the entry of the review page for an Enterprise MCP. A preview comes from a new OAuth
// authorization (the first connection or a reconnection, previewId) or from a discovery with the stored
// credential of a connected server (Backend 094, serverId). It replaces the former EnterpriseReview.
type Loaded = { server: MCPServer; preview: Preview; existingId?: string };

export function EnterpriseToolReview({ scope, previewId, serverId, initialTool, backTo, backLabel, onSaved, onReconnect }: { scope: EnvironmentScope; previewId?: string; serverId?: string; initialTool?: string; backTo: string; backLabel: string; onSaved: (server: MCPServer) => void; onReconnect: (server: MCPServer) => void }) {
  const cache = useQueryClient();
  const oauth = useQuery({ queryKey: ['enterprise-preview', scope.userId, scope.tenantId, scope.environmentId, previewId], queryFn: ({ signal }) => enterpriseApi.preview(scope, previewId!, signal), enabled: !!previewId, retry: false, staleTime: Infinity });
  const stored = useQuery({ queryKey: ['mcp-detail', scope.userId, scope.tenantId, scope.environmentId, serverId], queryFn: ({ signal }) => mcpApi.get(scope, serverId!, signal), enabled: !previewId && !!serverId, staleTime: 0 });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [enableAfter, setEnableAfter] = useState(false);
  // One discovery with the stored credential per visit (Backend 094), shared across the double mount of
  // StrictMode and never cancelled by a remount.
  const discovery = useQuery({
    queryKey: ['mcp-review-discovery', scope.userId, scope.tenantId, scope.environmentId, serverId, stored.data?.revision],
    queryFn: () => mcpApi.discoverEnterprise(scope, stored.data!.id, stored.data!.revision, new AbortController().signal),
    enabled: !previewId && !!stored.data, retry: false, staleTime: Infinity, gcTime: 0, refetchOnWindowFocus: false, refetchOnReconnect: false,
  });
  const discovered: Loaded | undefined = discovery.data && stored.data ? { server: stored.data, preview: discovery.data, existingId: stored.data.id } : undefined;
  const reauthorize = discovery.error instanceof HttpError && discovery.error.status === 422;
  const loaded: Loaded | undefined = previewId ? (oauth.data ? { server: oauth.data.server, preview: oauth.data.preview, existingId: oauth.data.existing_id } : undefined) : discovered;
  usePendingChanges(!!loaded);
  async function confirm(selected: string[]) {
    if (!loaded) return;
    setBusy(true); setError('');
    try {
      const enable = selected.length > 0 && (loaded.existingId ? loaded.server.enabled || enableAfter : true);
      const saved = await mcpApi.confirm(scope, loaded.existingId, loaded.preview, selected, enable, new AbortController().signal);
      await cache.invalidateQueries({ queryKey: mcpKey(scope) });
      await cache.invalidateQueries({ queryKey: ['mcp-summaries', scope.userId, scope.tenantId, scope.environmentId] });
      onSaved(saved);
    } catch (cause) { setError(mcpError(cause)); setBusy(false); }
  }
  if (previewId && (oauth.isError || (oauth.isSuccess && !oauth.data))) return <section className="tr-page" role="alert"><h1 className="cp-admin-title">Connection review unavailable</h1><p>The review may have expired or already been saved. Check your connections before starting again.</p></section>;
  if (stored.isError) return <section className="tr-page" role="alert"><h1 className="cp-admin-title">Review discovered tools</h1><p>{mcpError(stored.error)}</p></section>;
  if (discovery.isError) return <section className="tr-page"><div role="alert" className="cp-admin-notice cp-admin-notice--danger"><p>{mcpError(discovery.error)}</p>{reauthorize && stored.data ? <button type="button" className="cp-admin-button" onClick={() => onReconnect(stored.data!)}>Reconnect the account</button> : null}</div></section>;
  if (!loaded) return <section className="tr-page"><p role="status">Discovering the tools…</p></section>;
  const { server } = loaded;
  return <ToolReviewPage
    heading={<div className="tr-enterprise-head"><ProviderMark provider={server.provider_id} size={40} /><div><span className="cp-admin-label">{server.name} · Enterprise MCP</span><h1 className="cp-admin-title">Review discovered tools</h1><p className="cp-admin-muted">Connected as <strong>{server.account || 'an unknown account'}</strong>. Calls through this connection use this account. Agents still need published tool permissions.</p></div></div>}
    backTo={backTo} backLabel={backLabel} registryName={server.name} tools={loaded.preview.tools} serverInfo={loaded.preview.server_info}
    initialTool={initialTool} busy={busy} error={error} onConfirm={selected => void confirm(selected)}
    enableOption={loaded.existingId && !loaded.server.enabled ? { checked: enableAfter, onChange: setEnableAfter } : undefined} />;
}
