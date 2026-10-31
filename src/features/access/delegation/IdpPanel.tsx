import { useState } from 'react';
import { CircleHelp, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { Tooltip } from '../../../components/ui/tooltip/Tooltip';
import { currentAdmin, delegationOf, idpSubjects, type Doc, type IdpScope, type SubjectKind } from './fixtures';
import type { Selection } from './layout';
import { WaitingBackend } from './WaitingBackend';
import { ExpiresField, IncludesField } from './Fields';

const sectionPage = 10;
const nowUtc = () => new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
const kindLabel: Record<SubjectKind, string> = { person: 'People', service: 'Services' };
type Subject = { subject: string; name: string; kind: SubjectKind };

// Who can delegate: one list with a People and a Services section. Checked subjects can delegate; Select all checks everyone.
export function SubjectList({ issuer, kinds, chosen, onSet }: { issuer: string; kinds: SubjectKind[]; chosen: Set<string>; onSet: (subjects: Subject[], on: boolean) => void }) {
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState<Record<SubjectKind, number>>({ person: sectionPage, service: sectionPage });
  if (!kinds.length) return <p className="cp-admin-muted">Select People, Services or both.</p>;
  const all = idpSubjects(issuer, kinds);
  const q = query.trim().toLowerCase();
  const picked = all.filter(x => chosen.has(x.subject)).length;
  return <div className="relation-field"><span>Who can delegate · {picked} of {all.length}</span>
    <label className="group-search"><Search size={15} aria-hidden="true" /><input className="cp-admin-input" type="search" placeholder={`Search ${all.length} in ${issuer}…`} value={query} onChange={e => { setQuery(e.target.value); setShown({ person: sectionPage, service: sectionPage }); }} aria-label="Search subjects" /></label>
    <div className="relation-pick">{kinds.map(k => {
      const section = all.filter(x => x.kind === k);
      const found = (q ? section.filter(x => `${x.name} ${x.subject}`.toLowerCase().includes(q)) : section).sort((x, y) => Number(chosen.has(y.subject)) - Number(chosen.has(x.subject)));
      const allOn = section.length > 0 && section.every(x => chosen.has(x.subject));
      return <section key={k} className="relation-pick-section">
        <h5>{kindLabel[k]} <span>{section.filter(x => chosen.has(x.subject)).length} of {section.length}</span>
          <button type="button" className="rule-switch" onClick={() => onSet(section, !allOn)}>{allOn ? 'Clear' : `Select all ${section.length}`}</button></h5>
        {found.length ? <ul>{found.slice(0, shown[k]).map(x => <li key={x.subject}><label><input type="checkbox" checked={chosen.has(x.subject)} onChange={e => onSet([x], e.target.checked)} /><span>{x.name}<small>{x.subject}</small></span></label></li>)}</ul> : <p className="cp-admin-muted">No match.</p>}
        {found.length > shown[k] ? <button type="button" className="rule-switch" onClick={() => setShown(v => ({ ...v, [k]: v[k] + sectionPage * 3 }))}>Show more ({found.length - shown[k]})</button> : null}
      </section>;
    })}</div>
  </div>;
}

export function IdpPanel({ doc, issuer, agentName, onChange, onClose }: { doc: Doc; issuer: string; agentName: string; onChange: (d: Doc) => void; onClose: () => void; onSelect: (s: Selection) => void }) {
  const scope = doc.scopes.find(s => s.issuer === issuer);
  if (!scope) return null;
  const set = (patch: Partial<IdpScope>) => onChange({ ...doc, scopes: doc.scopes.map(s => (s.issuer === issuer ? { ...s, ...patch } : s)) });
  const chosen = new Set(doc.delegations.filter(d => d.issuer === issuer).map(d => d.subject));
  const setSubjects = (subjects: Subject[], on: boolean) => {
    const keys = new Set(subjects.map(x => x.subject));
    const rest = doc.delegations.filter(d => !(d.issuer === issuer && keys.has(d.subject)));
    const consent = { source: 'administrator' as const, recordedBy: currentAdmin, recordedAt: nowUtc() };
    onChange({ ...doc, delegations: on ? [...rest, ...subjects.map(x => delegationOf(issuer, x, consent))] : rest });
  };
  return <>
    <header><div><small>Identity provider</small><h4>{issuer}</h4><p className="cp-admin-muted">{issuer} → {agentName}</p></div></header>
    <div className="relation-chips"><WaitingBackend spec="033" tip="Sets who in this identity provider can delegate to the agent, and records the consent." /></div>
    <IncludesField value={scope.kinds} onChange={kinds => set({ kinds })} />
    <SubjectList issuer={issuer} kinds={scope.kinds} chosen={chosen} onSet={setSubjects} />
    <ExpiresField name="idp-expires" value={scope.expiresAt} onChange={v => set({ expiresAt: v })} dateText="Delegation from this identity provider ends on this date." />
    <div className="consent-record" role="note" aria-label="Consent record">
      <ShieldCheck size={18} aria-hidden="true" />
      <div><strong>Last consent recorded</strong><small>by {scope.consent.recordedBy} · {scope.consent.recordedAt}</small></div>
      <Tooltip content={`${scope.consent.recordedBy} confirmed that these subjects agreed to let ${agentName} act for them. ${issuer} can not record this consent itself, so the Admin records who confirmed and when, from the signed-in administrator.`}><CircleHelp size={15} aria-label="About consent" /></Tooltip>
    </div>
    <footer><button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" onClick={() => { onChange({ ...doc, scopes: doc.scopes.filter(s => s.issuer !== issuer), delegations: doc.delegations.filter(d => d.issuer !== issuer) }); onClose(); }}><Trash2 size={14} aria-hidden="true" />Remove {issuer}</button></footer>
  </>;
}
