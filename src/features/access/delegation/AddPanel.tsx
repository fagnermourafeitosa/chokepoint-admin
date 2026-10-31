import { useState } from 'react';
import { SelectMenu } from '../../../components/ui/dropdown/SelectMenu';
import { currentAdmin, directory, servers, toolCatalog, type Doc } from './fixtures';
import type { Adding } from './layout';
import { WaitingBackend } from './WaitingBackend';

type Props = { what: Adding; agentName: string; doc: Doc; onChange: (doc: Doc) => void; onDone: () => void };
const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

function AddIdentityProvider({ agentName, doc, onChange, onDone }: Omit<Props, 'what'>) {
  const free = directory.filter(d => !doc.scopes.some(s => s.issuer === d.issuer));
  const [issuer, setIssuer] = useState(free[0]?.issuer ?? '');
  const [mode, setMode] = useState<'everyone' | 'selected'>('everyone');
  const [consent, setConsent] = useState(false);
  if (!free.length) return <p className="cp-admin-muted">Every connected identity provider is already in this list. Open one to change who can delegate.</p>;
  function add() {
    onChange({ ...doc, scopes: [...doc.scopes, { issuer, mode, kinds: ['person', 'service'], except: [], consent: { source: 'administrator', recordedBy: currentAdmin, recordedAt: now() } }] }); onDone();
  }
  return <>
    <div className="relation-field"><span>Identity provider</span><SelectMenu block label="Identity provider" value={issuer} onChange={setIssuer} options={free.map(d => ({ value: d.issuer, label: d.issuer }))} /></div>
    <div className="relation-choice" role="radiogroup" aria-label="Who can delegate">
      <label><input type="radio" name="add-mode" checked={mode === 'everyone'} onChange={() => setMode('everyone')} /><span><strong>Everyone in {issuer}</strong><small>One delegation for each subject listed now. Exclude some later.</small></span></label>
      <label><input type="radio" name="add-mode" checked={mode === 'selected'} onChange={() => setMode('selected')} /><span><strong>Only selected subjects</strong><small>Pick them after you add the provider.</small></span></label>
    </div>
    <label className="relation-consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>The organization agreed that these subjects delegate to <strong>{agentName}</strong>. {issuer} has no delegation of its own, so I record this consent.<small>Recorded by {currentAdmin}, with the date and time.</small></span></label>
    <button type="button" className="cp-admin-button cp-admin-button--small" disabled={!consent} onClick={add}>Add to draft</button>
  </>;
}

function AddTool({ doc, onChange, onDone }: Omit<Props, 'what' | 'agentName'>) {
  const granted = new Set(doc.capabilities.map(c => c.tool));
  const [picked, setPicked] = useState<string[]>([]);
  const [expires, setExpires] = useState('');
  function add() {
    const added = toolCatalog.filter(t => picked.includes(t.tool)).map(t => ({ id: `c-${t.tool}`, serverId: t.serverId, tool: t.tool, expiresAt: expires || undefined, mapping: t.mapping ? { ...t.mapping } : undefined, conditions: [] }));
    onChange({ ...doc, capabilities: [...doc.capabilities, ...added] }); onDone();
  }
  return <>{servers.map(s => <div key={s.id} className="relation-field"><span>{s.name} · reviewed tools</span><ul className="relation-pick">{toolCatalog.filter(t => t.serverId === s.id).map(t => <li key={t.tool}><label><input type="checkbox" disabled={granted.has(t.tool)} checked={granted.has(t.tool) || picked.includes(t.tool)} onChange={e => setPicked(p => e.target.checked ? [...p, t.tool] : p.filter(x => x !== t.tool))} /><span>{t.tool}<small>{granted.has(t.tool) ? 'Already granted' : t.mapping ? `Resource: ${t.mapping.kind}` : 'No resource mapping'}</small></span></label></li>)}</ul></div>)}
    <label className="relation-field"><span>Expires (optional)</span><input className="cp-admin-input" type="date" value={expires} onChange={e => setExpires(e.target.value)} /></label>
    <button type="button" className="cp-admin-button cp-admin-button--small" disabled={!picked.length} onClick={add}>Add {picked.length || ''} to draft</button></>;
}

function AddResource({ doc, onChange, onDone }: Omit<Props, 'what' | 'agentName'>) {
  // A resource is chosen by server and kind, from the granted tools that map that kind.
  const kinds = [...new Map(doc.capabilities.filter(c => c.mapping).map(c => [`${c.serverId}|${c.mapping!.kind}`, c])).values()];
  const [key, setKey] = useState(kinds[0] ? `${kinds[0].serverId}|${kinds[0].mapping!.kind}` : '');
  const [value, setValue] = useState('');
  const [serverId, kind] = key.split('|');
  const tools = doc.capabilities.filter(c => c.serverId === serverId && c.mapping?.kind === kind);
  const exists = doc.resources.some(r => r.serverId === serverId && r.kind === kind && r.value === value.trim());
  if (!kinds.length) return <p className="cp-admin-muted">No granted tool has a resource mapping. Add the mapping in the tool review first.</p>;
  return <>
    <div className="relation-field"><span>Resource type</span><SelectMenu block label="Resource type" value={key} onChange={setKey} options={kinds.map(c => ({ value: `${c.serverId}|${c.mapping!.kind}`, label: `${c.mapping!.kind} · ${servers.find(s => s.id === c.serverId)?.name}` }))} /><small className="cp-admin-muted">Used by {tools.map(t => t.tool).join(', ')}.</small></div>
    <label className="relation-field"><span>{kind} value</span><input className="cp-admin-input" value={value} onChange={e => setValue(e.target.value)} placeholder={kind === 'github_repository' ? 'acme/payments-api' : 'e.g. 3'} /><small className="cp-admin-muted">Must match the mapped argument ({tools[0]?.mapping?.pointer}) in each call.</small></label>
    <button type="button" className="cp-admin-button cp-admin-button--small" disabled={!value.trim() || exists} onClick={() => { onChange({ ...doc, resources: [...doc.resources, { id: `r-${key}-${value.trim()}`, serverId, kind, value: value.trim() }] }); onDone(); }}>{exists ? 'Already allowed' : 'Add to draft'}</button>
  </>;
}

const titles: Record<Adding, string> = { delegator: 'Add an identity provider', tool: 'Add tools', resource: 'Add a resource' };

export function AddPanel(props: Props) {
  return <><header><div><small>Add</small><h4>{titles[props.what]}</h4></div></header><WaitingBackend spec="033" tip="Adds an identity provider, tools or resources to the agent draft." />
    {props.what === 'delegator' ? <AddIdentityProvider {...props} /> : props.what === 'tool' ? <AddTool {...props} /> : <AddResource {...props} />}</>;
}
