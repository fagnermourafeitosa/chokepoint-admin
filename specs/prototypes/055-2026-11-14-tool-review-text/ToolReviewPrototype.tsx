import { useState, type ReactNode } from 'react';
import { ArrowLeft, ChevronRight, TriangleAlert } from 'lucide-react';
import { ToolAnnotations } from '../../../src/features/access/components/ToolAnnotations';
import { Notice } from '../../../src/components/ui/notice/Notice';
import type { ManagedTool, ToolContract } from '../../../src/features/mcp/api';
import '../../../src/features/mcp/mcp.css';
import '../../../src/features/access/delegation/delegation.css';
import { guide, owaspUrl, server, tools } from './data';
import './tool-review.css';

// Admin 055 prototype: the review of a discovery as a page of its own (it replaces the preview step of
// src/features/mcp/MCPDialog.tsx). List and detail: the list shows each tool and the state of its
// decision; the detail shows the text that the model reads, the change since approval side by side,
// and the decision with action-and-object buttons. Nobody edits the text. Fixed data.

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

// A changed field as two rows of the revision history diff (design system): the approved text removed,
// the discovered text added.
function DiffRows({ was, now }: { was?: string; now?: string }) {
  return <ul>
    <li data-kind="removed"><span className="history-sign" aria-label="approved">−</span><strong>{was || 'No description.'}</strong></li>
    <li data-kind="added"><span className="history-sign" aria-label="discovered">+</span><strong>{now || 'No description.'}</strong></li>
  </ul>;
}

function ToolDetail({ tool, decision, decide }: { tool: ManagedTool; decision?: Decision; decide: (d: Decision) => void }) {
  const changed = tool.change === 'changed';
  const was = changed ? tool.previous : undefined;
  const before = new Map(params(was).map(p => [p.name, p.description]));
  const now = params(tool.contract);
  const descriptionChanged = changed && was?.description !== tool.contract.description;
  const changedParams = changed ? now.filter(p => before.get(p.name) !== p.description) : [];
  const keptParams = now.filter(p => !changedParams.includes(p));
  const count = (descriptionChanged ? 1 : 0) + changedParams.length;
  const paramLabel = (p: Param) => <><code>{p.name}</code><span className="cp-admin-muted">{p.type}{p.required ? ' · required' : ''}</span></>;
  return <>
    <header className="tr-detail-head">
      <div><h2>{tool.contract.title || tool.name}</h2><code>{tool.name}</code></div>
      {stateLabel(tool, decision)}
    </header>
    {changed ? <>
      <Notice tone="warning">The server changed this tool after you approved it. It stays disabled until you decide.</Notice>
      <div className="history-summary"><span>Changes since you approved it</span><span className="history-count" data-kind="changed">~{count} changed</span></div>
      <div className="history-diff">
        {descriptionChanged ? <section><h5>Description</h5><DiffRows was={was?.description} now={tool.contract.description} /></section> : null}
        {changedParams.map(p => <section key={p.name}><h5>Parameter {p.name}</h5><DiffRows was={before.get(p.name)} now={p.description} /></section>)}
      </div>
      {!descriptionChanged ? <Field label="Description" now={tool.contract.description} changed={false} /> : null}
      {keptParams.map(p => <Field key={p.name} label={paramLabel(p)} now={p.description} changed={false} />)}
    </> : <>
      <Field label="Description" now={tool.contract.description} changed={false} />
      {now.map(p => <Field key={p.name} label={paramLabel(p)} now={p.description} changed={false} />)}
    </>}
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
    </> : <p className="cp-admin-muted">No change since your last review. Its settings are retained.</p>}
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

export function ToolReviewPrototype() {
  const toReview = tools.filter(needsDecision);
  const unchanged = tools.filter(t => !needsDecision(t) && t.change !== 'removed');
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
  const item = (t: ManagedTool) => <li key={t.name}><button type="button" className="tr-item" aria-current={shown === t.name} onClick={() => setShown(t.name)}>
    <span className="tr-item-copy"><strong>{t.contract.title || t.name}</strong><code>{t.name}</code></span>
    {t.change === 'new' || t.change === 'changed' ? <span className="mcp-badge" data-tone="warning">{t.change === 'new' ? 'New' : 'Changed'}</span> : null}
    {stateLabel(t, decisions[t.name])}
  </button></li>;
  return <main className="admin-page cp-admin-container tr-page" aria-label="Tool review prototype">
    <a className="tr-back" href="#"><ArrowLeft size={16} aria-hidden="true" />Integrations</a>
    <header className="access-page-heading tr-page-head">
      <div><span className="cp-admin-label">{server.name} · Custom MCP</span><h1 className="cp-admin-title">Review discovered tools</h1><p className="cp-admin-muted">Decide each new or changed tool. Unchanged tools keep their settings.</p></div>
      <div className="tr-progress"><strong>{done} of {toReview.length} decided</strong><progress className="tr-progress-bar" value={done} max={toReview.length} aria-label="Tools decided" /></div>
    </header>
    <div className="tr-layout">
      <nav className="tr-list" aria-label="Discovered tools">
        <h3 className="cp-admin-label">To review</h3>
        <ul>{toReview.map(item)}</ul>
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
