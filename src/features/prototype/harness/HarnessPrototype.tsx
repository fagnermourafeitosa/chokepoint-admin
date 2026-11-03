import { useState } from 'react';
import { Ban, Check, CircleHelp, Copy, Laptop, Plus, ShieldAlert, Trash2, TriangleAlert, Users } from 'lucide-react';
import { Tooltip } from '../../../components/ui/tooltip/Tooltip';
import { WaitingBackend } from '../../access/delegation/WaitingBackend';
import { blocked as blockedSeed, catalog, directory, groups, sessions, type Client } from './data';
import '../../access/delegation/delegation.css';
import './harness.css';

// Layout prototype for interactive harness login (Backend 045). Fixed data, local state only:
// nothing here reads or writes the backend.

const tip = (text: string) => <Tooltip content={text}><CircleHelp size={14} aria-label="Help" /></Tooltip>;


function CopyLine({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="identity-value"><span>{label}</span><code>{value}</code>
    <button type="button" className="relation-icon-button" aria-label="Copy" onClick={() => { void navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>
  </div>;
}

// Identity view: which harnesses can log in to this agent.
// The MCP URL is the ingress of the environment: the same origin as the issuer (Backend 030 Resolved Decision 15).
export function HarnessClients({ agentName, mcpUrl }: { agentName: string; mcpUrl: string }) {
  const [clients, setClients] = useState<Client[]>([catalog[0]]);
  const [custom, setCustom] = useState('');
  const available = catalog.filter(p => !clients.some(c => c.url === p.url));
  const add = (c: Client) => setClients(v => [...v, c]);
  return <section className="identity-card harness-card" aria-label="Harness login">
    <div className="harness-heading"><span className="identity-title">Harness login{tip('A coding harness (Claude Code, Cursor, Codex) logs in a person through the browser. Only the harnesses listed here can log in to this agent.')}</span><WaitingBackend spec="045" tip="Client allowlist of the agent (CIMD URLs)." /></div>
    <p className="cp-admin-muted">Developers add the MCP URL below to their harness. They log in with your identity provider, consent, and get the tools of <strong>{agentName}</strong>.</p>
    <CopyLine label="MCP URL for developers" value={mcpUrl} />
    <div className="relation-field"><span>Allowed harnesses · {clients.length}</span>
      {clients.length ? <ul className="harness-list">{clients.map(c => <li key={c.url}>
        <div><strong>{c.name}</strong><small>{c.url}</small>
          {c.sharedWith.length ? <small className="harness-shared"><Users size={12} aria-hidden="true" />Also allowed in {c.sharedWith.join(', ')}. At login, a person in both agents chooses one.</small> : null}</div>
        <button type="button" className="relation-icon-button" aria-label={`Remove ${c.name}`} onClick={() => setClients(v => v.filter(x => x.url !== c.url))}><Trash2 size={14} /></button>
      </li>)}</ul> : <p className="identity-empty">No harness yet. Nobody can log in to this agent from a harness.</p>}
    </div>
    <div className="harness-add">
      <WaitingBackend spec="045" tip="Harness catalog from platform_config. The URLs here are placeholders." />
      {available.map(p => <button key={p.url} type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" onClick={() => add(p)}><Plus size={14} aria-hidden="true" />{p.name}</button>)}
    </div>
    <details className="harness-custom"><summary>Another harness (client metadata URL){tip('Use it for a harness that is not in the buttons above. A harness identifies itself with a public HTTPS URL, its client metadata document: a small file published by the harness vendor with its name and the addresses it returns to after login. Ask the vendor for this URL or find it in their docs. Only harnesses listed here can log in to this agent.')}</summary>
      <div className="harness-add"><input className="cp-admin-input" type="url" placeholder="https://…" value={custom} onChange={e => setCustom(e.target.value)} aria-label="Client metadata URL" />
        <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={!custom.startsWith('https://')} onClick={() => { add({ name: new URL(custom).host, url: custom, sharedWith: [] }); setCustom(''); }}>Add</button></div>
      <small className="cp-admin-muted">The harness publishes this URL. Chokepoint reads it at each login and accepts only loopback redirects.</small>
    </details>
  </section>;
}


// Identity provider panel: who can log in from a harness, and who is vetoed.
export function HarnessAccess({ idpName, agentName, people }: { idpName: string; agentName: string; people: boolean }) {
  const [on, setOn] = useState(true);
  const [chosen, setChosen] = useState<string[]>(['g-dev']);
  const [days, setDays] = useState({ def: 7, max: 30 });
  const [blocked, setBlocked] = useState(blockedSeed);
  const [pick, setPick] = useState('');
  const toggle = (g: string) => setChosen(v => (v.includes(g) ? v.filter(x => x !== g) : [...v, g]));
  const none = on && chosen.length === 0;
  return <section className="harness-block" aria-label="Harness login">
    <div className="harness-heading"><span className="relation-label">Harness login{tip('People of this identity provider log in from a coding harness and consent themselves. You choose which groups can.')}</span><WaitingBackend spec="045" tip="person_consent in the scope: groups and validity." /></div>
    {!people ? <p className="cp-admin-muted">Include People above to let people log in from a harness.</p> : <>
      <label className="harness-switch"><input type="checkbox" checked={on} onChange={e => setOn(e.target.checked)} /><span><strong>People in chosen groups can log in from a harness</strong><small>They consent at login. You do not list them one by one.</small></span></label>
      {on ? <>
        <div className="harness-rule" data-tone={none ? 'danger' : 'warning'} role={none ? 'alert' : 'note'}>
          <ShieldAlert size={18} aria-hidden="true" />
          <div><strong>Only members of these groups can log in.</strong><small>{none ? 'Choose at least one group. Without a group, harness login stays off.' : `A person of ${idpName} outside these groups is refused at login and never sees ${agentName}.`}</small></div>
        </div>
        <div className="relation-field"><span>Groups in {idpName} · {chosen.length} chosen</span>
          <div className="harness-groups">{groups.map(g => <label key={g.id} data-on={chosen.includes(g.id)} title={g.path}><input type="checkbox" checked={chosen.includes(g.id)} onChange={() => toggle(g.id)} />{g.name}</label>)}</div>
          <small className="cp-admin-muted">Groups of the {idpName} directory. Membership is read at each login. <WaitingBackend spec="045" tip="Groups read of the identity connection (Groups contract of the provider adapter)." /></small>
        </div>
        <div className="harness-days">
          <label className="relation-field"><span>Consent lasts</span><span className="harness-number"><input className="cp-admin-input" type="number" min={1} max={days.max} value={days.def} onChange={e => setDays(v => ({ ...v, def: Number(e.target.value) }))} />days</span></label>
          <label className="relation-field"><span>At most</span><span className="harness-number"><input className="cp-admin-input" type="number" min={days.def} value={days.max} onChange={e => setDays(v => ({ ...v, max: Number(e.target.value) }))} />days</span></label>
        </div>
        <p className="resource-warning"><TriangleAlert size={14} aria-hidden="true" />Removing someone from a group in {idpName} does not cut access at once. It ends after 24 hours without use or when the consent ends. To cut access now, block the person.</p>
      </> : null}
    </>}
    <div className="relation-field"><span className="relation-label">Blocked · {blocked.length}{tip('A blocked person can not use this agent, whatever their groups or consent. Blocking revokes their machines at once when you publish.')}</span>
      {blocked.length ? <ul className="harness-list">{blocked.map(b => <li key={b.subject}><Ban size={15} aria-hidden="true" /><div><strong>{b.name}</strong><small>{b.subject} · {b.reason}</small></div>
        <button type="button" className="rule-switch" onClick={() => setBlocked(v => v.filter(x => x.subject !== b.subject))}>Unblock</button></li>)}</ul> : <p className="cp-admin-muted">Nobody is blocked.</p>}
      <div className="harness-add"><select className="cp-admin-input" value={pick} onChange={e => setPick(e.target.value)} aria-label="Person to block"><option value="">Choose a person…</option>{directory.filter(d => !blocked.some(b => b.subject === d.subject)).map(d => <option key={d.subject} value={d.subject}>{d.name}</option>)}</select>
        <button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" disabled={!pick} onClick={() => { const d = directory.find(x => x.subject === pick)!; setBlocked(v => [...v, { ...d, reason: 'Blocked by administrator' }]); setPick(''); }}><Ban size={14} aria-hidden="true" />Block</button></div>
    </div>
  </section>;
}


// Agent view: people who consented from a harness, and their machines.
export function HarnessSessions({ agentName }: { agentName: string }) {
  const [list, setList] = useState(sessions);
  const [blocked, setBlocked] = useState<string[]>([]);
  const revokeMachine = (s: string, m: string) => setList(v => v.map(x => (x.subject === s ? { ...x, machines: x.machines.filter(y => y.id !== m) } : x)).filter(x => x.machines.length));
  const machines = list.reduce((n, s) => n + s.machines.length, 0);
  return <section className="agent-identity" aria-label="Harness sessions">
    <header className="delegation-toolbar"><div className="agent-graph-title"><h3>Harness sessions</h3>{tip(`People who logged in to ${agentName} from a coding harness. Each machine has its own login and can be revoked alone.`)}</div><WaitingBackend spec="045" tip="Consents and grants of the agent." /></header>
    <p className="cp-admin-muted">{list.length} people · {machines} machines</p>
    {blocked.length ? <p className="consent-record harness-blocked-note"><Ban size={16} aria-hidden="true" /><span><strong>{blocked.join(', ')} blocked in the draft</strong><small>Publish to revoke their machines and stop new logins.</small></span></p> : null}
    <div className="harness-sessions">{list.map(s => <article key={s.subject} className="identity-card">
      <header className="harness-person"><div><strong>{s.name}</strong><small>{s.subject} · via group <code>{s.group}</code> · consent ends {s.consentEnds}</small></div>
        <div className="condition-actions">
          <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => setList(v => v.filter(x => x.subject !== s.subject))}>Revoke consent</button>
          <button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" onClick={() => { setBlocked(v => [...v, s.name]); setList(v => v.filter(x => x.subject !== s.subject)); }}><Ban size={14} aria-hidden="true" />Block</button>
        </div></header>
      <ul className="harness-list">{s.machines.map(m => <li key={m.id}><Laptop size={15} aria-hidden="true" /><div><strong>{m.client}</strong><small>Logged in {m.created} · used {m.lastUsed}</small></div>
        <span className="mcp-badge" data-tone={m.dpop ? 'success' : undefined}>{m.dpop ? 'Bound to device' : 'Bearer'}</span>
        <button type="button" className="rule-switch" onClick={() => revokeMachine(s.subject, m.id)}>Revoke</button></li>)}</ul>
    </article>)}</div>
  </section>;
}
