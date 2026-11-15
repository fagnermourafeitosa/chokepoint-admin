import { useState, type MouseEvent } from 'react';
import { X } from 'lucide-react';
import { ToolRows } from '../../../src/features/mcp/ToolRows';
import { ToolAnnotations } from '../../../src/features/access/components/ToolAnnotations';
import type { ManagedTool, ToolContract } from '../../../src/features/mcp/api';
import '../../../src/components/ui/dialog/dialog.css';
import '../../../src/features/mcp/mcp.css';
import { guide, owaspUrl, server, tools } from './data';
import './tool-review.css';

// Admin 055 prototype: the Review discovered tools dialog (a copy of the preview step of
// src/features/mcp/MCPDialog.tsx on 2026-11-14, fixed data). The dialog is wider: the tool list stays
// on the left with its selection; the right column shows, without JSON, the whole text that the model
// reads for the chosen tool, the change since approval, and what the reviewer looks for. Nobody edits
// the text: the reviewer approves or denies the tool.

type Param = { name: string; type: string; required: boolean; description?: string };
function params(contract?: ToolContract): Param[] {
  const schema = contract?.inputSchema as { properties?: Record<string, { type?: string; description?: string }>; required?: string[] } | undefined;
  return Object.entries(schema?.properties ?? {}).map(([name, p]) => ({ name, type: p.type ?? 'any', required: schema?.required?.includes(name) ?? false, description: p.description }));
}

// Marks the part of a text that differs between the approved and the discovered version.
function Changed({ before = '', after = '', side }: { before?: string; after?: string; side: 'before' | 'after' }) {
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start++;
  let end = 0;
  while (end < before.length - start && end < after.length - start && before[before.length - 1 - end] === after[after.length - 1 - end]) end++;
  const text = side === 'after' ? after : before;
  const middle = text.slice(start, text.length - end);
  return <>{text.slice(0, start)}{middle ? <mark className="tool-review-mark" data-side={side}>{middle}</mark> : null}{text.slice(text.length - end)}</>;
}

function ToolText({ tool }: { tool: ManagedTool }) {
  const now = tool.contract;
  const was = tool.change === 'changed' ? tool.previous : undefined;
  const before = new Map(params(was).map(p => [p.name, p.description]));
  return <>
    <section className="tool-review-block" aria-labelledby="tool-review-description">
      <h4 id="tool-review-description" className="cp-admin-label">Description</h4>
      {was && was.description !== now.description ? <div className="tool-review-compare">
        <div><span className="cp-admin-muted">Approved</span><p className="tool-review-text"><Changed before={was.description} after={now.description} side="before" /></p></div>
        <div><span className="cp-admin-muted">Discovered now</span><p className="tool-review-text"><Changed before={was.description} after={now.description} side="after" /></p></div>
      </div> : <p className="tool-review-text">{now.description || <span className="cp-admin-muted">The server sends no description.</span>}</p>}
    </section>
    <section className="tool-review-block" aria-labelledby="tool-review-params">
      <h4 id="tool-review-params" className="cp-admin-label">Parameters</h4>
      {params(now).length ? <dl className="tool-review-params">{params(now).map(p => <div key={p.name}>
        <dt><code>{p.name}</code><span className="cp-admin-muted">{p.type}{p.required ? ' · required' : ''}</span></dt>
        <dd className="tool-review-text">{was && before.get(p.name) !== p.description ? <Changed before={before.get(p.name)} after={p.description} side="after" /> : p.description || <span className="cp-admin-muted">No description.</span>}</dd>
      </div>)}</dl> : <p className="cp-admin-muted">No parameters.</p>}
    </section>
    <ToolAnnotations annotations={now.annotations} />
  </>;
}

function Guide({ changed }: { changed: boolean }) {
  return <aside className="tool-review-guide" aria-labelledby="tool-review-guide">
    <h4 id="tool-review-guide">Before you approve</h4>
    <p>Read the text above as the model will. Deny the tool if the text:</p>
    <ul>{guide.filter(g => changed || !g.changedOnly).map(g => <li key={g.text}><span>{g.text}</span><a href={owaspUrl} target="_blank" rel="noopener noreferrer">OWASP {g.owasp} · {g.name}, p. {g.page} ↗</a></li>)}</ul>
    <p className="cp-admin-muted">You cannot edit this text. Agents get it exactly as you approve it.</p>
  </aside>;
}

function ServerText() {
  return <>
    <section className="tool-review-block" aria-labelledby="tool-review-instructions">
      <h4 id="tool-review-instructions" className="cp-admin-label">Instructions</h4>
      <p className="tool-review-text">{server.instructions}</p>
      <p className="cp-admin-muted">Not sent to agents.</p>
    </section>
    <section className="tool-review-block" aria-labelledby="tool-review-identity">
      <h4 id="tool-review-identity" className="cp-admin-label">Server identity</h4>
      <p className="tool-review-text"><code>{server.upstream.name}</code> · version <code>{server.upstream.version}</code></p>
      <p className="cp-admin-muted">Agents get the name {server.name} from this registry, not the name and version of the server.</p>
    </section>
  </>;
}

export function ToolReviewPrototype() {
  const [selected, setSelected] = useState(tools.filter(t => t.selected).map(t => t.name));
  const [shown, setShown] = useState('refund_order');
  const tool = tools.find(t => t.name === shown);
  const pick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('input, summary, a, details')) return;
    const name = target.closest('.mcp-tool-row')?.querySelector('code')?.textContent;
    if (name) setShown(name);
  };
  const available = tools.filter(t => t.change !== 'removed');
  return <main className="admin-page cp-admin-container" aria-label="Tool review prototype">
    <div className="cp-admin-dialog admin-dialog mcp-dialog tool-review-dialog" role="dialog" aria-labelledby="tool-review-title">
      <div className="admin-dialog-header"><div><h2 id="tool-review-title">Review discovered tools</h2><p className="cp-admin-muted">{server.name}</p></div><button type="button" className="admin-dialog-close" aria-label="Close"><X size={18} aria-hidden="true" /></button></div>
      <div className="admin-dialog-body tool-review-body">
        <div className="tool-review-list">
          <div className="mcp-preview-summary"><strong>{available.length} available tools</strong><span>{selected.length} selected</span></div>
          <p className="cp-admin-notice">New, changed, and removed rows are highlighted. Changed and removed tools stay disabled until reviewed. Unchanged settings are retained.</p>
          <button type="button" className="tool-review-server" aria-pressed={shown === 'server'} onClick={() => setShown('server')}><span><strong>Server</strong><span className="cp-admin-muted">Instructions and identity sent at connection</span></span><span className="mcp-badge" data-tone="warning">Instructions</span></button>
          <div className="tool-review-rows" onClick={pick}><ToolRows tools={tools} selected={selected} focusTool={shown === 'server' ? undefined : shown} onToggle={name => setSelected(old => old.includes(name) ? old.filter(n => n !== name) : [...old, name])} /></div>
        </div>
        <section className="tool-review-detail" aria-label="What the model reads">
          {shown === 'server' ? <>
            <header><span className="cp-admin-label">What the server sent</span><h3>Server</h3></header>
            <ServerText />
          </> : tool ? <>
            <header><span className="cp-admin-label">What the model reads</span><h3>{tool.contract.title || tool.name}</h3><div className="tool-review-name"><code>{tool.name}</code>{tool.change !== 'unchanged' ? <span className="mcp-badge" data-tone={tool.change === 'removed' ? 'danger' : 'warning'}>{tool.change === 'new' ? 'New' : tool.change === 'changed' ? 'Changed' : 'Removed'}</span> : null}</div></header>
            <ToolText tool={tool} />
            <Guide changed={tool.change === 'changed'} />
          </> : null}
        </section>
      </div>
      <div className="admin-dialog-actions"><button type="button" className="cp-admin-button cp-admin-button--secondary">Cancel</button><button type="button" className="cp-admin-button">Confirm review</button></div>
    </div>
  </main>;
}
