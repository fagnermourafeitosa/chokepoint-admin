import { useState, type ReactNode } from 'react';
import { ArrowLeft, ChevronRight, TriangleAlert } from 'lucide-react';
import { ToolAnnotations } from '../../../src/features/access/components/ToolAnnotations';
import { Notice } from '../../../src/components/ui/notice/Notice';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import type { ManagedTool } from '../../../src/features/mcp/api';
import { changesOf, params, type Param } from '../../../src/features/mcp/review/toolDiff';
import '../../../src/features/mcp/mcp.css';
import '../../../src/features/access/delegation/delegation.css';
import '../../../src/features/mcp/review/tool-review.css';
import { server, tools as fixture, type ReviewTool } from './data';
import './prototype.css';

// Admin 057 prototype: the review page of Admin 055 after Backend 096. To review is ordered by
// criticality (review_order: granted tools first, denied tools last, annotations break ties); a tool
// denied in an earlier review comes back only when it changes, marked Denied before; "Keep N denied"
// keeps all of them denied at once. Copied from src/features/mcp/review/ToolReviewPage.tsx; fixed data.

type Decision = 'approved' | 'denied';
const needsDecision = (t: ManagedTool) => t.change === 'new' || t.change === 'changed';

// Entries of the OWASP Top 10 for Agentic Applications 2026 and the printed page where each starts.
// The official page of the list is linked: its document cannot be opened at a page from outside.
const owaspUrl = 'https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/';
const guide: { text: string; owasp: string; name: string; page: number; changedOnly?: boolean }[] = [
  { text: 'Gives the model an order, in the description or in a parameter, such as "before you answer", "ignore" or "do not tell the user".', owasp: 'ASI04', name: 'Agentic Supply Chain Vulnerabilities', page: 18 },
  { text: 'Tells the model to call another tool, or to send data or secrets to another place.', owasp: 'ASI02', name: 'Tool Misuse and Exploitation', page: 12 },
  { text: 'Changed since you approved it, and you do not know why.', owasp: 'ASI04', name: 'Agentic Supply Chain Vulnerabilities', page: 18, changedOnly: true },
];

function Field({ label, now }: { label: ReactNode; now?: string }) {
  return <div className="tr-field"><div className="tr-field-label">{label}</div><p className="tr-text">{now || <span className="cp-admin-muted">No description.</span>}</p></div>;
}

function StateLabel({ tool, decision }: { tool: ManagedTool; decision?: Decision }) {
  if (tool.change === 'removed') return <span className="tr-state cp-admin-muted">Disabled</span>;
  if (!needsDecision(tool)) return <span className="tr-state cp-admin-muted">No change</span>;
  if (!decision) return <span className="tr-state" data-state="pending">To review</span>;
  if (tool.change === 'changed' && (tool as ReviewTool).denied_before) return <span className="tr-state" data-state={decision}>{decision === 'approved' ? 'Approved' : 'Kept denied'}</span>;
  if (tool.change === 'changed') return <span className="tr-state" data-state={decision}>{decision === 'approved' ? 'Change trusted' : 'Kept disabled'}</span>;
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

function ToolDetail({ tool, decision, busy, decide }: { tool: ReviewTool; decision?: Decision; busy: boolean; decide: (d: Decision) => void }) {
  const changed = tool.change === 'changed';
  const wasDenied = !!tool.denied_before;
  const removed = tool.change === 'removed';
  const items = changed && tool.previous ? changesOf(tool.previous, tool.contract) : [];
  const touched = new Set(items.map(i => i.section));
  const label = (p: Param) => <><code>{p.name}</code><span className="cp-admin-muted">{p.type}{p.required ? ' · required' : ''}</span></>;
  return <>
    <header className="tr-detail-head">
      <div><h2>{tool.contract.title || tool.name}</h2><code>{tool.name}</code></div>
      <StateLabel tool={tool} decision={decision} />
    </header>
    {removed ? <Notice tone="info">The server no longer returns this tool. It stays disabled, and agents cannot call it. There is nothing to decide. Below, the text that you last approved.</Notice> : null}
    {changed ? <>
      {wasDenied ? <Notice tone="info">You denied this tool in an earlier review. The server changed it, so it comes back for a decision. It stays disabled, and agents cannot call it.</Notice>
        : <Notice tone="warning">The server changed this tool after you approved it. It stays disabled until you decide.</Notice>}
      {tool.granted_agents ? <p className="tr-granted">Granted to {tool.granted_agents} agents in their published permissions <WaitingBackend spec="096" tip="The agents whose published permission grants this tool, so the reviewer knows who loses it while it stays disabled." /></p> : null}
      <div className="history-summary"><span>{wasDenied ? 'Changes since you denied it' : 'Changes since you approved it'}</span><span className="history-count" data-kind="changed">~{items.length} changed</span></div>
      {items.length ? <div className="history-diff">{items.map((item, i) => <section key={i}><h5>{item.section}</h5><ul>{item.rows.map((r, j) => <li key={j} data-kind={r.kind}><span className="history-sign" aria-label={r.kind}>{r.kind === 'added' ? '+' : r.kind === 'removed' ? '−' : '~'}</span><strong>{r.json ? <code>{r.text}</code> : r.text}</strong>{r.detail ? <code>{r.detail}</code> : null}</li>)}</ul></section>)}</div>
        : <Notice tone="info">The server went back to the text that you approved. Nothing changed since your approval, but the tool stays disabled until you decide.</Notice>}
    </> : null}
    {!touched.has('Description') ? <Field label="Description" now={tool.contract.description} /> : null}
    {params(tool.contract).filter(p => !touched.has(`Parameter ${p.name}`)).map(p => <Field key={p.name} label={label(p)} now={p.description} />)}
    <ToolAnnotations annotations={tool.contract.annotations} />
    {needsDecision(tool) ? <>
      <Guide changed={changed} />
      <div className="tr-decision">
        <button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={busy} aria-pressed={decision === 'denied'} onClick={() => decide('denied')}>{wasDenied ? `Keep ${tool.name} denied` : changed ? `Keep ${tool.name} disabled` : `Deny ${tool.name}`}</button>
        <button type="button" className="cp-admin-button" disabled={busy} aria-pressed={decision === 'approved'} onClick={() => decide('approved')}>{wasDenied ? `Approve ${tool.name}` : changed ? 'Trust this change' : `Approve ${tool.name}`}</button>
      </div>
    </> : removed ? null : <p className="cp-admin-muted">No change since your last review. Its settings are retained.</p>}
  </>;
}

function ServerDetail({ serverInfo, registryName }: { serverInfo: unknown; registryName: string }) {
  const info = (serverInfo ?? {}) as { instructions?: string; serverInfo?: { name?: string; version?: string } };
  return <>
    <header className="tr-detail-head"><div><h2>Server</h2><span className="cp-admin-muted">What the server sent at connection (initialize)</span></div></header>
    <Notice tone="info">Nothing here reaches agents, whatever the text says. Agents never get these instructions, and they get the server name {registryName} from this registry. There is nothing to decide.</Notice>
    <div className="tr-field"><div className="tr-field-label">Instructions<span className="mcp-badge">Not sent to agents</span></div><p className="tr-text">{info.instructions || <span className="cp-admin-muted">The server sent no instructions.</span>}</p></div>
    <div className="tr-field"><div className="tr-field-label">Server identity<span className="mcp-badge">Not sent to agents</span></div><p className="tr-text">{info.serverInfo?.name ? <><code>{info.serverInfo.name}</code>{info.serverInfo.version ? <> · version <code>{info.serverInfo.version}</code></> : null}</> : <span className="cp-admin-muted">The server sent no identity.</span>}</p></div>
  </>;
}

export function ToolReviewHistoryPrototype() {
  const tools = fixture;
  const busy = false;
  // Backend 096: the backend orders the tools by criticality (review_order, lowest first).
  const toReview = tools.filter(needsDecision).sort((a, b) => a.review_order - b.review_order || a.name.localeCompare(b.name));
  const unchanged = tools.filter(t => t.change === 'unchanged');
  const removed = tools.filter(t => t.change === 'removed');
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [shown, setShown] = useState(toReview[0]?.name ?? 'server');
  const [showUnchanged, setShowUnchanged] = useState(false);
  const done = toReview.filter(t => decisions[t.name]).length;
  const tool = tools.find(t => t.name === shown);
  const readOnly = toReview.filter(t => t.change === 'new' && t.contract.annotations?.readOnlyHint && !decisions[t.name]);
  const denied = toReview.filter(t => t.denied_before && !decisions[t.name]);
  const advance = (next: Record<string, Decision>) => {
    setDecisions(next);
    const pending = toReview.find(t => !next[t.name]);
    if (pending) setShown(pending.name);
  };
  const decide = (d: Decision) => advance({ ...decisions, [shown]: d });
  const bulk = (list: ReviewTool[], d: Decision) => {
    const next = { ...decisions };
    list.forEach(t => { next[t.name] = d; });
    advance(next);
  };
  const item = (t: ReviewTool) => <li key={t.name}><button type="button" className="tr-item" aria-current={shown === t.name} onClick={() => setShown(t.name)}>
    <span className="tr-item-copy"><strong>{t.contract.title || t.name}</strong>{t.granted_agents && needsDecision(t) ? <small className="tr-item-use">Granted to {t.granted_agents} agents</small> : t.denied_before ? <small className="tr-item-use">Denied before</small> : null}</span>
    {t.change === 'new' || t.change === 'changed' ? <span className="mcp-badge" data-tone="warning">{t.change === 'new' ? 'New' : 'Changed'}</span> : t.change === 'removed' ? <span className="mcp-badge" data-tone="danger">Removed</span> : null}
    <StateLabel tool={t} decision={decisions[t.name]} />
  </button></li>;
  return <section className="tr-page" aria-label="Review discovered tools">
    <a className="tr-back" href="/prototype/integrations"><ArrowLeft size={16} aria-hidden="true" />Integrations</a>
    <header className="access-page-heading tr-page-head">
      <div><span className="cp-admin-label">{server.name} · Custom MCP</span><h1 className="cp-admin-title">Review discovered tools</h1><p className="cp-admin-muted">Decide each new or changed tool. Unchanged tools keep their settings. <a href="/prototype/integrations">Integrations list</a></p></div>
      <div className="tr-progress"><strong>{done} of {toReview.length} decided</strong><progress className="tr-progress-bar" value={done} max={toReview.length} aria-label="Tools decided" /></div>
    </header>
    <div className="tr-layout">
      <nav className="tr-list" aria-label="Discovered tools">
        <div className="tr-group-head"><h3 className="cp-admin-label">To review <WaitingBackend spec="096" tip="The order of the list: tools granted to agents first, then the others, then the tools denied before; inside each, destructive, write, open world and read only." /></h3></div>
        <div className="tr-bulk">
          {readOnly.length ? <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" onClick={() => bulk(readOnly, 'approved')}>Approve {readOnly.length} read-only</button> : null}
          {denied.length ? <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" onClick={() => bulk(denied, 'denied')}>Keep {denied.length} denied</button> : null}
          {denied.length ? <WaitingBackend spec="096" tip="Which changed tools were denied in an earlier review: Backend 096 keeps a denied tool instead of dropping it." /> : null}
        </div>
        <ul>{toReview.map(item)}</ul>
        {removed.length ? <><h3 className="cp-admin-label">Removed</h3><ul>{removed.map(item)}</ul></> : null}
        <h3 className="cp-admin-label">Server</h3>
        <ul><li><button type="button" className="tr-item" aria-current={shown === 'server'} onClick={() => setShown('server')}><span className="tr-item-copy"><strong>Instructions and identity</strong><code>initialize</code></span><span className="tr-state cp-admin-muted">Not sent to agents</span></button></li></ul>
        {unchanged.length ? <><button type="button" className="tr-group-toggle" aria-expanded={showUnchanged} onClick={() => setShowUnchanged(v => !v)}><ChevronRight size={16} aria-hidden="true" />{unchanged.length} unchanged {unchanged.length === 1 ? 'tool' : 'tools'}</button>
          {showUnchanged ? <ul>{unchanged.map(item)}</ul> : null}</> : null}
      </nav>
      <section className="tr-detail" aria-label="Reviewing">
        {shown === 'server' ? <ServerDetail serverInfo={server.info} registryName={server.name} /> : tool ? <ToolDetail tool={tool} decision={decisions[tool.name]} busy={busy} decide={decide} /> : null}
      </section>
    </div>
    <footer className="tr-footer"><div><a className="cp-admin-button cp-admin-button--secondary" href="/prototype/integrations">Cancel</a><button type="button" className="cp-admin-button" disabled={done < toReview.length}>Confirm review</button></div></footer>
  </section>;
}
