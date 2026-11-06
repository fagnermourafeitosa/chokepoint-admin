// Admin 048 prototype copy: the Expires select with help that says what happens.
import { useEffect, useState } from 'react';
import { CircleHelp, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { Tooltip } from '../../../src/components/ui/tooltip/Tooltip';
import { delegationId, formatTime, idpName, idpSubjects, type Doc, type IdpScope, type Subject, type SubjectKind } from '../../../src/features/access/delegation/model';
import { useCatalog } from '../../../src/features/access/delegation/catalog';
import type { Selection } from '../../../src/features/access/delegation/layout';
import { IncludesField } from '../../../src/features/access/delegation/Fields';
import { ExpiresField } from './ExpiresField';
import { HarnessAccess } from '../../../src/features/access/delegation/HarnessAccess';

const sectionPage = 10;
const kindLabel: Record<SubjectKind, string> = { person: 'People', service: 'Services' };

// Who can delegate: one list with a People and a Services section. Checked subjects can delegate; Select all checks everyone listed now.
export function SubjectList({ issuer, kinds, chosen, onSet }: { issuer: string; kinds: SubjectKind[]; chosen: Set<string>; onSet: (subjects: Subject[], on: boolean) => void }) {
  const { catalog, request, directoryFailed } = useCatalog();
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState<Record<SubjectKind, number>>({ person: sectionPage, service: sectionPage });
  useEffect(() => { request(issuer); }, [issuer, request]);
  if (!kinds.length) return <p className="cp-admin-muted">Select People, Services or both.</p>;
  const directory = catalog.directory(issuer);
  if (directoryFailed(issuer)) return <p role="alert" className="cp-admin-notice" data-tone="danger">Could not read the directory of {idpName(catalog, issuer)}. Check its directory settings in Identity providers.</p>;
  if (!directory) return <p role="status" className="cp-admin-muted">Loading the directory of {idpName(catalog, issuer)}…</p>;
  const all = idpSubjects(catalog, issuer, kinds);
  const q = query.trim().toLowerCase();
  const picked = all.filter(x => chosen.has(x.subject)).length;
  return <div className="relation-field"><span>Who can delegate · {picked} of {all.length}</span>
    <label className="group-search"><Search size={15} aria-hidden="true" /><input className="cp-admin-input" type="search" placeholder={`Search ${all.length} in ${idpName(catalog, issuer)}…`} value={query} onChange={e => { setQuery(e.target.value); setShown({ person: sectionPage, service: sectionPage }); }} aria-label="Search subjects" /></label>
    {directory.truncated ? <p className="cp-admin-muted">The provider lists only some services. Select all checks the services listed here.</p> : null}
    <div className="relation-pick">{kinds.map(k => {
      const section = all.filter(x => x.kind === k);
      const found = (q ? section.filter(x => `${x.name} ${x.subject}`.toLowerCase().includes(q)) : section).sort((x, y) => Number(chosen.has(y.subject)) - Number(chosen.has(x.subject)));
      const allOn = section.length > 0 && section.every(x => chosen.has(x.subject));
      return <section key={k} className="relation-pick-section">
        <h5>{kindLabel[k]} <span>{section.filter(x => chosen.has(x.subject)).length} of {section.length}</span>
          {section.length ? <button type="button" className="rule-switch" onClick={() => onSet(section, !allOn)}>{allOn ? 'Clear' : `Select all ${section.length}`}</button> : null}</h5>
        {found.length ? <ul>{found.slice(0, shown[k]).map(x => <li key={x.subject}><label><input type="checkbox" checked={chosen.has(x.subject)} onChange={e => onSet([x], e.target.checked)} /><span>{x.name}<small>{x.subject}</small></span></label></li>)}</ul> : <p className="cp-admin-muted">{section.length ? 'No match.' : 'None in this directory.'}</p>}
        {found.length > shown[k] ? <button type="button" className="rule-switch" onClick={() => setShown(v => ({ ...v, [k]: v[k] + sectionPage * 3 }))}>Show more ({found.length - shown[k]})</button> : null}
      </section>;
    })}</div>
  </div>;
}

// The consent of the scope: a read-only record. The backend records who confirmed and when (Backend 033, 037).
export function ConsentRecord({ scope, agentName, onConfirm }: { scope: IdpScope; agentName: string; onConfirm: (on: boolean) => void }) {
  const { catalog } = useCatalog();
  const name = idpName(catalog, scope.issuer);
  if (!scope.consent) return <label className="relation-consent"><input type="checkbox" checked={!!scope.confirmed} onChange={e => onConfirm(e.target.checked)} /><span>I confirm that these subjects agreed to let <strong>{agentName}</strong> act for them.<small>{name} can not record this consent itself, so Xokepoint records your name and the time when you publish.</small></span></label>;
  const by = scope.consent.name ?? scope.consent.recordedBy;
  return <div className="consent-record" role="note" aria-label="Consent record">
    <ShieldCheck size={18} aria-hidden="true" />
    <div><strong>Last consent recorded</strong><small>by {by} · {formatTime(scope.consent.recordedAt)}</small></div>
    <Tooltip content={`${by} confirmed that these subjects agreed to let ${agentName} act for them. ${name} can not record this consent itself, so Xokepoint records who confirmed and when, from the signed-in administrator.`}><CircleHelp size={15} aria-label="About consent" /></Tooltip>
  </div>;
}

export function IdpPanel({ doc, issuer, agentName, onChange, onClose }: { doc: Doc; issuer: string; agentName: string; onChange: (d: Doc) => void; onClose: () => void; onSelect: (s: Selection) => void }) {
  const { catalog } = useCatalog();
  const scope = doc.scopes.find(s => s.issuer === issuer);
  if (!scope) return null;
  const name = idpName(catalog, issuer);
  const set = (patch: Partial<IdpScope>) => onChange({ ...doc, scopes: doc.scopes.map(s => (s.issuer === issuer ? { ...s, ...patch } : s)) });
  const chosen = new Set(doc.delegations.filter(d => d.issuer === issuer).map(d => d.subject));
  const setSubjects = (subjects: Subject[], on: boolean) => {
    const keys = new Set(subjects.map(x => x.subject));
    const rest = doc.delegations.filter(d => !(d.issuer === issuer && keys.has(d.subject)));
    onChange({ ...doc, delegations: on ? [...rest, ...subjects.map(x => ({ id: delegationId(issuer, x.subject), issuer, subject: x.subject, kind: x.kind }))] : rest });
  };
  return <>
    <header><div><small>Identity provider</small><h4>{name}</h4><p className="cp-admin-muted">{name} → {agentName}</p></div></header>
    <IncludesField value={scope.kinds} onChange={kinds => onChange({ ...doc, scopes: doc.scopes.map(s => (s.issuer === issuer ? { ...s, kinds } : s)), delegations: doc.delegations.filter(d => d.issuer !== issuer || kinds.includes(d.kind)) })} />
    <SubjectList issuer={issuer} kinds={scope.kinds} chosen={chosen} onSet={setSubjects} />
    <ExpiresField value={scope.expiresAt} onChange={v => set({ expiresAt: v })} never={`Subjects from ${name} can delegate to ${agentName} until you remove ${name}.`} ends={`After this day (UTC), nobody from ${name} can delegate to ${agentName}. Calls on their behalf are denied.`} />
    <ConsentRecord scope={scope} agentName={agentName} onConfirm={confirmed => set({ confirmed })} />
    <HarnessAccess doc={doc} scope={scope} agentName={agentName} onChange={onChange} />
    <footer><button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" onClick={() => { onChange({ ...doc, scopes: doc.scopes.filter(s => s.issuer !== issuer), delegations: doc.delegations.filter(d => d.issuer !== issuer), blocked: doc.blocked.filter(b => b.issuer !== issuer) }); onClose(); }}><Trash2 size={14} aria-hidden="true" />Remove {name}</button></footer>
  </>;
}
