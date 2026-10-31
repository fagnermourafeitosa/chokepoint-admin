import { useState } from 'react';
import { CircleHelp, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { Tooltip } from '../../../components/ui/tooltip/Tooltip';
import { currentAdmin, directory, type Doc, type IdpScope, type SubjectKind } from './fixtures';
import type { Selection } from './layout';
import { WaitingBackend } from './WaitingBackend';

const page = 30;
const kindHelp = 'People are employees who sign in to the identity provider and use an agent. Services are service accounts: a system that runs the agent by itself with its own token, for example a Keycloak client with a service account or a Google service account.';
const nowUtc = () => new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

// Pick subjects of one identity provider: the people to include, or the exceptions.
// One list with a People section and a Services section, so services never hide behind a long list of people.
const sectionPage = 10;
function SubjectPicker({ issuer, kinds, chosen, onToggle, label }: { issuer: string; kinds: SubjectKind[]; chosen: Set<string>; onToggle: (subject: string, name: string, kind: SubjectKind, on: boolean) => void; label: string }) {
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState<Record<SubjectKind, number>>({ person: sectionPage, service: sectionPage });
  const idp = directory.find(d => d.issuer === issuer);
  const lists: Record<SubjectKind, { subject: string; name: string }[]> = { person: idp?.people ?? [], service: idp?.services ?? [] };
  if (!kinds.length) return <p className="cp-admin-muted">Select People, Services or both.</p>;
  const q = query.trim().toLowerCase();
  const total = kinds.reduce((n, k) => n + lists[k].length, 0), picked = kinds.reduce((n, k) => n + lists[k].filter(x => chosen.has(x.subject)).length, 0);
  return <div className="relation-field"><span>{label} · {picked} of {total}</span>
    <label className="group-search"><Search size={15} aria-hidden="true" /><input className="cp-admin-input" type="search" placeholder={`Search ${total} in ${issuer}…`} value={query} onChange={e => { setQuery(e.target.value); setShown({ person: sectionPage, service: sectionPage }); }} aria-label={`Search ${label}`} /></label>
    <div className="relation-pick">{kinds.map(k => {
      const found = (q ? lists[k].filter(x => `${x.name} ${x.subject}`.toLowerCase().includes(q)) : lists[k]).sort((x, y) => Number(chosen.has(y.subject)) - Number(chosen.has(x.subject)));
      return <section key={k} className="relation-pick-section"><h5>{k === 'person' ? 'People' : 'Services'} <span>{found.length}</span></h5>
        {found.length ? <ul>{found.slice(0, shown[k]).map(x => <li key={x.subject}><label><input type="checkbox" checked={chosen.has(x.subject)} onChange={e => onToggle(x.subject, x.name, k, e.target.checked)} /><span>{x.name}<small>{x.subject}</small></span></label></li>)}</ul> : <p className="cp-admin-muted">No match.</p>}
        {found.length > shown[k] ? <button type="button" className="rule-switch" onClick={() => setShown(v => ({ ...v, [k]: v[k] + sectionPage * 3 }))}>Show more ({found.length - shown[k]})</button> : null}
      </section>;
    })}</div>
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
    <div className="relation-field"><span className="relation-label">Includes<Tooltip content={kindHelp}><CircleHelp size={14} aria-label="About people and services" /></Tooltip></span>
      <div className="relation-choice">
        <label><input type="checkbox" checked={scope.kinds.includes('person')} onChange={() => toggleKind('person')} /><span><strong>People</strong><small>Employees who sign in and use an agent, for example in their editor.</small></span></label>
        <label><input type="checkbox" checked={scope.kinds.includes('service')} onChange={() => toggleKind('service')} /><span><strong>Services</strong><small>Service accounts. A system runs the agent by itself with its own token, for example a release pipeline.</small></span></label>
      </div>
    </div>
    {scope.mode === 'everyone'
      ? <SubjectPicker key="except" issuer={issuer} kinds={scope.kinds} label="Excluded" chosen={new Set(scope.except)} onToggle={(subject, _n, _k, on) => set({ except: on ? [...scope.except, subject] : scope.except.filter(x => x !== subject) })} />
      : <SubjectPicker key="members" issuer={issuer} kinds={scope.kinds} label="Selected" chosen={members} onToggle={toggleMember} />}
    <div className="relation-field"><span>Expires</span>
      <div className="relation-choice" role="radiogroup" aria-label="Expires">
        <label><input type="radio" name="idp-expires" checked={!scope.expiresAt} onChange={() => set({ expiresAt: undefined })} /><span><strong>Never</strong><small>The delegation stays until you remove it.</small></span></label>
        <label><input type="radio" name="idp-expires" checked={!!scope.expiresAt} onChange={() => set({ expiresAt: scope.expiresAt ?? new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10) })} /><span><strong>On a date</strong><small>Delegation from this identity provider ends on this date.</small></span></label>
      </div>
      {scope.expiresAt ? <input className="cp-admin-input" type="date" aria-label="Expiration date" value={scope.expiresAt} onChange={e => set({ expiresAt: e.target.value || undefined })} /> : null}
    </div>
    <div className="consent-record" role="note" aria-label="Consent record">
      <ShieldCheck size={18} aria-hidden="true" />
      <div><strong>Last consent recorded</strong><small>by {scope.consent.recordedBy} · {scope.consent.recordedAt}</small></div>
      <Tooltip content={`${scope.consent.recordedBy} confirmed that these subjects agreed to let ${agentName} act for them. ${issuer} can not record this consent itself, so the Admin records who confirmed and when, from the signed-in administrator.`}><CircleHelp size={15} aria-label="About consent" /></Tooltip>
    </div>
    <footer><button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" onClick={() => { onChange({ ...doc, scopes: doc.scopes.filter(s => s.issuer !== issuer), delegations: doc.delegations.filter(d => d.issuer !== issuer) }); onClose(); }}><Trash2 size={14} aria-hidden="true" />Remove {issuer}</button></footer>
  </>;
}
