import { useState } from 'react';
import { Braces, X } from 'lucide-react';
import { Notice } from '../../../src/components/ui/notice/Notice';
import { SelectMenu } from '../../../src/components/ui/dropdown/SelectMenu';
import { findTool, resourceId, serverName, type Doc } from '../../../src/features/access/delegation/model';
import { useCatalog } from '../../../src/features/access/delegation/catalog';
import { toolCallers } from './data';

// Admin 048 prototype: limit a tool of the agent to exact values of one of its arguments.
// 1. the tool, 2. an argument that can identify a resource (a top-level string of the tool
// schema, Backend mapping_resource.go), 3. the values it must equal.
export type ArgumentGroup = { key: string; serverId: string; kind: string; argument: string; tools: string[] };

export function argumentGroups(doc: Doc): ArgumentGroup[] {
  const groups = new Map<string, ArgumentGroup>();
  for (const c of doc.capabilities) {
    if (!c.mapping) continue;
    const key = `${c.serverId}/${c.mapping.kind}`;
    const g = groups.get(key) ?? { key, serverId: c.serverId, kind: c.mapping.kind, argument: c.mapping.pointer.replace(/^\//, '') || c.mapping.kind, tools: [] };
    g.tools.push(c.tool);
    groups.set(key, g);
  }
  return [...groups.values()];
}

const why: Record<string, string> = { number: 'Number. Use a rule to compare it.', integer: 'Number. Use a rule to compare it.', bool: 'Yes or no. Use a rule.' };

export function AllowedValuesPanel({ agentName, doc, published, initialTool, fixed, onRule, onChange }: { agentName: string; doc: Doc; published: Doc; initialTool?: string; fixed?: boolean; onRule?: (argument: string) => void; onChange: (d: Doc) => void }) {
  const { catalog } = useCatalog();
  const [toolId, setToolId] = useState(initialTool ?? doc.capabilities.find(c => c.mapping)?.id ?? doc.capabilities[0]?.id);
  const [text, setText] = useState('');
  const cap = doc.capabilities.find(c => c.id === toolId);
  if (!cap) return <div className="allowed-values"><p className="cp-admin-muted">Add a tool to {agentName} first.</p></div>;
  const server = serverName(catalog, cap.serverId);
  const args = Object.entries(findTool(catalog, cap.serverId, cap.tool)?.args ?? {});
  const mapped = cap.mapping?.pointer.replace(/^\//, '');
  const [chosen, setChosen] = [mapped, (name: string) => onChange({ ...doc, capabilities: doc.capabilities.map(c => (c.id === cap.id ? { ...c, mapping: { pointer: `/${name}`, kind: name } } : c)) })];
  const kind = cap.mapping?.kind;
  const values = kind ? doc.resources.filter(r => r.serverId === cap.serverId && r.kind === kind) : [];
  const sharedWith = kind ? doc.capabilities.filter(c => c.id !== cap.id && c.serverId === cap.serverId && c.mapping?.kind === kind).map(c => c.tool) : [];
  const isNew = (id: string) => !published.resources.some(r => r.id === id);
  const parsed = [...new Set(text.split(/[\s,;]+/).map(v => v.trim()).filter(Boolean))].filter(v => !values.some(r => r.value === v));
  const add = () => {
    if (!parsed.length || !kind) return;
    onChange({ ...doc, resources: [...doc.resources, ...parsed.map(value => ({ id: resourceId(cap.serverId, kind, value), serverId: cap.serverId, kind, value }))] });
    setText('');
  };
  const n = (i: number) => (fixed ? '' : `${i}. `);
  return <div className="allowed-values" data-fixed={fixed || undefined}>
    {fixed ? null : <div className="cp-admin-field"><span>1. Tool</span>
      <SelectMenu block label="Tool" value={cap.id} onChange={v => { setToolId(v); setText(''); }} options={doc.capabilities.map(c => ({ value: c.id, label: `${c.tool} · ${serverName(catalog, c.serverId)}` }))} />
    </div>}

    <div className="cp-admin-field allowed-values-args"><span>{n(2)}Parameter that must match</span>
      <SelectMenu block label="Parameter that must match" value={chosen ?? ''} onChange={v => (v ? setChosen(v) : onChange({ ...doc, capabilities: doc.capabilities.map(c => (c.id === cap.id ? { ...c, mapping: undefined } : c)) }))}
        options={[{ value: '', label: 'None · any value' }, ...args.filter(([, type]) => type === 'string').map(([name]) => ({ value: name, label: name }))]} />
      <small>Only top-level text parameters can be matched.{onRule && args.some(([, type]) => type !== 'string') ? <> Compare the others with a rule. <button type="button" className="rule-switch allowed-values-rule" onClick={() => onRule(args.find(([, type]) => type !== 'string')![0])}><Braces size={13} aria-hidden="true" />Compare with a rule</button></> : ' A rule can check the others.'}</small>
      {cap.mapping ? (() => {
        const others = (toolCallers[cap.id] ?? []).length;
        return <Notice tone="warning" className="allowed-values-info" title={`Applies to every agent that calls ${cap.tool}`}>
          <span>The parameter <code>{chosen}</code> belongs to the tool on {server}, not to {agentName}. An agent without allowed values for it is denied on every call.</span>
          {others ? <span className="allowed-values-others"><span className="mcp-badge">{others}</span>other {others === 1 ? 'agent calls' : 'agents call'} <code>{cap.tool}</code></span> : null}
        </Notice>;
      })() : null}
    </div>

    {chosen ? <>
      <div className="cp-admin-field"><span>{n(3)}Values</span>
        <span className="allowed-values-equation"><code>{chosen}</code><b aria-hidden="true">=</b>
          <input className="cp-admin-input allowed-values-input" aria-label={`${chosen} equals`} value={text} placeholder="exact value" onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
          <button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={!parsed.length} onClick={add}>{parsed.length > 1 ? `Add ${parsed.length}` : 'Add'}</button></span>
        <small>Exact, case-sensitive match. Paste several values separated by commas or new lines.</small>
      </div>
      <section className="allowed-values-list" aria-label={`Allowed ${chosen} values`}>
        <header><span>{agentName} can call {cap.tool} only when</span></header>
        {values.length ? <ul>{values.map(r => <li key={r.id}><span className="allowed-values-row"><code>{chosen}</code> = <code>{r.value}</code></span>{isNew(r.id) ? <span className="mcp-badge">New in draft</span> : null}
          <button type="button" className="relation-icon-button" aria-label={`Remove ${r.value}`} onClick={() => onChange({ ...doc, resources: doc.resources.filter(x => x.id !== r.id) })}><X size={14} /></button></li>)}</ul>
          : <Notice tone="warning" className="allowed-values-empty"><span>No value yet. Every call to <code>{cap.tool}</code> is denied until you add one.</span></Notice>}
      </section>
      {sharedWith.length ? <Notice tone="info" className="allowed-values-note"><span>The same values also limit {sharedWith.map(t => <code key={t}>{t}</code>)}, which uses the same parameter.</span></Notice> : null}
    </> : <Notice tone="info" className="allowed-values-note"><span>Without a parameter, {agentName} can call <code>{cap.tool}</code> with any value.</span></Notice>}
    {fixed ? null : <p className="cp-admin-muted allowed-values-note">Changes go into the draft. Publish to apply them.</p>}
  </div>;
}
