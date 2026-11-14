// Admin 048: the Expires select with help that says what happens.
import { useState } from 'react';
import { SelectMenu } from '../../../components/ui/dropdown/SelectMenu';
import { capabilityId, delegationId, idpName, idpSubjects, serverName, type Doc, type SubjectKind } from './model';
import { useCatalog } from './catalog';
import { SubjectList } from './IdpPanel';
import { IncludesField } from './Fields';
import { ExpiresField } from './ExpiresField';
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
    <ExpiresField value={expires} onChange={setExpires} never={`Subjects from ${idpName(catalog, issuer)} can delegate to ${agentName} until you remove it.`} ends={`After this day (UTC), nobody from ${idpName(catalog, issuer)} can delegate to ${agentName}.`} />
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
  // Admin 054 item 16: Expires first, as in the panel of a tool, then the tools to add.
  return <><ExpiresField value={expires || undefined} onChange={v => setExpires(v ?? '')} never="The agent can call these tools until you remove them." ends="After this day (UTC), the agent can no longer call these tools. Its calls are denied." />
    {catalog.servers.map(s => <div key={s.id} className="relation-field"><span>{s.name} · reviewed tools</span><ul className="relation-pick">{catalog.tools.filter(t => t.serverId === s.id).map(t => { const id = capabilityId(t.serverId, t.tool); return <li key={id}><label><input type="checkbox" disabled={granted.has(id)} checked={granted.has(id) || picked.includes(id)} onChange={e => setPicked(p => e.target.checked ? [...p, id] : p.filter(x => x !== id))} /><span>{t.tool}<small>{granted.has(id) ? 'Already granted' : t.mapping ? `Resource: ${t.mapping.kind}` : 'No resource mapping'}</small></span></label></li>; })}</ul></div>)}
    <button type="button" className="cp-admin-button cp-admin-button--small" disabled={!picked.length} onClick={add}>Add {picked.length || ''} to draft</button></>;
}

// Allowed values are not added in the Admin (Admin 048), so there is no Add resource.
const titles: Record<Adding, string> = { delegator: 'Add an identity provider', tool: 'Manage tools', resource: '' };

export function AddPanel(props: Props) {
  return <><header><div><small>Add</small><h4>{titles[props.what]}</h4></div></header>
    {props.what === 'delegator' ? <AddIdentityProvider {...props} /> : props.what === 'tool' ? <AddTool {...props} /> : null}</>;
}
