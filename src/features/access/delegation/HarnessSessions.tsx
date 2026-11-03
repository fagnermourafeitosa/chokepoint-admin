import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, CircleHelp, Laptop } from 'lucide-react';
import { Tooltip } from '../../../components/ui/tooltip/Tooltip';
import { HttpError } from '../../../api/http-client';
import { identityApi } from '../../identity/api';
import type { AgentScope } from '../agent-api';
import { harnessApi, sessionsKey, type InteractiveConsent, type InteractiveGrant } from '../harness-api';
import { delegationKey, permissionApi } from './api';
import './harness.css';

const tip = (text: string) => <Tooltip content={text}><CircleHelp size={14} aria-label="Help" /></Tooltip>;
const day = (at: string) => new Date(at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const when = (at: string | null) => (at ? new Date(at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : 'never');

type Person = { key: string; connection: string; subject: string; consents: InteractiveConsent[]; machines: InteractiveGrant[] };

async function loadSessions(scope: AgentScope, agentId: string, signal: AbortSignal) {
  const [consents, grants, identities] = await Promise.all([harnessApi.consents(scope, agentId, signal), harnessApi.grants(scope, agentId, signal), identityApi.list(scope, 0, signal)]);
  const active = consents.items.filter(c => c.state === 'active');
  const issuers = new Map(identities.items.map(i => [i.id, i.issuer]));
  const wanted = [...new Map(active.map(c => [`${c.identity_connection_id}|${c.subject}`, { issuer: issuers.get(c.identity_connection_id) ?? '', subject: c.subject }])).values()].filter(i => i.issuer);
  const names = wanted.length ? await identityApi.names(scope, wanted.slice(0, 200), signal).catch(() => ({ items: [] })) : { items: [] };
  return { consents: active, grants: grants.items.filter(g => g.state === 'active'), issuers, names: names.items };
}

// Harness sessions view (Admin 036 section 3): the people who logged in from a coding harness
// and their machines (Backend 045 Administration API 5).
export function HarnessSessions({ scope, agentId, agentName, onBlock }: { scope: AgentScope; agentId: string; agentName: string; onBlock: (issuer: string, subject: string) => void }) {
  const cache = useQueryClient();
  const key = sessionsKey(scope, agentId);
  const sessions = useQuery({ queryKey: key, queryFn: ({ signal }) => loadSessions(scope, agentId, signal), retry: false });
  const permissions = useQuery({ queryKey: delegationKey(scope, agentId), queryFn: ({ signal }) => permissionApi.get(scope, agentId, signal), retry: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function act(work: () => Promise<unknown>, failure: string) {
    setBusy(true); setError(''); setNotice('');
    try { await work(); await cache.invalidateQueries({ queryKey: key }); return true; } catch (cause) { setError(cause instanceof HttpError && cause.status === 409 ? 'The agent changed in another session. Reload and retry.' : failure); return false; } finally { setBusy(false); }
  }
  // Block adds the person to the blocked list of the editor draft, next to its unsaved edits;
  // publishing revokes their machines (Admin 036 section 3, point 5).
  function block(person: Person, name: string) {
    onBlock(person.connection, person.subject);
    setError('');
    setNotice(`${name} blocked in the draft. Publish to revoke their machines and stop new logins.`);
  }
  const header = <header className="delegation-toolbar"><div className="agent-graph-title"><h3>Harness sessions</h3>{tip(`People who logged in to ${agentName} from a coding harness. Each machine has its own login and can be revoked alone.`)}</div></header>;
  if (sessions.isPending) return <section className="agent-identity" aria-label="Harness sessions">{header}<p role="status">Loading the harness sessions…</p></section>;
  if (sessions.isError) return <section className="agent-identity" aria-label="Harness sessions">{header}<div role="alert" className="cp-admin-notice" data-tone="danger">Could not load the harness sessions. <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => void sessions.refetch()}>Retry</button></div></section>;
  const { consents, grants, issuers, names } = sessions.data;
  const people = new Map<string, Person>();
  for (const c of consents) {
    const k = `${c.identity_connection_id}|${c.subject}`;
    const p = people.get(k) ?? { key: k, connection: c.identity_connection_id, subject: c.subject, consents: [], machines: [] };
    p.consents.push(c); p.machines.push(...grants.filter(g => g.consent_id === c.id));
    people.set(k, p);
  }
  const list = [...people.values()];
  const machines = list.reduce((n, p) => n + p.machines.length, 0);
  const published = permissions.data?.published;
  const groupName = (connection: string, id: string) => published?.scopes.find(s => s.identity_connection_id === connection)?.person_consent?.groups.find(g => g.id === id)?.name ?? id;
  const personName = (p: Person) => names.find(n => n.issuer === issuers.get(p.connection) && n.subject === p.subject)?.name ?? p.subject;
  return <section className="agent-identity" aria-label="Harness sessions">
    {header}
    <p className="cp-admin-muted">{list.length} {list.length === 1 ? 'person' : 'people'} · {machines} {machines === 1 ? 'machine' : 'machines'}</p>
    {notice ? <p className="consent-record harness-blocked-note" role="status"><Ban size={16} aria-hidden="true" /><span>{notice}</span></p> : null}
    {error ? <p role="alert" className="cp-admin-notice" data-tone="danger">{error}</p> : null}
    {list.length ? <div className="harness-sessions">{list.map(p => {
      const name = personName(p);
      const latest = [...p.consents].sort((a, b) => b.expires_at.localeCompare(a.expires_at))[0];
      return <article key={p.key} className="identity-card">
        <header className="harness-person"><div><strong>{name}</strong><small>{p.subject} · via group <code>{latest.group_ids.map(id => groupName(p.connection, id)).join(', ')}</code> · consent ends {day(latest.expires_at)}</small></div>
          <div className="condition-actions">
            <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" disabled={busy} onClick={() => void act(() => Promise.all(p.consents.map(c => harnessApi.revokeConsent(scope, agentId, c.id))), 'Could not revoke the consent. Retry when the service is available.')}>Revoke consent</button>
            <button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" disabled={busy} onClick={() => block(p, name)}><Ban size={14} aria-hidden="true" />Block</button>
          </div></header>
        {p.machines.length ? <ul className="harness-list">{p.machines.map(m => <li key={m.id}><Laptop size={15} aria-hidden="true" /><div><strong>{m.client_name ?? new URL(m.client_id).host}</strong><small>Logged in {when(m.created_at)} · used {when(m.last_used_at)}</small></div>
          <span className="mcp-badge" data-tone={m.binding === 'dpop' ? 'success' : undefined}>{m.binding === 'dpop' ? 'Bound to device' : 'Bearer'}</span>
          <button type="button" className="rule-switch" disabled={busy} onClick={() => void act(() => harnessApi.revokeGrant(scope, m.id), 'Could not revoke the machine. Retry when the service is available.')}>Revoke</button></li>)}</ul>
          : <p className="cp-admin-muted">No machine is logged in.</p>}
      </article>;
    })}</div> : <p className="identity-empty">Nobody is logged in from a harness.</p>}
  </section>;
}
