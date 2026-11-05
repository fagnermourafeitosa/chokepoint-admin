import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ban, CircleHelp, Search, ShieldAlert, TriangleAlert } from 'lucide-react';
import { Tooltip } from '../../../components/ui/tooltip/Tooltip';
import { SelectMenu } from '../../../components/ui/dropdown/SelectMenu';
import { identityApi, type DirectoryGroup } from '../../identity/api';
import { useCatalog } from './catalog';
import { idpName, idpSubjects, isBlocked, type ConsentGroup, type Doc, type IdpScope } from './model';
import './harness.css';

const tip = (text: string) => <Tooltip content={text}><CircleHelp size={14} aria-label="Help" /></Tooltip>;
const defaultConsent = { groups: [], defaultDays: 7, maxDays: 30 };

// Directory groups of the identity provider: the chosen ones first, then a search page
// (Backend 045 Administration API 3a). A chosen group that the directory no longer has is marked.
function GroupPicker({ issuer, chosen, onChange, disabled }: { issuer: string; chosen: ConsentGroup[]; onChange: (groups: ConsentGroup[]) => void; disabled?: boolean }) {
  const { scope, catalog } = useCatalog();
  const name = idpName(catalog, issuer);
  const [query, setQuery] = useState('');
  // The search reads the provider directory: wait for a pause in typing.
  const [search, setSearch] = useState('');
  useEffect(() => { const timer = setTimeout(() => setSearch(query.trim()), 300); return () => clearTimeout(timer); }, [query]);
  const page = useQuery({ queryKey: ['idp-groups', scope.userId, scope.tenantId, scope.environmentId, issuer, search], queryFn: ({ signal }) => identityApi.groups(scope, issuer, { q: search }, signal), retry: false, staleTime: 60_000 });
  const ids = chosen.map(g => g.id);
  const found = useQuery({ queryKey: ['idp-groups-chosen', scope.userId, scope.tenantId, scope.environmentId, issuer, ids.join(',')], queryFn: ({ signal }) => identityApi.groups(scope, issuer, { ids }, signal), enabled: ids.length > 0, retry: false, staleTime: 60_000 });
  const exists = (id: string) => !found.data || found.data.items.some(g => g.id === id);
  const toggle = (g: DirectoryGroup, on: boolean) => onChange(on ? [...chosen, { id: g.id, name: g.name, ...(g.path ? { path: g.path } : {}) }] : chosen.filter(x => x.id !== g.id));
  const listed = (page.data?.items ?? []).filter(g => !ids.includes(g.id));
  return <div className="relation-field"><span>Groups in {name} · {chosen.length} chosen</span>
    <div className="harness-groups">
      {chosen.map(g => <label key={g.id} data-on="true" title={g.path}><input type="checkbox" checked disabled={disabled} onChange={() => toggle(g, false)} />{g.name}{exists(g.id) ? null : <small className="harness-missing">Not found in {name}</small>}</label>)}
    </div>
    <label className="group-search"><Search size={15} aria-hidden="true" /><input className="cp-admin-input" type="search" disabled={disabled} placeholder={`Search groups in ${name}…`} value={query} onChange={e => setQuery(e.target.value)} aria-label="Search groups" /></label>
    {page.isError ? <p role="alert" className="cp-admin-notice" data-tone="danger">Could not read the groups of {name}. Check its directory settings in Identity providers.</p>
      : page.isPending ? <p role="status" className="cp-admin-muted">Loading the groups of {name}…</p>
        : listed.length ? <div className="harness-groups">{listed.map(g => <label key={g.id} data-on="false" title={g.path}><input type="checkbox" checked={false} disabled={disabled} onChange={() => toggle(g, true)} />{g.name}</label>)}</div>
          : <p className="cp-admin-muted">{query ? 'No match.' : 'No other group.'}</p>}
    <small className="cp-admin-muted">Groups of the {name} directory. Membership is read at each login.</small>
  </div>;
}

// Harness login of one identity provider of the agent (Admin 036 section 1): who can log in
// from a harness (eligible groups), the consent validity, and who is vetoed (blocked).
export function HarnessAccess({ doc, scope, agentName, onChange }: { doc: Doc; scope: IdpScope; agentName: string; onChange: (d: Doc) => void }) {
  const { catalog } = useCatalog();
  const issuer = scope.issuer;
  const name = idpName(catalog, issuer);
  const idp = catalog.idps.find(i => i.id === issuer);
  const [pick, setPick] = useState('');
  const people = scope.kinds.includes('person');
  const consent = scope.personConsent;
  const setConsent = (next: IdpScope['personConsent']) => onChange({ ...doc, scopes: doc.scopes.map(s => (s.issuer === issuer ? { ...s, personConsent: next } : s)) });
  const blocked = doc.blocked.filter(b => b.issuer === issuer);
  const candidates = idpSubjects(catalog, issuer, ['person']).filter(x => !isBlocked(doc, issuer, x.subject));
  const subjectName = (subject: string) => idpSubjects(catalog, issuer, ['person']).find(x => x.subject === subject)?.name ?? subject;
  // A blocked person leaves the delegations of the draft (Backend 045 Administration API 4).
  const block = (subject: string) => onChange({ ...doc, blocked: [...doc.blocked, { issuer, subject, reason: 'Blocked by administrator' }], delegations: doc.delegations.filter(d => !(d.issuer === issuer && d.subject === subject)) });
  const none = !!consent && consent.groups.length === 0;
  return <section className="harness-block" aria-label="Harness login">
    <span className="relation-label">Harness login{tip('People of this identity provider log in from a coding harness and consent themselves. You choose which groups can.')}</span>
    {idp && !idp.groups ? <p className="cp-admin-muted">{name} can not list groups yet, so harness login is not available for it.</p>
      : !people ? <p className="cp-admin-muted">Include People above to let people log in from a harness.</p> : <>
        <label className="harness-switch"><input type="checkbox" checked={!!consent} onChange={e => setConsent(e.target.checked ? defaultConsent : undefined)} /><span><strong>People in chosen groups can log in from a harness</strong><small>They consent at login. You do not list them one by one.</small></span></label>
        {consent ? <>
          <div className="harness-rule" data-tone={none ? 'danger' : 'warning'} role={none ? 'alert' : 'note'}>
            <ShieldAlert size={18} aria-hidden="true" />
            <div><strong>Only members of these groups can log in.</strong><small>{none ? 'Choose at least one group. Without a group, harness login stays off.' : `A person of ${name} outside these groups is refused at login and never sees ${agentName}.`}</small></div>
          </div>
          {idp && !idp.harnessLogin ? <p className="resource-warning"><TriangleAlert size={14} aria-hidden="true" />Harness login is off in the {name} connection. Turn it on in Identity providers, with its login client.</p> : null}
          <GroupPicker issuer={issuer} chosen={consent.groups} onChange={groups => setConsent({ ...consent, groups })} />
          <div className="harness-days">
            <label className="relation-field"><span>Consent lasts</span><span className="harness-number"><input className="cp-admin-input" type="number" min={1} max={consent.maxDays} value={consent.defaultDays} onChange={e => setConsent({ ...consent, defaultDays: Math.max(1, Number(e.target.value) || 1) })} />days</span></label>
            <label className="relation-field"><span>At most</span><span className="harness-number"><input className="cp-admin-input" type="number" min={consent.defaultDays} max={365} value={consent.maxDays} onChange={e => setConsent({ ...consent, maxDays: Math.min(365, Number(e.target.value) || 1) })} />days</span></label>
          </div>
          {consent.defaultDays > consent.maxDays ? <p role="alert" className="cp-admin-notice" data-tone="danger">Consent lasts must be at most the maximum.</p> : null}
          <p className="resource-warning"><TriangleAlert size={14} aria-hidden="true" />Removing someone from a group in {name} does not cut access at once. It ends after 24 hours without use or when the consent ends. To cut access now, block the person.</p>
        </> : null}
      </>}
    <div className="relation-field"><span className="relation-label">Blocked · {blocked.length}{tip('A blocked person can not use this agent, whatever their groups or consent. Blocking revokes their machines at once when you publish.')}</span>
      {blocked.length ? <ul className="harness-list">{blocked.map(b => <li key={b.subject}><Ban size={15} aria-hidden="true" /><div><strong>{subjectName(b.subject)}</strong><small>{b.subject}{b.reason ? ` · ${b.reason}` : ''}</small></div>
        <button type="button" className="rule-switch" onClick={() => onChange({ ...doc, blocked: doc.blocked.filter(x => !(x.issuer === issuer && x.subject === b.subject)) })}>Unblock</button></li>)}</ul> : <p className="cp-admin-muted">Nobody is blocked.</p>}
      <div className="harness-add"><SelectMenu label="Person to block" block value={pick} onChange={setPick} options={[{ value: '', label: 'Choose a person…' }, ...candidates.map(d => ({ value: d.subject, label: d.name }))]} />
        <button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" disabled={!pick} onClick={() => { block(pick); setPick(''); }}><Ban size={14} aria-hidden="true" />Block</button></div>
    </div>
  </section>;
}
