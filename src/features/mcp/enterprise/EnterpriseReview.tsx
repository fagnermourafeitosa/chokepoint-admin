import { usePendingChanges } from "../../auth/pending/PendingChanges";
import { useRef, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { EnvironmentScope } from '../../access/environment-scope';
import { ToolRows } from '../ToolRows';
import { mcpApi, mcpError, mcpKey, type MCPServer } from '../api';
import { ProviderMark } from '../ProviderMark';
import { enterpriseApi, type EnterprisePreview } from './api';

export function EnterpriseReview({ scope, id, onClose, onSaved }: { scope: EnvironmentScope; id: string; onClose: () => void; onSaved: (s: MCPServer) => void }) {
  const query = useQuery({ queryKey: ['enterprise-preview', scope.userId, scope.tenantId, scope.environmentId, id], queryFn: ({ signal }) => enterpriseApi.preview(scope, id, signal), retry: false, staleTime: Infinity });
  if (query.isPending) return <p role="status">Loading GitHub connection review…</p>;
  if (!query.data || query.isError) return <section className="mcp-details" role="alert"><h2>Connection review unavailable</h2><p>The review may have expired or already been saved. Check your connections before starting again.</p><button className="cp-admin-button" onClick={onClose}>Back to connections</button></section>;
  return <Review key={id} scope={scope} data={query.data} onClose={onClose} onSaved={onSaved} />;
}
function Review({ scope, data, onClose, onSaved }: { scope: EnvironmentScope; data: EnterprisePreview; onClose: () => void; onSaved: (s: MCPServer) => void }) {
  const cache = useQueryClient();
  const [selected, setSelected] = useState(() => data.preview.tools.filter(t => t.selected && t.change !== 'removed').map(t => t.name));
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  usePendingChanges(true);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function save() {
    if (controller.current) return;
    const request = new AbortController(); controller.current = request; setBusy(true); setError('');
    try {
      const server = await mcpApi.confirm(scope, data.existing_id, data.preview, selected, true, request.signal);
      if (request.signal.aborted) return;
      await cache.invalidateQueries({ queryKey: mcpKey(scope) });
      await cache.invalidateQueries({ queryKey: ['mcp-summaries', scope.userId, scope.tenantId, scope.environmentId] });
      if (!request.signal.aborted) onSaved(server);
    } catch (cause) { if (!request.signal.aborted) setError(mcpError(cause)); }
    finally { if (!request.signal.aborted) { controller.current = null; setBusy(false); } }
  }
  const available = data.preview.tools.filter(t => t.change !== 'removed');
  return <section className="mcp-details enterprise-review" aria-label="Review enterprise connection">
    <header className="mcp-details-heading"><div className="enterprise-review-title"><ProviderMark provider={data.server.provider_id} size={32} /><div><h2>Review {data.server.name}</h2><p>Connected as <strong>{data.server.account}</strong></p></div></div><span className="mcp-badge">Enterprise MCP</span></header>
    <p>Calls through this connection use this account. Agents still need published server and tool permissions.</p>
    <div className="enterprise-selection"><strong>{selected.length} of {available.length} tools selected</strong><button className="cp-admin-button cp-admin-button--ghost" disabled={busy} onClick={() => setSelected(selected.length === available.length ? [] : available.map(t => t.name))}>{selected.length === available.length ? 'Clear selection' : 'Select all'}</button></div>
    {!available.length ? <p>No tools were discovered. Return to connections and check the provider account permissions.</p> : null}
    <ToolRows tools={data.preview.tools} selected={selected} disabled={busy} onToggle={name => setSelected(old => old.includes(name) ? old.filter(n => n !== name) : [...old, name])} />
    {error ? <p role="alert">{error}</p> : null}
    <footer className="enterprise-review-actions"><button className="cp-admin-button cp-admin-button--secondary" disabled={busy} onClick={onClose}>Cancel</button><button className="cp-admin-button" disabled={busy || !selected.length} onClick={() => void save()}>{busy ? 'Saving connection…' : 'Confirm connection'}</button></footer>
  </section>;
}
