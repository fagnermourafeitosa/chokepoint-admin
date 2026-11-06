import { Search, X } from 'lucide-react';
import { serverName, type Doc } from '../../../src/features/access/delegation/model';
import { useCatalog } from '../../../src/features/access/delegation/catalog';
import { SelectMenu } from '../../../src/components/ui/dropdown/SelectMenu';
import { isFiltered, noFilters, type Filters } from '../../../src/features/access/delegation/FilterBar';

// Admin 048 prototype copy of FilterBar, without the Expiring filter. The filtering itself is the
// real filterDoc.
export function FilterBar({ filters, onChange, shown, total, doc }: { filters: Filters; onChange: (f: Filters) => void; shown: number; total: number; doc: Doc }) {
  const { catalog } = useCatalog();
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const tools = doc.capabilities.filter(c => !filters.server || c.serverId === filters.server);
  return <div className="delegation-filters" role="search" aria-label="Filter relations">
    <label className="group-search delegation-filter-text"><Search size={15} aria-hidden="true" /><input className="cp-admin-input" type="search" placeholder="Filter by identity provider, subject or tool" value={filters.text} onChange={e => set({ text: e.target.value })} aria-label="Filter text" /></label>
    <SelectMenu label="Server" value={filters.server} onChange={v => set({ server: v, tool: '' })} options={[{ value: '', label: 'All servers' }, ...catalog.servers.map(s => ({ value: s.id, label: s.name }))]} />
    <SelectMenu label="Tool" value={filters.tool} onChange={v => set({ tool: v })} options={[{ value: '', label: 'All tools' }, ...tools.map(c => ({ value: c.id, label: filters.server ? c.tool : `${serverName(catalog, c.serverId)} · ${c.tool}` }))]} />
    <label className="delegation-filter-check"><input type="checkbox" checked={filters.withRules} onChange={e => set({ withRules: e.target.checked })} /> With rules</label>
    {isFiltered(filters) ? <><span className="delegation-filter-count">{shown} of {total} relations</span><button type="button" className="rule-switch" onClick={() => onChange(noFilters)}><X size={13} aria-hidden="true" />Clear filters</button></> : null}
  </div>;
}
