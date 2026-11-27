import { Braces, Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { formatTime, idpName, idpSubjects, serverName, withoutCapability, type Doc } from './model';
import { useCatalog } from './catalog';
import { sameSelection, type Selection } from './layout';
import type { ChangeKind } from './revisionDiff';

type Edge = Extract<Selection, { type: 'idp' | 'capability' | 'resource' }>;
// change: the mark of the row in the Draft view (Admin 064 Solution 4). A removed row comes from the published document.
type Row = { select: Edge; cells: string[]; expires?: string; conditions: number; label: string; change?: ChangeKind };
const badge: Record<ChangeKind, { tone: string; text: string }> = { added: { tone: 'success', text: 'Added' }, removed: { tone: 'danger', text: 'Removed' }, changed: { tone: 'warning', text: 'Changed' } };
type SectionProps = { title: string; columns: string[]; rows: Row[]; selected?: Selection; onSelect: (s: Selection) => void; onRemove: (r: Row) => void; readOnly: boolean };

function Section({ title, columns, rows, selected, onSelect, onRemove, readOnly }: SectionProps) {
  return <section className="delegation-list-section"><h4>{title} <span>{rows.filter(r => r.change !== 'removed').length}</span></h4>
    {rows.length ? <table className="delegation-list-table"><thead><tr>{columns.map(c => <th key={c} scope="col">{c}</th>)}<th scope="col">Expires</th><th scope="col">Rules</th><th scope="col" aria-label="Actions" /></tr></thead>
      <tbody>{rows.map(r => <tr key={r.label} aria-selected={sameSelection(selected, r.select)} data-change={r.change}>
        {r.cells.map((c, j) => <td key={j}>{j === 0 ? <span className="delegation-list-name"><button type="button" className="delegation-list-open" onClick={() => onSelect(r.select)}>{c}</button>{r.change ? <span className="mcp-badge" data-tone={badge[r.change].tone}>{badge[r.change].text}</span> : null}</span> : c}</td>)}
        <td>{r.expires ? <span className="delegation-list-icon"><Clock size={13} aria-hidden="true" />{r.expires}</span> : '—'}</td>
        <td>{r.conditions ? <span className="delegation-list-icon"><Braces size={13} aria-hidden="true" />{r.conditions}</span> : '—'}</td>
        <td><div className="delegation-list-actions">
          <button type="button" className="relation-icon-button" aria-label={`Open ${r.label}`} title="Open" onClick={() => onSelect(r.select)}><Pencil size={14} /></button>
          {readOnly || r.change === 'removed' ? null : <>
            <button type="button" className="relation-icon-button" aria-label={`Add rule to ${r.label}`} title="Add rule" onClick={() => onSelect('id' in r.select ? { ...r.select, addCondition: true } : r.select)}><Plus size={14} /></button>
            <button type="button" className="relation-icon-button" aria-label={`Remove ${r.label}`} title="Remove" onClick={() => onRemove(r)}><Trash2 size={14} /></button>
          </>}
        </div></td>
      </tr>)}</tbody></table> : <p className="cp-admin-muted">None.</p>}
  </section>;
}

// Admin 048: ListView, with the 048 names: Allowed values instead of Resource.
// The same relations as the graph, as tables. Better for keyboards and for long lists.
// doc is what the view shows (filtered); source is the whole draft that edits change.
// marks and removed (Admin 064): the kind of each changed relation in the Draft view, and the published
// document of the removed ones, which stay as rows until the draft is published or discarded.
type Props = { doc: Doc; source: Doc; selected?: Selection; onSelect: (s: Selection) => void; onChange: (d: Doc) => void; readOnly: boolean; marks?: Map<string, ChangeKind>; removed?: Doc };

export function ListView({ doc, source, selected, onSelect, onChange, readOnly, marks, removed }: Props) {
  const { catalog } = useCatalog();
  const gone = removed ?? { scopes: [], delegations: [], capabilities: [], resources: [], blocked: [] };
  const remove = (r: Row) => {
    const doc = source;
    if (r.select.type === 'idp') { const issuer = r.select.issuer; onChange({ ...doc, scopes: doc.scopes.filter(s => s.issuer !== issuer), delegations: doc.delegations.filter(d => d.issuer !== issuer) }); return; }
    const id = r.select.id;
    if (r.select.type === 'capability') onChange(withoutCapability(doc, id).doc);
    else onChange({ ...doc, resources: doc.resources.filter(x => x.id !== id) });
  };
  const common = { selected, onSelect, onRemove: remove, readOnly };
  return <div className="delegation-list">
    <Section title="Who can delegate" columns={['Identity provider', 'Who', 'Kinds', 'Consent']} {...common}
      rows={[...doc.scopes.map(sc => [sc, source] as const), ...gone.scopes.map(sc => [sc, gone] as const)].map(([sc, from]) => ({ select: { type: 'idp', issuer: sc.issuer }, label: idpName(catalog, sc.issuer), change: marks?.get(`idp:${sc.issuer}`), cells: [idpName(catalog, sc.issuer), (() => { const total = idpSubjects(catalog, sc.issuer, sc.kinds).length, n = from.delegations.filter(d => d.issuer === sc.issuer && sc.kinds.includes(d.kind)).length; return !catalog.directory(sc.issuer) ? `${n}` : n === total && total ? `All ${total}` : `${n} of ${total}`; })(), sc.kinds.map(k => (k === 'person' ? 'People' : 'Services')).join(', '), sc.consent ? `${sc.consent.name ?? sc.consent.recordedBy} · ${formatTime(sc.consent.recordedAt)}` : sc.confirmed ? 'Confirmed in this draft' : 'Not recorded'], expires: sc.expiresAt, conditions: 0 }))} />
    <Section title="Servers and tools" columns={['Tool', 'Server']} {...common}
      rows={[...doc.capabilities, ...gone.capabilities].map(c => ({ select: { type: 'capability', id: c.id }, label: `${serverName(catalog, c.serverId)} · ${c.tool}`, change: marks?.get(`tool:${c.id}`), cells: [c.tool, serverName(catalog, c.serverId)], expires: c.expiresAt, conditions: c.conditions.length }))} />
  </div>;
}
