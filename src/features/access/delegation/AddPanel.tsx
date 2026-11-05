import { useState } from 'react';
import { SelectMenu } from '../../../components/ui/dropdown/SelectMenu';
import { capabilityId, delegationId, idpName, idpSubjects, resourceId, serverName, type Doc, type SubjectKind } from './model';
import { useCatalog } from './catalog';
import { SubjectList } from './IdpPanel';
import { ExpiresField, IncludesField } from './Fields';
import type { Adding } from './layout';

type Props = { what: Adding; agentName: string; doc: Doc; onChange: (doc: Doc) => void; onDone: () => void };

function AddIdentityProvider({ agentName, doc, onChange, onDone }: Omit<Props, 'what'>) {
  const { catalog } = useCatalog();
  const free = catalog.idps.filter(i => i.enabled && !doc.scopes.some(s => s.issuer === i.id));
  const [issuer, setIssuer] = useState(free[0]?.id ?? '');
  const [kinds, setKinds] = useState<SubjectKind[]>(['person', 'service']);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [expires, setExpires] = useState<string>();
  const [consent, setConsent] = useState(false);
  if (!free.length) return <p className="cp-admin-muted">Every enabled identity provider is already in this list. Open one to change who can delegate, or connect another in Identity providers.</p>;
  const picked = idpSubjects(catalog, issuer, kinds).filter(x => chosen.has(x.subject));
  function add() {
    onChange({ ...doc, scopes: [...doc.scopes, { issuer, kinds, expiresAt: expires, confirmed: true }], delegations: [...doc.delegations, ...picked.map(x => ({ id: delegationId(issuer, x.subject), issuer, subject: x.subject, kind: x.kind }))] }); onDone();
  }
  return <>
    <div className="relation-field"><span>Identity provider</span><SelectMenu block label="Identity provider" value={issuer} onChange={v => { setIssuer(v); setChosen(new Set()); }} options={free.map(i => ({ value: i.id, label: i.name }))} /></div>
    <IncludesField value={kinds} onChange={setKinds} />
    <SubjectList key={issuer} issuer={issuer} kinds={kinds} chosen={chosen} onSet={(subjects, on) => setChosen(c => { const n = new Set(c); subjects.forEach(x => (on ? n.add(x.subject) : n.delete(x.subject))); return n; })} />
    <ExpiresField name="add-idp-expires" value={expires} onChange={setExpires} dateText="Delegation from this identity provider ends at the end of this day (UTC)." />
    <label className="relation-consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>I confirm that these subjects agreed to let <strong>{agentName}</strong> act for them.<small>{idpName(catalog, issuer)} can not record this consent itself, so Xokepoint records your name and the time when you publish.</small></span></label>
    <button type="button" className="cp-admin-button cp-admin-button--small" disabled={!consent || !picked.length} onClick={add}>Add {picked.length || ''} to draft</button>
  </>;
}

function AddTool({ doc, onChange, onDone }: Omit<Props, 'what' | 'agentName'>) {
  const { catalog } = useCatalog();
  const granted = new Set(doc.capabilities.map(c => c.id));
  const [picked, setPicked] = useState<string[]>([]);
  const [expires, setExpires] = useState('');
  function add() {
    const added = catalog.tools.filter(t => picked.includes(capabilityId(t.serverId, t.tool))).map(t => ({ id: capabilityId(t.serverId, t.tool), serverId: t.serverId, tool: t.tool, expiresAt: expires || undefined, mapping: t.mapping, conditions: [] }));
    onChange({ ...doc, capabilities: [...doc.capabilities, ...added] }); onDone();
  }
  if (!catalog.tools.length) return <p className="cp-admin-muted">No reviewed tools yet. Connect an MCP server and review its tools in Integrations.</p>;
  return <>{catalog.servers.map(s => <div key={s.id} className="relation-field"><span>{s.name} · reviewed tools</span><ul className="relation-pick">{catalog.tools.filter(t => t.serverId === s.id).map(t => { const id = capabilityId(t.serverId, t.tool); return <li key={id}><label><input type="checkbox" disabled={granted.has(id)} checked={granted.has(id) || picked.includes(id)} onChange={e => setPicked(p => e.target.checked ? [...p, id] : p.filter(x => x !== id))} /><span>{t.tool}<small>{granted.has(id) ? 'Already granted' : t.mapping ? `Resource: ${t.mapping.kind}` : 'No resource mapping'}</small></span></label></li>; })}</ul></div>)}
    <ExpiresField name="add-tools-expires" value={expires || undefined} onChange={v => setExpires(v ?? '')} dateText="Access to these tools ends at the end of this day (UTC)." />
    <button type="button" className="cp-admin-button cp-admin-button--small" disabled={!picked.length} onClick={add}>Add {picked.length || ''} to draft</button></>;
}

function AddResource({ doc, onChange, onDone }: Omit<Props, 'what' | 'agentName'>) {
  const { catalog } = useCatalog();
  // A resource is chosen by server and resource type, from the granted tools that map that type.
  const kinds = [...new Map(doc.capabilities.filter(c => c.mapping).map(c => [`${c.serverId}|${c.mapping!.kind}`, c])).values()];
  const [key, setKey] = useState(kinds[0] ? `${kinds[0].serverId}|${kinds[0].mapping!.kind}` : '');
  const [value, setValue] = useState('');
  const [serverId, kind] = key.split('|');
  const tools = doc.capabilities.filter(c => c.serverId === serverId && c.mapping?.kind === kind);
  const trimmed = value.trim();
  const exists = doc.resources.some(r => r.serverId === serverId && r.kind === kind && r.value === trimmed);
  if (!kinds.length) return <p className="cp-admin-muted">No granted tool has a resource mapping. Add the mapping in the tool review first.</p>;
  const pointer = tools.find(t => t.mapping?.pointer)?.mapping?.pointer;
  return <>
    <div className="relation-field"><span>Resource type</span><SelectMenu block label="Resource type" value={key} onChange={setKey} options={kinds.map(c => ({ value: `${c.serverId}|${c.mapping!.kind}`, label: `${c.mapping!.kind} · ${serverName(catalog, c.serverId)}` }))} /><small className="cp-admin-muted">Used by {tools.map(t => t.tool).join(', ')}.</small></div>
    <label className="relation-field"><span>{kind} value</span><input className="cp-admin-input" value={value} maxLength={512} onChange={e => setValue(e.target.value)} placeholder="Exact value" /><small className="cp-admin-muted">{pointer ? `Must match the argument ${pointer} of each call exactly.` : 'Must match the resource of each call exactly.'}</small></label>
    <button type="button" className="cp-admin-button cp-admin-button--small" disabled={!trimmed || exists} onClick={() => { onChange({ ...doc, resources: [...doc.resources, { id: resourceId(serverId, kind, trimmed), serverId, kind, value: trimmed }] }); onDone(); }}>{exists ? 'Already allowed' : 'Add to draft'}</button>
  </>;
}

const titles: Record<Adding, string> = { delegator: 'Add an identity provider', tool: 'Add tools', resource: 'Add a resource' };

export function AddPanel(props: Props) {
  return <><header><div><small>Add</small><h4>{titles[props.what]}</h4></div></header>
    {props.what === 'delegator' ? <AddIdentityProvider {...props} /> : props.what === 'tool' ? <AddTool {...props} /> : <AddResource {...props} />}</>;
}
