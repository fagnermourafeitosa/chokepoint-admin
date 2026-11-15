import { useState, type ReactNode } from 'react';
import { ArrowLeft, ChevronRight, TriangleAlert } from 'lucide-react';
import { ToolAnnotations } from '../../../src/features/access/components/ToolAnnotations';
import { Notice } from '../../../src/components/ui/notice/Notice';
import type { ManagedTool, ToolContract } from '../../../src/features/mcp/api';
import '../../../src/features/mcp/mcp.css';
import '../../../src/features/access/delegation/delegation.css';
import { ProviderMark } from '../../../src/features/mcp/ProviderMark';
import { firstConnection, guide, owaspUrl, rediscovery, server } from './enterprise-data';
import './tool-review.css';

// Admin 055 prototype, Enterprise page: the review of an Enterprise MCP (GitHub). It replaces
// src/features/mcp/enterprise/EnterpriseReview.tsx with the same page as a Custom MCP (a copy of
// ToolReviewPrototype.tsx on 2026-11-15), with the account of the connection in the heading and a bulk approval of
// the read-only tools, for a provider with many tools. A prototype-only switch shows the first connection
// and a rediscovery. Fixed data.

type Decision = 'approved' | 'denied';
const needsDecision = (t: ManagedTool) => t.change === 'new' || t.change === 'changed';

type Param = { name: string; type: string; required: boolean; description?: string };
function params(contract?: ToolContract): Param[] {
  const schema = contract?.inputSchema as { properties?: Record<string, { type?: string; description?: string }>; required?: string[] } | undefined;
  return Object.entries(schema?.properties ?? {}).map(([name, p]) => ({ name, type: p.type ?? 'any', required: schema?.required?.includes(name) ?? false, description: p.description }));
}

function Field({ label, now }: { label: ReactNode; now?: string; changed?: boolean }) {
  return <div className="tr-field"><div className="tr-field-label">{label}</div><p className="tr-text">{now || <span className="cp-admin-muted">No description.</span>}</p></div>;
}

function stateLabel(t: ManagedTool, decision?: Decision) {
  if (t.change === 'removed') return <span className="tr-state cp-admin-muted">Disabled</span>;
  if (!needsDecision(t)) return <span className="tr-state cp-admin-muted">No change</span>;
  if (!decision) return <span className="tr-state" data-state="pending">To review</span>;
  if (t.change === 'changed') return <span className="tr-state" data-state={decision}>{decision === 'approved' ? 'Change trusted' : 'Kept disabled'}</span>;
  return <span className="tr-state" data-state={decision}>{decision === 'approved' ? 'Approved' : 'Denied'}</span>;
}

function Guide({ changed }: { changed: boolean }) {
  return <details className="cp-admin-accordion tr-guide">
    <summary><TriangleAlert size={16} aria-hidden="true" />Before you decide</summary>
    <div>
      <p>Read the text above as the model will. Deny the tool if the text:</p>
      <ul>{guide.filter(g => changed || !g.changedOnly).map(g => <li key={g.text}><span>{g.text}</span> <a href={owaspUrl} target="_blank" rel="noopener noreferrer">OWASP {g.owasp} · {g.name}, p. {g.page} ↗</a></li>)}</ul>
      <p className="cp-admin-muted">You cannot edit this text. Agents get it exactly as you approve it.</p>
    </div>
  </details>;
}

// The changes of a tool since its approval, by JSON path (Admin 055, decision 2): the text that the
// model reads as removed and added rows; a parameter added or removed and a type or required change as
// one row; every other difference grouped in one Other fields row. Each item counts once.
type Row = { kind: 'added' | 'removed' | 'changed'; text: ReactNode; code?: string };
type Item = { section: string; rows: Row[] };
const textRows = (was?: string, now?: string): Row[] => [{ kind: 'removed', text: was || 'No description.' }, { kind: 'added', text: now || 'No description.' }];
function changesOf(was: ToolContract, now: ToolContract): Item[] {
  const items: Item[] = [];
  if (was.title !== now.title) items.push({ section: 'Title', rows: textRows(was.title, now.title) });
  if (was.description !== now.description) items.push({ section: 'Description', rows: textRows(was.description, now.description) });
  const before = new Map(params(was).map(p => [p.name, p])), after = new Map(params(now).map(p => [p.name, p]));
  for (const p of after.values()) {
    const old = before.get(p.name);
    if (!old) { items.push({ section: `Parameter ${p.name}`, rows: [{ kind: 'added', text: `Parameter added · ${p.type}${p.required ? ' · required' : ''}`, code: p.description }] }); continue; }
    if (old.type !== p.type) items.push({ section: `Parameter ${p.name}`, rows: [{ kind: 'changed', text: `Type ${old.type} → ${p.type}` }] });
    if (old.required !== p.required) items.push({ section: `Parameter ${p.name}`, rows: [{ kind: 'changed', text: p.required ? 'Now required' : 'No longer required' }] });
    if (old.description !== p.description) items.push({ section: `Parameter ${p.name}`, rows: textRows(old.description, p.description) });
  }
  for (const p of before.values()) if (!after.has(p.name)) items.push({ section: `Parameter ${p.name}`, rows: [{ kind: 'removed', text: 'Parameter removed' }] });
  const rest = (c: ToolContract) => JSON.stringify({ ...c, name: undefined, title: undefined, description: undefined, inputSchema: undefined });
  if (rest(was) !== rest(now)) items.push({ section: 'Other fields', rows: [{ kind: 'removed', text: <code>{rest(was)}</code> }, { kind: 'added', text: <code>{rest(now)}</code> }] });
  return items;
}

function ToolDetail({ tool, decision, decide }: { tool: ManagedTool; decision?: Decision; decide: (d: Decision) => void }) {
  const changed = tool.change === 'changed';
  const removed = tool.change === 'removed';
  const items = changed && tool.previous ? changesOf(tool.previous, tool.contract) : [];
  const touched = new Set(items.map(i => i.section));
  const now = params(tool.contract);
  const paramLabel = (p: Param) => <><code>{p.name}</code><span className="cp-admin-muted">{p.type}{p.required ? ' · required' : ''}</span></>;
  return <>
    <header className="tr-detail-head">
      <div><h2>{tool.contract.title || tool.name}</h2><code>{tool.name}</code></div>
      {stateLabel(tool, decision)}
    </header>
    {removed ? <Notice tone="info">The server no longer returns this tool. It stays disabled, and agents cannot call it. There is nothing to decide. Below, the text that you last approved.</Notice> : null}
    {changed ? <>
      <Notice tone="warning">The server changed this tool after you approved it. It stays disabled until you decide.</Notice>
      <div className="history-summary"><span>Changes since you approved it</span><span className="history-count" data-kind="changed">~{items.length} changed</span></div>
      {items.length ? <div className="history-diff">{items.map((item, i) => <section key={i}><h5>{item.section}</h5><ul>{item.rows.map((r, j) => <li key={j} data-kind={r.kind}><span className="history-sign" aria-label={r.kind}>{r.kind === 'added' ? '+' : r.kind === 'removed' ? '−' : '~'}</span><strong>{r.text}</strong>{r.code ? <code>{r.code}</code> : null}</li>)}</ul></section>)}</div>
        : <Notice tone="info">The server went back to the text that you approved. Nothing changed since your approval, but the tool stays disabled until you decide.</Notice>}
    </> : null}
    {!touched.has('Description') ? <Field label="Description" now={tool.contract.description} /> : null}
    {now.filter(p => !touched.has(`Parameter ${p.name}`)).map(p => <Field key={p.name} label={paramLabel(p)} now={p.description} />)}
    <ToolAnnotations annotations={tool.contract.annotations} />
    {needsDecision(tool) ? <>
      <Guide changed={changed} />
      <div className="tr-decision">
        {changed ? <>
          <button type="button" className="cp-admin-button cp-admin-button--secondary" aria-pressed={decision === 'denied'} onClick={() => decide('denied')}>Keep {tool.name} disabled</button>
          <button type="button" className="cp-admin-button" aria-pressed={decision === 'approved'} onClick={() => decide('approved')}>Trust this change</button>
        </> : <>
          <button type="button" className="cp-admin-button cp-admin-button--secondary" aria-pressed={decision === 'denied'} onClick={() => decide('denied')}>Deny {tool.name}</button>
          <button type="button" className="cp-admin-button" aria-pressed={decision === 'approved'} onClick={() => decide('approved')}>Approve {tool.name}</button>
        </>}
      </div>
    </> : removed ? null : <p className="cp-admin-muted">No change since your last review. Its settings are retained.</p>}
  </>;
}

function ServerDetail() {
  return <>
    <header className="tr-detail-head"><div><h2>Server</h2><span className="cp-admin-muted">What the server sent at connection (initialize)</span></div></header>
    <Notice tone="info">Nothing here reaches agents, whatever the text says. Agents never get these instructions, and they get the server name {server.name} from this registry. There is nothing to decide.</Notice>
    <div className="tr-field"><div className="tr-field-label">Instructions<span className="mcp-badge">Not sent to agents</span></div><p className="tr-text">{server.instructions}</p></div>
    <div className="tr-field"><div className="tr-field-label">Server identity<span className="mcp-badge">Not sent to agents</span></div><p className="tr-text"><code>{server.upstream.name}</code> · version <code>{server.upstream.version}</code></p></div>
  </>;
}

export function EnterpriseReviewPrototype() {
  const [scenario, setScenario] = useState<'first' | 'rediscovery'>('first');
  return <EnterpriseReview key={scenario} scenario={scenario} setScenario={setScenario} />;
}

function EnterpriseReview({ scenario, setScenario }: { scenario: 'first' | 'rediscovery'; setScenario: (s: 'first' | 'rediscovery') => void }) {
  const tools = scenario === 'first' ? firstConnection : rediscovery;
  const toReview = tools.filter(needsDecision);
  const unchanged = tools.filter(t => !needsDecision(t) && t.change !== 'removed');
  const removedTools = tools.filter(t => t.change === 'removed');
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [shown, setShown] = useState(toReview[0]?.name ?? 'server');
  const [showUnchanged, setShowUnchanged] = useState(false);
  const done = toReview.filter(t => decisions[t.name]).length;
  const tool = tools.find(t => t.name === shown);
  const decide = (d: Decision) => {
    const next = { ...decisions, [shown]: d };
    setDecisions(next);
    const pending = toReview.find(t => !next[t.name]);
    if (pending) setShown(pending.name);
  };
  const readOnly = toReview.filter(t => t.change === 'new' && t.contract.annotations?.readOnlyHint && !decisions[t.name]);
  const approveReadOnly = () => {
    const next = { ...decisions };
    readOnly.forEach(t => { next[t.name] = 'approved'; });
    setDecisions(next);
    const pending = toReview.find(t => !next[t.name]);
    if (pending) setShown(pending.name);
  };
  const item = (t: ManagedTool) => <li key={t.name}><button type="button" className="tr-item" aria-current={shown === t.name} onClick={() => setShown(t.name)}>
    <span className="tr-item-copy"><strong>{t.contract.title || t.name}</strong><code>{t.name}</code></span>
    {t.change === 'new' || t.change === 'changed' ? <span className="mcp-badge" data-tone="warning">{t.change === 'new' ? 'New' : 'Changed'}</span> : t.change === 'removed' ? <span className="mcp-badge" data-tone="danger">Removed</span> : null}
    {stateLabel(t, decisions[t.name])}
  </button></li>;
  return <main className="admin-page cp-admin-container tr-page" aria-label="Tool review prototype">
    <div className="cp-admin-segmented tr-scenario" role="radiogroup" aria-label="Prototype scenario">{([['first', 'First connection'], ['rediscovery', 'Rediscovery']] as const).map(([v, l]) => <label key={v} className="cp-admin-segment"><input type="radio" name="scenario" checked={scenario === v} onChange={() => setScenario(v)} /><span>{l}</span></label>)}</div>
    <a className="tr-back" href="#"><ArrowLeft size={16} aria-hidden="true" />Integrations</a>
    <header className="access-page-heading tr-page-head">
      <div className="tr-enterprise-head"><ProviderMark provider={server.provider} size={40} /><div><span className="cp-admin-label">{server.name} · Enterprise MCP</span><h1 className="cp-admin-title">Review discovered tools</h1><p className="cp-admin-muted">Connected as <strong>{server.account}</strong>. Calls through this connection use this account. Agents still need published tool permissions.</p></div></div>
      <div className="tr-progress"><strong>{done} of {toReview.length} decided</strong><progress className="tr-progress-bar" value={done} max={toReview.length} aria-label="Tools decided" /></div>
    </header>
    <div className="tr-layout">
      <nav className="tr-list" aria-label="Discovered tools">
        <div className="tr-group-head"><h3 className="cp-admin-label">To review</h3>{readOnly.length ? <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" onClick={approveReadOnly}>Approve {readOnly.length} read-only</button> : null}</div>
        <ul>{toReview.map(item)}</ul>
        {removedTools.length ? <><h3 className="cp-admin-label">Removed</h3><ul>{removedTools.map(item)}</ul></> : null}
        <h3 className="cp-admin-label">Server</h3>
        <ul><li><button type="button" className="tr-item" aria-current={shown === 'server'} onClick={() => setShown('server')}><span className="tr-item-copy"><strong>Instructions and identity</strong><code>initialize</code></span><span className="tr-state cp-admin-muted">Not sent to agents</span></button></li></ul>
        <button type="button" className="tr-group-toggle" aria-expanded={showUnchanged} onClick={() => setShowUnchanged(v => !v)}><ChevronRight size={16} aria-hidden="true" />{unchanged.length} unchanged tools</button>
        {showUnchanged ? <ul>{unchanged.map(item)}</ul> : null}
      </nav>
      <section className="tr-detail" aria-label="Reviewing">
        {shown === 'server' ? <ServerDetail /> : tool ? <ToolDetail tool={tool} decision={decisions[tool.name]} decide={decide} /> : null}
      </section>
    </div>
    <footer className="tr-footer"><div><button type="button" className="cp-admin-button cp-admin-button--secondary">Cancel</button><button type="button" className="cp-admin-button" disabled={done < toReview.length}>Confirm review</button></div></footer>
  </main>;
}
