import { useState, type ReactNode } from 'react';
import { ArrowLeft, ChevronRight, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router';
import { ToolAnnotations } from '../../access/components/ToolAnnotations';
import { Notice } from '../../../components/ui/notice/Notice';
import type { ManagedTool } from '../api';
import { changesOf, params, type Param } from './toolDiff';
import '../mcp.css';
import '../../access/delegation/delegation.css';
import './tool-review.css';

// Admin 055: the review of a discovery as a page. Its entry (CustomToolReview) loads the preview,
// builds the heading and passes the confirmation. The list shows each tool and the state of its decision; the
// detail shows the text that the model reads, the change since approval and the decision. Nobody edits
// the text of a tool: the reviewer approves or denies it.

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

function ToolDetail({ tool, decision, busy, decide }: { tool: ManagedTool; decision?: Decision; busy: boolean; decide: (d: Decision) => void }) {
  const changed = tool.change === 'changed';
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
      <Notice tone="warning">The server changed this tool after you approved it. It stays disabled until you decide.</Notice>
      <div className="history-summary"><span>Changes since you approved it</span><span className="history-count" data-kind="changed">~{items.length} changed</span></div>
      {items.length ? <div className="history-diff">{items.map((item, i) => <section key={i}><h5>{item.section}</h5><ul>{item.rows.map((r, j) => <li key={j} data-kind={r.kind}><span className="history-sign" aria-label={r.kind}>{r.kind === 'added' ? '+' : r.kind === 'removed' ? '−' : '~'}</span><strong>{r.json ? <code>{r.text}</code> : r.text}</strong>{r.detail ? <code>{r.detail}</code> : null}</li>)}</ul></section>)}</div>
        : <Notice tone="info">The server went back to the text that you approved. Nothing changed since your approval, but the tool stays disabled until you decide.</Notice>}
    </> : null}
    {!touched.has('Description') ? <Field label="Description" now={tool.contract.description} /> : null}
    {params(tool.contract).filter(p => !touched.has(`Parameter ${p.name}`)).map(p => <Field key={p.name} label={label(p)} now={p.description} />)}
    <ToolAnnotations annotations={tool.contract.annotations} />
    {needsDecision(tool) ? <>
      <Guide changed={changed} />
      <div className="tr-decision">
        <button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={busy} aria-pressed={decision === 'denied'} onClick={() => decide('denied')}>{changed ? `Keep ${tool.name} disabled` : `Deny ${tool.name}`}</button>
        <button type="button" className="cp-admin-button" disabled={busy} aria-pressed={decision === 'approved'} onClick={() => decide('approved')}>{changed ? 'Trust this change' : `Approve ${tool.name}`}</button>
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

// The tools to manage after the review: an unchanged tool keeps its selection, an approved new or
// changed tool is selected, a denied or kept-disabled one is not, and a removed one cannot be.
export function selectedAfterReview(tools: ManagedTool[], decisions: Record<string, Decision>): string[] {
  return tools.filter(t => t.change !== 'removed' && (needsDecision(t) ? decisions[t.name] === 'approved' : t.selected)).map(t => t.name);
}

export type ToolReviewPageProps = {
  heading: ReactNode;
  backTo: string;
  backLabel: string;
  registryName: string;
  tools: ManagedTool[];
  serverInfo: unknown;
  initialTool?: string;
  busy: boolean;
  error?: string;
  onConfirm: (selected: string[]) => void;
  // Only for an existing server that is disabled: the review is where it is enabled again.
  enableOption?: { checked: boolean; onChange: (checked: boolean) => void };
};

export function ToolReviewPage({ heading, backTo, backLabel, registryName, tools, serverInfo, initialTool, busy, error, onConfirm, enableOption }: ToolReviewPageProps) {
  const toReview = tools.filter(needsDecision);
  const unchanged = tools.filter(t => t.change === 'unchanged');
  const removed = tools.filter(t => t.change === 'removed');
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const first = (initialTool && tools.some(t => t.name === initialTool) ? initialTool : undefined) ?? toReview[0]?.name ?? removed[0]?.name ?? 'server';
  const [shown, setShown] = useState(first);
  const [showUnchanged, setShowUnchanged] = useState(() => unchanged.some(t => t.name === first));
  const done = toReview.filter(t => decisions[t.name]).length;
  const tool = tools.find(t => t.name === shown);
  const readOnly = toReview.filter(t => t.change === 'new' && t.contract.annotations?.readOnlyHint && !decisions[t.name]);
  const advance = (next: Record<string, Decision>) => {
    setDecisions(next);
    const pending = toReview.find(t => !next[t.name]);
    if (pending) setShown(pending.name);
  };
  const decide = (d: Decision) => advance({ ...decisions, [shown]: d });
  const approveReadOnly = () => {
    const next = { ...decisions };
    readOnly.forEach(t => { next[t.name] = 'approved'; });
    advance(next);
  };
  const item = (t: ManagedTool) => <li key={t.name}><button type="button" className="tr-item" aria-current={shown === t.name} onClick={() => setShown(t.name)}>
    <span className="tr-item-copy"><strong>{t.contract.title || t.name}</strong>{t.contract.title && t.contract.title !== t.name ? <code>{t.name}</code> : null}</span>
    {t.change === 'new' || t.change === 'changed' ? <span className="mcp-badge" data-tone="warning">{t.change === 'new' ? 'New' : 'Changed'}</span> : t.change === 'removed' ? <span className="mcp-badge" data-tone="danger">Removed</span> : null}
    <StateLabel tool={t} decision={decisions[t.name]} />
  </button></li>;
  return <section className="tr-page" aria-label="Review discovered tools">
    <Link className="tr-back" to={backTo}><ArrowLeft size={16} aria-hidden="true" />{backLabel}</Link>
    <header className="access-page-heading tr-page-head">
      {heading}
      {toReview.length ? <div className="tr-progress"><strong>{done} of {toReview.length} decided</strong><progress className="tr-progress-bar" value={done} max={toReview.length} aria-label="Tools decided" /></div> : <div className="tr-progress"><strong>Nothing to decide</strong></div>}
    </header>
    <div className="tr-layout">
      <nav className="tr-list" aria-label="Discovered tools">
        {toReview.length ? <><div className="tr-group-head"><h3 className="cp-admin-label">To review</h3>{readOnly.length ? <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={busy} onClick={approveReadOnly}>Approve {readOnly.length} read-only</button> : null}</div><ul>{toReview.map(item)}</ul></> : null}
        {removed.length ? <><h3 className="cp-admin-label">Removed</h3><ul>{removed.map(item)}</ul></> : null}
        <h3 className="cp-admin-label">Server</h3>
        <ul><li><button type="button" className="tr-item" aria-current={shown === 'server'} onClick={() => setShown('server')}><span className="tr-item-copy"><strong>Instructions and identity</strong><code>initialize</code></span><span className="tr-state cp-admin-muted">Not sent to agents</span></button></li></ul>
        {unchanged.length ? <><button type="button" className="tr-group-toggle" aria-expanded={showUnchanged} onClick={() => setShowUnchanged(v => !v)}><ChevronRight size={16} aria-hidden="true" />{unchanged.length} unchanged {unchanged.length === 1 ? 'tool' : 'tools'}</button>
          {showUnchanged ? <ul>{unchanged.map(item)}</ul> : null}</> : null}
      </nav>
      <section className="tr-detail" aria-label="Reviewing">
        {shown === 'server' ? <ServerDetail serverInfo={serverInfo} registryName={registryName} /> : tool ? <ToolDetail tool={tool} decision={decisions[tool.name]} busy={busy} decide={decide} /> : null}
      </section>
    </div>
    {error ? <p role="alert" className="cp-admin-notice cp-admin-notice--danger">{error}</p> : null}
    <footer className="tr-footer">{enableOption ? <label className="mcp-select-all tr-enable"><input type="checkbox" checked={enableOption.checked} disabled={busy} onChange={e => enableOption.onChange(e.target.checked)} />Enable server after review</label> : null}<div><Link className="cp-admin-button cp-admin-button--secondary" to={backTo}>Cancel</Link><button type="button" className="cp-admin-button" disabled={busy || done < toReview.length} onClick={() => onConfirm(selectedAfterReview(tools, decisions))}>{busy ? 'Saving…' : 'Confirm review'}</button></div></footer>
  </section>;
}
