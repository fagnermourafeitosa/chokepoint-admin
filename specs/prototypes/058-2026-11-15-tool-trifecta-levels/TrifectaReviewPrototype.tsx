import { useState, type ReactNode } from 'react';
import { ArrowLeft, ChevronRight, Search, Server, TriangleAlert, Wrench } from 'lucide-react';
import { ToolAnnotations } from '../../../src/features/access/components/ToolAnnotations';
import { Notice } from '../../../src/components/ui/notice/Notice';
import { SelectMenu } from '../../../src/components/ui/dropdown/SelectMenu';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import type { ManagedTool } from '../../../src/features/mcp/api';
import { changesOf, params, type Param } from '../../../src/features/mcp/review/toolDiff';
import '../../../src/features/mcp/mcp.css';
import '../../../src/features/access/delegation/delegation.css';
import '../../../src/features/mcp/review/tool-review.css';
import { server, tools as fixture, type Leg, type LegLevel, type Level, type TrifectaTool } from './data';
import { TourButton } from './TourButton';
import './prototype.css';

// Admin 058 prototype: the review page of Admin 055 and 057 with the trifecta levels of Backend 097.
// Each tool shows the level that the labeler gave to each leg, and the reviewer can correct one.
// Copied from src/features/mcp/review/ToolReviewPage.tsx; fixed data, nothing is saved.

type Decision = 'approved' | 'denied';
const needsDecision = (t: ManagedTool) => t.change === 'new' || t.change === 'changed';

const owaspUrl = 'https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/';
const guide: { text: string; owasp: string; name: string; page: number; changedOnly?: boolean }[] = [
  { text: 'Gives the model an order, in the description or in a parameter, such as "before you answer", "ignore" or "do not tell the user".', owasp: 'ASI04', name: 'Agentic Supply Chain Vulnerabilities', page: 18 },
  { text: 'Tells the model to call another tool, or to send data or secrets to another place.', owasp: 'ASI02', name: 'Tool Misuse and Exploitation', page: 12 },
  { text: 'Changed since you approved it, and you do not know why.', owasp: 'ASI04', name: 'Agentic Supply Chain Vulnerabilities', page: 18, changedOnly: true },
];

// The three legs, in the words of the open roadmap item.
// What each level means, from the level definitions of Backend 097 Implementation Decision 8.
const legs: { key: Leg; label: string; means: Record<Level, string> }[] = [
  { key: 'private_data', label: 'Reads private data', means: {
    none: 'Reads only public data, or reads nothing.',
    low: 'Reads private data only as metadata, or in a narrow scope that the call names.',
    high: 'Reads private records or content of people or of the business.' } },
  { key: 'untrusted_content', label: 'Brings untrusted content', means: {
    none: 'Returns only data the customer controls, or computed values.',
    low: 'Returns third-party text only in short, structured fields.',
    high: 'Returns free text that a third party can write.' } },
  { key: 'external_communication', label: 'Sends data out', means: {
    none: 'Sends nothing out of the server.',
    low: 'Writes only to a fixed destination of the customer, chosen by the server.',
    high: 'Sends data to a destination that the call chooses or that others can read.' } },
];
const levelOptions = [
  { value: 'none', label: 'OK' },
  { value: 'low', label: 'Low' },
  { value: 'high', label: 'High' },
];

function Field({ label, now }: { label: ReactNode; now?: string }) {
  return <div className="tr-field"><div className="tr-field-label">{label}</div><p className="tr-text">{now || <span className="cp-admin-muted">No description.</span>}</p></div>;
}

function StateLabel({ tool, decision }: { tool: TrifectaTool; decision?: Decision }) {
  if (tool.change === 'removed') return <span className="tr-state cp-admin-muted">Disabled</span>;
  if (!needsDecision(tool)) return <span className="tr-state cp-admin-muted">No change</span>;
  if (!decision) return <span className="tr-state" data-state="pending">To review</span>;
  if (tool.change === 'changed') return <span className="tr-state" data-state={decision}>{decision === 'approved' ? 'Change trusted' : 'Kept disabled'}</span>;
  return <span className="tr-state" data-state={decision}>{decision === 'approved' ? 'Approved' : 'Denied'}</span>;
}

function Guide({ changed }: { changed: boolean }) {
  return <details className="cp-admin-accordion cp-admin-accordion--warning tr-guide">
    <summary><TriangleAlert size={16} aria-hidden="true" />Before you decide</summary>
    <div>
      <p>Read the text above as the model will. Deny the tool if the text:</p>
      <ul>{guide.filter(g => changed || !g.changedOnly).map(g => <li key={g.text}><span>{g.text}</span> <a href={owaspUrl} target="_blank" rel="noopener noreferrer">OWASP {g.owasp} · {g.name}, p. {g.page} ↗</a></li>)}
        <li><span>Shows two High legs in the lethal trifecta block: with another tool that brings the third leg, it can send private data out after reading an injected instruction.</span> <a href="https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/" target="_blank" rel="noopener noreferrer">The lethal trifecta for AI agents, Simon Willison ↗</a></li></ul>
      <p className="cp-admin-muted">You cannot edit this text. Agents get it exactly as you approve it.</p>
    </div>
  </details>;
}

const levelName: Record<Level, string> = { none: 'OK', low: 'Low', high: 'High' };
// One meaning per color: OK green, Low warning, High red.
const levelTone: Record<Level, string> = { none: 'success', low: 'warning', high: 'danger' };

function TrifectaLevels({ tool, levels, original, correct }: { tool: TrifectaTool; levels: Record<Leg, LegLevel>; original: Record<Leg, LegLevel>; correct: (leg: Leg, level: Level | undefined) => void }) {
  const [editing, setEditing] = useState(false);
  const high = legs.filter(l => levels[l.key].level === 'high').length;
  return <section className="tl-section" aria-label="Lethal trifecta">
    <header className="tl-head">
      <h3 className="cp-admin-label"><Search size={14} aria-hidden="true" />Lethal trifecta <WaitingBackend spec="097" tip="The level of each leg that the labeler gave from the text of this tool, and its source. The gateway denies the call that closes the three legs in one session." /></h3>
    </header>
    <div className="tl-line">
      <ul className="tl-legs">
        {legs.map(leg => {
          const value = levels[leg.key];
          return <li key={leg.key}>
            <div className="tl-leg-head">
            <span>{leg.label}</span>
            {editing
              ? <SelectMenu label={`${leg.label} level of ${tool.name}`} value={value.level} options={levelOptions} onChange={v => correct(leg.key, v === original[leg.key].level ? undefined : v as Level)} />
              : <span className="mcp-badge" data-tone={levelTone[value.level]}>{levelName[value.level]}</span>}
            </div>
            <p className="tl-means">{leg.means[value.level]}</p>
            {value.source === 'operator' ? <small>Corrected{editing ? <> · <button type="button" className="tl-undo" onClick={() => correct(leg.key, undefined)}>Undo</button></> : null}</small> : null}
          </li>;
        })}
      </ul>
    </div>
    <p className="tl-why">{editing
      ? <>Pick the level that the text of this tool supports. Your level replaces the model's for this version of the tool and is kept in the review history; when the server changes the tool, the model labels it again. <button type="button" className="tl-link" onClick={() => setEditing(false)}>Done</button></>
      : <>A model read the tool text and set these levels. <button type="button" className="tl-link" onClick={() => setEditing(true)}>Model is wrong?</button></>}</p>
    {/* The result of the three legs together: the only part that asks for attention. */}
    {high === 3 ? <Notice tone="warning">This tool reads private data, brings untrusted content and sends data out. Every call to it closes the lethal trifecta and is denied.</Notice>
      : high === 2 ? <Notice tone="warning">Two legs are High. In a session where another tool brings the third leg, the call that closes it is denied.</Notice> : null}
  </section>;
}

function ToolDetail({ tool, decision, levels, correct, decide }: { tool: TrifectaTool; decision?: Decision; levels: Record<Leg, LegLevel>; correct: (leg: Leg, level: Level | undefined) => void; decide: (d: Decision) => void }) {
  const changed = tool.change === 'changed';
  const items = changed && tool.previous ? changesOf(tool.previous, tool.contract) : [];
  const touched = new Set(items.map(i => i.section));
  const label = (p: Param) => <><code>{p.name}</code><span className="cp-admin-muted">{p.type}{p.required ? ' · required' : ''}</span></>;
  return <>
    <header className="tr-detail-head">
      <div><h2 className="tl-icon-title"><Wrench size={18} aria-hidden="true" />{tool.contract.title || tool.name}</h2><code>{tool.name}</code></div>
      <StateLabel tool={tool} decision={decision} />
    </header>
    {changed ? <>
      <Notice tone="warning">The server changed this tool after you approved it. It stays disabled until you decide.</Notice>
      {tool.granted_agents ? <p className="tr-granted">Granted to {tool.granted_agents} agents in their published permissions</p> : null}
      <div className="history-summary"><span>Changes since you approved it</span><span className="history-count" data-kind="changed">~{items.length} changed</span></div>
      <div className="history-diff">{items.map((item, i) => <section key={i}><h5>{item.section}</h5><ul>{item.rows.map((r, j) => <li key={j} data-kind={r.kind}><span className="history-sign" aria-label={r.kind}>{r.kind === 'added' ? '+' : r.kind === 'removed' ? '−' : '~'}</span><strong>{r.json ? <code>{r.text}</code> : r.text}</strong>{r.detail ? <code>{r.detail}</code> : null}</li>)}</ul></section>)}</div>
    </> : null}
    {!touched.has('Description') ? <Field label="Description" now={tool.contract.description} /> : null}
    {params(tool.contract).filter(p => !touched.has(`Parameter ${p.name}`)).map(p => <Field key={p.name} label={label(p)} now={p.description} />)}
    <ToolAnnotations annotations={tool.contract.annotations} />
    <TrifectaLevels key={tool.name} tool={tool} levels={levels} original={tool.trifecta} correct={correct} />
    {needsDecision(tool) ? <>
      <Guide changed={changed} />
      <div className="tr-decision">
        <button type="button" className="cp-admin-button cp-admin-button--secondary" aria-pressed={decision === 'denied'} onClick={() => decide('denied')}>{changed ? `Keep ${tool.name} disabled` : `Deny ${tool.name}`}</button>
        <button type="button" className="cp-admin-button" aria-pressed={decision === 'approved'} onClick={() => decide('approved')}>{changed ? 'Trust this change' : `Approve ${tool.name}`}</button>
      </div>
    </> : <p className="cp-admin-muted">No change since your last review. Its settings are retained.</p>}
  </>;
}

export function TrifectaReviewPrototype() {
  const tools = fixture;
  const toReview = tools.filter(needsDecision).sort((a, b) => a.review_order - b.review_order || a.name.localeCompare(b.name));
  const unchanged = tools.filter(t => t.change === 'unchanged');
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [corrections, setCorrections] = useState<Record<string, Partial<Record<Leg, Level>>>>({});
  const [shown, setShown] = useState(toReview[0]?.name ?? '');
  const [showUnchanged, setShowUnchanged] = useState(false);
  const done = toReview.filter(t => decisions[t.name]).length;
  const tool = tools.find(t => t.name === shown);
  const levelsOf = (t: TrifectaTool): Record<Leg, LegLevel> => Object.fromEntries(legs.map(l => {
    const c = corrections[t.name]?.[l.key];
    return [l.key, c ? { level: c, source: 'operator' } : t.trifecta[l.key]];
  })) as Record<Leg, LegLevel>;
  const correct = (name: string) => (leg: Leg, level: Level | undefined) => setCorrections(prev => {
    const next = { ...(prev[name] ?? {}) };
    if (level) next[leg] = level; else delete next[leg];
    return { ...prev, [name]: next };
  });
  const decide = (d: Decision) => {
    const next = { ...decisions, [shown]: d };
    setDecisions(next);
    const pending = toReview.find(t => !next[t.name]);
    if (pending) setShown(pending.name);
  };
  const item = (t: TrifectaTool) => <li key={t.name}><button type="button" className="tr-item" aria-current={shown === t.name} onClick={() => setShown(t.name)}>
    <span className="tr-item-copy"><strong>{t.contract.title || t.name}</strong>{t.granted_agents && needsDecision(t) ? <small className="tr-item-use">Granted to {t.granted_agents} agents</small> : null}</span>
    {t.change === 'new' || t.change === 'changed' ? <span className="mcp-badge" data-tone="warning">{t.change === 'new' ? 'New' : 'Changed'}</span> : null}
    <StateLabel tool={t} decision={decisions[t.name]} />
  </button></li>;
  return <section className="tr-page" aria-label="Review discovered tools">
    <a className="tr-back" href="/prototype"><ArrowLeft size={16} aria-hidden="true" />Integrations</a>
    <header className="access-page-heading tr-page-head">
      <div><span className="cp-admin-label tl-icon-title"><Server size={14} aria-hidden="true" />{server.name}</span><h1 className="cp-admin-title">Review discovered tools</h1><p className="cp-admin-muted">Decide each new or changed tool. Unchanged tools keep their settings.</p></div>
      <div className="tr-progress"><strong>{done} of {toReview.length} decided</strong><progress className="tr-progress-bar" value={done} max={toReview.length} aria-label="Tools decided" /></div>
    </header>
    <div className="tr-layout">
      <nav className="tr-list" aria-label="Discovered tools">
        <div className="tr-group-head"><h3 className="cp-admin-label">To review</h3></div>
        <ul>{toReview.map(item)}</ul>
        {unchanged.length ? <><button type="button" className="tr-group-toggle" aria-expanded={showUnchanged} onClick={() => setShowUnchanged(v => !v)}><ChevronRight size={16} aria-hidden="true" />{unchanged.length} unchanged {unchanged.length === 1 ? 'tool' : 'tools'}</button>
          {showUnchanged ? <ul>{unchanged.map(item)}</ul> : null}</> : null}
      </nav>
      <section className="tr-detail" aria-label="Reviewing">
        {tool ? <ToolDetail tool={tool} decision={decisions[tool.name]} levels={levelsOf(tool)} correct={correct(tool.name)} decide={decide} /> : null}
      </section>
    </div>
    <footer className="tr-footer"><TourButton inline /><div><a className="cp-admin-button cp-admin-button--secondary" href="/prototype">Cancel</a><button type="button" className="cp-admin-button" disabled={done < toReview.length}>Confirm review</button></div></footer>
  </section>;
}
