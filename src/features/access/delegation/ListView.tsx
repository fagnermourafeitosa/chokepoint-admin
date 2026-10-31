import { Braces, Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { servers, type Doc } from './fixtures';
import { sameSelection, type Selection } from './layout';

type Edge = Extract<Selection, { type: 'idp' | 'delegation' | 'capability' | 'resource' }>;
type Row = { select: Edge; cells: string[]; expires?: string; conditions: number; label: string };
type SectionProps = { title: string; columns: string[]; rows: Row[]; selected?: Selection; onSelect: (s: Selection) => void; onRemove: (r: Row) => void; readOnly: boolean };

function Section({ title, columns, rows, selected, onSelect, onRemove, readOnly }: SectionProps) {
  return <section className="delegation-list-section"><h4>{title} <span>{rows.length}</span></h4>
    {rows.length ? <table className="delegation-list-table"><thead><tr>{columns.map(c => <th key={c} scope="col">{c}</th>)}<th scope="col">Expires</th><th scope="col">Conditions</th><th scope="col" aria-label="Actions" /></tr></thead>
      <tbody>{rows.map(r => <tr key={r.label} aria-selected={sameSelection(selected, r.select)}>
        {r.cells.map((c, j) => <td key={j}>{j === 0 ? <button type="button" className="delegation-list-open" onClick={() => onSelect(r.select)}>{c}</button> : c}</td>)}
        <td>{r.expires ? <span className="delegation-list-icon"><Clock size={13} aria-hidden="true" />{r.expires}</span> : '—'}</td>
        <td>{r.conditions ? <span className="delegation-list-icon"><Braces size={13} aria-hidden="true" />{r.conditions}</span> : '—'}</td>
        <td><div className="delegation-list-actions">
          <button type="button" className="relation-icon-button" aria-label={`Open ${r.label}`} title="Open" onClick={() => onSelect(r.select)}><Pencil size={14} /></button>
          {readOnly ? null : <>
            <button type="button" className="relation-icon-button" aria-label={`Add condition to ${r.label}`} title="Add condition" onClick={() => onSelect('id' in r.select ? { ...r.select, addCondition: true } : r.select)}><Plus size={14} /></button>
            <button type="button" className="relation-icon-button" aria-label={`Remove ${r.label}`} title="Remove" onClick={() => onRemove(r)}><Trash2 size={14} /></button>
          </>}
        </div></td>
      </tr>)}</tbody></table> : <p className="cp-admin-muted">None.</p>}
  </section>;
}

// The same relations as the graph, as tables. Better for keyboards and for long lists.
export function ListView({ doc, selected, onSelect, onChange, readOnly }: { doc: Doc; selected?: Selection; onSelect: (s: Selection) => void; onChange: (d: Doc) => void; readOnly: boolean }) {
  const remove = (r: Row) => {
    if (r.select.type === 'idp') { const issuer = r.select.issuer; onChange({ ...doc, scopes: doc.scopes.filter(s => s.issuer !== issuer), delegations: doc.delegations.filter(d => d.issuer !== issuer) }); return; }
    const id = r.select.id;
    if (r.select.type === 'delegation') onChange({ ...doc, delegations: doc.delegations.filter(d => d.id !== id) });
    else if (r.select.type === 'capability') onChange({ ...doc, capabilities: doc.capabilities.filter(c => c.id !== id) });
    else onChange({ ...doc, resources: doc.resources.filter(x => x.id !== id) });
  };
  const common = { selected, onSelect, onRemove: remove, readOnly };
  return <div className="delegation-list">
    <Section title="Who can delegate" columns={['Identity provider', 'Who', 'Kinds', 'Consent']} {...common}
      rows={doc.scopes.map(sc => ({ select: { type: 'idp', issuer: sc.issuer }, label: sc.issuer, cells: [sc.issuer, sc.mode === 'everyone' ? `Everyone${sc.except.length ? `, ${sc.except.length} excluded` : ''}` : `${doc.delegations.filter(d => d.issuer === sc.issuer).length} selected`, sc.kinds.map(k => (k === 'person' ? 'People' : 'Services')).join(', '), `${sc.consent.recordedBy} · ${sc.consent.recordedAt}`], expires: sc.expiresAt, conditions: 0 }))} />
    <Section title="Servers and tools" columns={['Tool', 'Server', 'Resource mapping']} {...common}
      rows={doc.capabilities.map(c => ({ select: { type: 'capability', id: c.id }, label: c.tool, cells: [c.tool, servers.find(s => s.id === c.serverId)?.name ?? '', c.mapping ? `${c.mapping.pointer} → ${c.mapping.kind}` : '—'], expires: c.expiresAt, conditions: c.conditions.length }))} />
    <Section title="Resources" columns={['Resource', 'Kind', 'Server', 'Used by']} {...common}
      rows={doc.resources.map(r => ({ select: { type: 'resource', id: r.id }, label: `${r.kind} ${r.value}`, cells: [r.value, r.kind, servers.find(s => s.id === r.serverId)?.name ?? '', doc.capabilities.filter(c => c.serverId === r.serverId && c.mapping?.kind === r.kind).map(c => c.tool).join(', ') || '—'], conditions: 0 }))} />
  </div>;
}
