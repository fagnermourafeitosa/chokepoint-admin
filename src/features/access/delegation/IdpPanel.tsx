import { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { currentAdmin, directory, type Doc, type IdpScope, type SubjectKind } from './fixtures';
import type { Selection } from './layout';
import { WaitingBackend } from './WaitingBackend';

const page = 30;
const nowUtc = () => new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

// Pick subjects of one identity provider: the people to include, or the exceptions.
function SubjectPicker({ issuer, kinds, chosen, onToggle, label }: { issuer: string; kinds: SubjectKind[]; chosen: Set<string>; onToggle: (subject: string, name: string, kind: SubjectKind, on: boolean) => void; label: string }) {
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(page);
  const idp = directory.find(d => d.issuer === issuer);
  const all = [...(kinds.includes('person') ? idp?.people.map(p => ({ ...p, kind: 'person' as const })) ?? [] : []), ...(kinds.includes('service') ? idp?.services.map(p => ({ ...p, kind: 'service' as const })) ?? [] : [])];
  const q = query.trim().toLowerCase();
  const found = (q ? all.filter(x => `${x.name} ${x.subject}`.toLowerCase().includes(q)) : all).sort((a, b) => Number(chosen.has(b.subject)) - Number(chosen.has(a.subject)));
  return <div className="relation-field"><span>{label} · {chosen.size} of {all.length}</span>
    <label className="group-search"><Search size={15} aria-hidden="true" /><input className="cp-admin-input" type="search" placeholder={`Search ${all.length} in ${issuer}…`} value={query} onChange={e => { setQuery(e.target.value); setShown(page); }} aria-label={`Search ${label}`} /></label>
    <ul className="relation-pick">{found.slice(0, shown).map(x => <li key={x.subject}><label><input type="checkbox" checked={chosen.has(x.subject)} onChange={e => onToggle(x.subject, x.name, x.kind, e.target.checked)} /><span>{x.name}<small>{x.kind === 'person' ? 'Person' : 'Service'} · {x.subject}</small></span></label></li>)}</ul>
    {found.length > shown ? <button type="button" className="rule-switch" onClick={() => setShown(n => n + page)}>Show {page} more of {found.length}</button> : null}
  </div>;
}

export function IdpPanel({ doc, issuer, agentName, onChange, onClose }: { doc: Doc; issuer: string; agentName: string; onChange: (d: Doc) => void; onClose: () => void; onSelect: (s: Selection) => void }) {
  const scope = doc.scopes.find(s => s.issuer === issuer);
  if (!scope) return null;
  const set = (patch: Partial<IdpScope>) => onChange({ ...doc, scopes: doc.scopes.map(s => (s.issuer === issuer ? { ...s, ...patch } : s)) });
  const members = new Set(doc.delegations.filter(d => d.issuer === issuer).map(d => d.subject));
  const toggleKind = (k: SubjectKind) => set({ kinds: scope.kinds.includes(k) ? scope.kinds.filter(x => x !== k) : [...scope.kinds, k] });
  const toggleMember = (subject: string, name: string, kind: SubjectKind, on: boolean) => onChange({ ...doc, delegations: on
    ? [...doc.delegations, { id: `d-${issuer}-${subject}`, issuer, subject, name, kind, consent: { source: 'administrator', recordedBy: currentAdmin, recordedAt: nowUtc() } }]
    : doc.delegations.filter(d => !(d.issuer === issuer && d.subject === subject)) });
  return <>
    <header><div><small>Identity provider</small><h4>{issuer}</h4><p className="cp-admin-muted">{issuer} → {agentName}</p></div></header>
    <div className="relation-chips"><WaitingBackend spec="033" tip="Sets who in this identity provider can delegate to the agent, and records the consent." /></div>
    <div className="relation-field"><span>Who can delegate</span>
      <div className="relation-choice" role="radiogroup" aria-label="Who can delegate">
        <label><input type="radio" name="idp-mode" checked={scope.mode === 'everyone'} onChange={() => set({ mode: 'everyone' })} /><span><strong>Everyone in {issuer}</strong><small>Publishing saves one delegation for each subject listed now, except the excluded ones. A subject added to {issuer} later needs a new publication.</small></span></label>
        <label><input type="radio" name="idp-mode" checked={scope.mode === 'selected'} onChange={() => set({ mode: 'selected' })} /><span><strong>Only selected subjects</strong><small>For a small, closed list.</small></span></label>
      </div>
    </div>
    <div className="relation-field"><span>Kinds</span><div className="relation-inline">
      <label><input type="checkbox" checked={scope.kinds.includes('person')} onChange={() => toggleKind('person')} /> People</label>
      <label><input type="checkbox" checked={scope.kinds.includes('service')} onChange={() => toggleKind('service')} /> Services</label>
    </div></div>
    {scope.mode === 'everyone'
      ? <SubjectPicker key="except" issuer={issuer} kinds={scope.kinds} label="Excluded" chosen={new Set(scope.except)} onToggle={(subject, _n, _k, on) => set({ except: on ? [...scope.except, subject] : scope.except.filter(x => x !== subject) })} />
      : <SubjectPicker key="members" issuer={issuer} kinds={scope.kinds} label="Selected" chosen={members} onToggle={toggleMember} />}
    <label className="relation-field"><span>Expires</span><input className="cp-admin-input" type="date" value={scope.expiresAt ?? ''} onChange={e => set({ expiresAt: e.target.value || undefined })} /><small>{scope.expiresAt ? 'Delegation from this identity provider ends on this date.' : 'No expiration.'}</small></label>
    <div className="relation-field"><span>Consent</span><small>{issuer} has no delegation of its own. Recorded by {scope.consent.recordedBy} · {scope.consent.recordedAt}</small></div>
    <p className="cp-admin-muted relation-note">Rules on call data can not target people. Add them to a tool or a resource.</p>
    <footer><button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" onClick={() => { onChange({ ...doc, scopes: doc.scopes.filter(s => s.issuer !== issuer), delegations: doc.delegations.filter(d => d.issuer !== issuer) }); onClose(); }}><Trash2 size={14} aria-hidden="true" />Remove {issuer}</button></footer>
  </>;
}
