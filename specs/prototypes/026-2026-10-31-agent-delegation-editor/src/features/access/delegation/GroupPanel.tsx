import { useState } from 'react';
import { Braces, Clock, Plus, Search } from 'lucide-react';
import type { Doc } from './fixtures';
import type { Adding, GroupKind, Selection } from './layout';

type Item = { select: Selection; title: string; detail: string; expires?: string; conditions: number };
const page = 50;
const adds: Record<GroupKind, [Adding, string]> = { delegators: ['delegator', 'Add delegator'], tools: ['tool', 'Add tools'], resources: ['resource', 'Add resource'] };

function items(doc: Doc, group: GroupKind, key: string): Item[] {
  if (group === 'delegators') { const [issuer, kind] = key.split('|'); return doc.delegations.filter(d => d.issuer === issuer && d.kind === kind).map(d => ({ select: { type: 'delegation', id: d.id }, title: d.name, detail: d.subject, expires: d.expiresAt, conditions: 0 })); }
  if (group === 'tools') return doc.capabilities.filter(c => c.serverId === key).map(c => ({ select: { type: 'capability', id: c.id }, title: c.tool, detail: c.mapping ? `Resource: ${c.mapping.kind}` : 'No resource mapping', expires: c.expiresAt, conditions: c.conditions.length }));
  const [serverId, kind] = key.split('|');
  return doc.resources.filter(r => r.serverId === serverId && r.kind === kind).map(r => ({ select: { type: 'resource', id: r.id }, title: r.value, detail: kind, conditions: 0 }));
}

// A group node opens this list. Search and paging keep a column of hundreds usable.
export function GroupPanel({ doc, group, groupKey, label, onSelect }: { doc: Doc; group: GroupKind; groupKey: string; label: string; onSelect: (s: Selection) => void }) {
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(page);
  const all = items(doc, group, groupKey);
  const q = query.trim().toLowerCase();
  const found = q ? all.filter(i => `${i.title} ${i.detail}`.toLowerCase().includes(q)) : all;
  const [what, add] = adds[group];
  return <>
    <header><div><small>Group</small><h4>{label}</h4><p className="cp-admin-muted">{group === 'delegators' ? groupKey.split('|')[0] : group === 'tools' ? 'Granted tools of this server' : `${groupKey.split('|')[1]} on ${groupKey.split('|')[0]}`}</p></div></header>
    <div className="relation-field"><span>Summary</span><small>{all.length} total · {all.filter(i => i.expires).length} expire · {all.filter(i => i.conditions).length} with call conditions</small></div>
    <label className="group-search"><Search size={15} aria-hidden="true" /><input className="cp-admin-input" type="search" placeholder={`Filter ${all.length}…`} value={query} onChange={e => { setQuery(e.target.value); setShown(page); }} aria-label="Filter this group" /></label>
    <ul className="group-list">{found.slice(0, shown).map(i => <li key={JSON.stringify(i.select)}><button type="button" onClick={() => onSelect(i.select)}><span><strong>{i.title}</strong><small>{i.detail}</small></span>{i.expires ? <Clock size={13} aria-label="Has expiration" /> : null}{i.conditions ? <span className="group-cond"><Braces size={13} aria-hidden="true" />{i.conditions}</span> : null}</button></li>)}</ul>
    <p className="cp-admin-muted group-count">{found.length ? `Showing ${Math.min(shown, found.length)} of ${found.length}` : 'No match.'}</p>
    {found.length > shown ? <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => setShown(n => n + page)}>Show {page} more</button> : null}
    <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small relation-add-button" onClick={() => onSelect({ type: 'add', what })}><Plus size={14} aria-hidden="true" />{add}</button>
  </>;
}
