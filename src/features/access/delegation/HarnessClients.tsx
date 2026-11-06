import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CircleHelp, Copy, Plus, Trash2, Users } from 'lucide-react';
import { Tooltip } from '../../../components/ui/tooltip/Tooltip';
import { HttpError } from '../../../api/http-client';
import { mcpApi } from '../../mcp/api';
import type { EnvironmentScope } from '../environment-scope';
import { allowlistKey, harnessApi, harnessCatalogKey, mcpServerUrl, type ClientAllowlist } from '../harness-api';
import { delegationKey, permissionApi } from './api';
import './harness.css';

const tip = (text: string) => <Tooltip content={text}><CircleHelp size={14} aria-label="Help" /></Tooltip>;

function CopyLine({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="identity-value"><span>{label}</span><code>{value}</code>
    <button type="button" className="relation-icon-button" aria-label={`Copy ${label}`} onClick={() => { void navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>
  </div>;
}

const validUrl = (value: string) => { try { const u = new URL(value); return u.protocol === 'https:' && u.pathname.length > 1 && !u.search && !u.hash; } catch { return false; } };

// Harness login card of the Identity view (Admin 036 section 2): the MCP URL for developers and
// the client allowlist of the agent (Backend 045 Administration API 2 and 3b).
export function HarnessClients({ scope, agentId, agentName, issuer }: { scope: EnvironmentScope; agentId: string; agentName: string; issuer: string }) {
  const cache = useQueryClient();
  const key = allowlistKey(scope, agentId);
  const allowlist = useQuery({ queryKey: key, queryFn: ({ signal }) => harnessApi.allowlist(scope, agentId, signal), retry: false });
  const catalog = useQuery({ queryKey: harnessCatalogKey, queryFn: ({ signal }) => harnessApi.catalog(signal), retry: false, staleTime: 300_000 });
  const permissions = useQuery({ queryKey: delegationKey({ ...scope }, agentId), queryFn: ({ signal }) => permissionApi.get({ ...scope }, agentId, signal), retry: false });
  const servers = useQuery({ queryKey: ['mcp-server-names', scope.userId, scope.tenantId, scope.environmentId], queryFn: ({ signal }) => mcpApi.list(scope, 0, signal), retry: false, staleTime: 60_000 });
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; conflict: boolean }>();
  async function save(current: ClientAllowlist, clientIds: string[]) {
    setBusy(true); setError(undefined);
    try {
      cache.setQueryData(key, await harnessApi.saveAllowlist(scope, agentId, clientIds, current.revision));
      // The allowlist and the agent key share one revision (Backend 045).
      void cache.invalidateQueries({ queryKey: ['agent-client', scope.userId, scope.tenantId, scope.environmentId, agentId] });
      return true;
    } catch (cause) {
      const conflict = cause instanceof HttpError && cause.status === 409;
      setError({ conflict, message: conflict ? 'The harnesses or the key changed in another session. Reload to see the current list.' : cause instanceof HttpError && cause.status === 400 ? 'Use a public HTTPS client metadata URL, with a path and no query.' : 'Could not save the harnesses. Retry when the service is available.' });
      return false;
    } finally { setBusy(false); }
  }
  const serverIds = [...new Set((permissions.data?.published?.capabilities ?? []).map(c => c.server_id))];
  const serverName = (id: string) => servers.data?.items.find(s => s.id === id)?.name ?? id;
  const heading = <span className="identity-title">Harness login{tip('A coding harness (Claude Code, Codex and similar) logs in a person through the browser. Only the harnesses listed here can log in to this agent.')}</span>;
  if (allowlist.isPending) return <section className="identity-card harness-card" aria-label="Harness login">{heading}<p role="status">Loading the harnesses…</p></section>;
  if (allowlist.isError) return <section className="identity-card harness-card" aria-label="Harness login">{heading}<div role="alert" className="cp-admin-notice" data-tone="danger">Could not load the harnesses. <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => void allowlist.refetch()}>Retry</button></div></section>;
  const current = allowlist.data;
  const allowed = current.items.map(c => c.client_id);
  const available = (catalog.data ?? []).filter(h => !allowed.includes(h.client_id));
  const catalogName = (url: string) => catalog.data?.find(h => h.client_id === url)?.name;
  return <section className="identity-card harness-card" aria-label="Harness login">
    {heading}
    <p className="cp-admin-muted">Developers add the MCP URL below to their harness. They log in with your identity provider, consent, and get the tools of <strong>{agentName}</strong>.</p>
    {serverIds.length ? serverIds.map(id => <CopyLine key={id} label={serverIds.length > 1 ? `MCP URL · ${serverName(id)}` : 'MCP URL for developers'} value={mcpServerUrl(issuer, id)} />)
      : <p className="cp-admin-muted">Publish tools for this agent first. Then the MCP URL of each server appears here.</p>}
    <div className="relation-field"><span>Allowed harnesses · {current.items.length}</span>
      {current.items.length ? <ul className="harness-list">{current.items.map(c => <li key={c.client_id}>
        <div><strong>{c.client_name ?? catalogName(c.client_id) ?? new URL(c.client_id).host}</strong><small>{c.client_id}</small>
          {c.other_agents.length ? <small className="harness-shared"><Users size={12} aria-hidden="true" />Also allowed in {c.other_agents.map(a => a.name).join(', ')}. At login, a person in both agents chooses one.</small> : null}</div>
        <button type="button" className="relation-icon-button" disabled={busy} aria-label={`Remove ${c.client_name ?? c.client_id}`} onClick={() => void save(current, allowed.filter(x => x !== c.client_id))}><Trash2 size={14} /></button>
      </li>)}</ul> : <p className="identity-empty">No harness yet. Nobody can log in to this agent from a harness.</p>}
    </div>
    {available.length ? <div className="harness-add">{available.map(h => <button key={h.id} type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={busy} onClick={() => void save(current, [...allowed, h.client_id])}>
      <Plus size={14} aria-hidden="true" /><img className="harness-icon" src={h.icon} alt="" width={14} height={14} onError={e => { e.currentTarget.hidden = true; }} />{h.name}</button>)}</div> : null}
    <details className="harness-custom"><summary>Another harness (client metadata URL){tip('Use it for a harness that is not in the buttons above. A harness identifies itself with a public HTTPS URL, its client metadata document: a small file published by the harness vendor with its name and the addresses it returns to after login. Ask the vendor for this URL or find it in their docs. Only harnesses listed here can log in to this agent.')}</summary>
      <div className="harness-add"><input className="cp-admin-input" type="url" placeholder="https://…" value={custom} onChange={e => setCustom(e.target.value.trim())} aria-label="Client metadata URL" />
        <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={busy || !validUrl(custom) || allowed.includes(custom)} onClick={() => void save(current, [...allowed, custom]).then(ok => { if (ok) setCustom(''); })}>Add</button></div>
      <small className="cp-admin-muted">The harness publishes this URL. Xokepoint reads it at each login and accepts only loopback redirects.</small>
    </details>
    {error ? <div role="alert" className="cp-admin-notice" data-tone="danger">{error.message}{error.conflict ? <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => { setError(undefined); void allowlist.refetch(); }}>Reload</button> : null}</div> : null}
  </section>;
}
