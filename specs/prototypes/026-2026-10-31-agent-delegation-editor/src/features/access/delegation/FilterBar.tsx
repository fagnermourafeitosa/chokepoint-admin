import { Search, X } from 'lucide-react';
import { servers, type Doc } from './fixtures';
import { SelectMenu } from '../../../components/ui/dropdown/SelectMenu';

export type Filters = { text: string; server: string; tool: string; withRules: boolean; expiring: boolean };
export const noFilters: Filters = { text: '', server: '', tool: '', withRules: false, expiring: false };
export const isFiltered = (f: Filters) => !!(f.text.trim() || f.server || f.tool || f.withRules || f.expiring);

// Filters change only what the view shows. Edits always apply to the whole draft.
export function filterDoc(doc: Doc, f: Filters): Doc {
  const q = f.text.trim().toLowerCase();
  const has = (...values: (string | undefined)[]) => !q || values.some(v => v?.toLowerCase().includes(q));
  // The text filters each column only when it matches something there; a column without a match keeps its items,
  // so a search for a tool still shows who delegates and a search for a person still shows the tools.
  const toolText = (c: Doc['capabilities'][number]) => has(c.tool, servers.find(s => s.id === c.serverId)?.name, c.mapping?.kind, ...c.conditions.map(k => k.name));
  const scopeText = (issuer: string) => has(issuer) || doc.delegations.some(d => d.issuer === issuer && has(d.name, d.subject));
  const anyTool = doc.capabilities.some(toolText), anyScope = doc.scopes.some(s => scopeText(s.issuer));
  const capabilities = doc.capabilities.filter(c => (!f.server || c.serverId === f.server) && (!f.tool || c.id === f.tool) && (!f.withRules || c.conditions.length > 0)
    && (!f.expiring || !!c.expiresAt) && (!anyTool || toolText(c)));
  const types = new Set(capabilities.map(c => `${c.serverId}|${c.mapping?.kind}`));
  const anyResource = doc.resources.some(r => has(r.value));
  const resources = doc.resources.filter(r => types.has(`${r.serverId}|${r.kind}`) && (!anyResource || has(r.value)));
  const scopes = doc.scopes.filter(s => (!f.expiring || !!s.expiresAt) && (!anyScope || scopeText(s.issuer)));
  return { ...doc, scopes, capabilities, resources };
}

export function FilterBar({ filters, onChange, shown, total, doc }: { filters: Filters; onChange: (f: Filters) => void; shown: number; total: number; doc: Doc }) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  // The tool list follows the server: one server shows its tools; all servers show server · tool.
  const tools = doc.capabilities.filter(c => !filters.server || c.serverId === filters.server);
  const serverName = (id: string) => servers.find(s => s.id === id)?.name ?? id;
  return <div className="delegation-filters" role="search" aria-label="Filter relations">
    <label className="group-search delegation-filter-text"><Search size={15} aria-hidden="true" /><input className="cp-admin-input" type="search" placeholder="Filter by identity provider, subject, tool or resource" value={filters.text} onChange={e => set({ text: e.target.value })} aria-label="Filter text" /></label>
    <SelectMenu label="Server" value={filters.server} onChange={v => set({ server: v, tool: '' })} options={[{ value: '', label: 'All servers' }, ...servers.map(s => ({ value: s.id, label: s.name }))]} />
    <SelectMenu label="Tool" value={filters.tool} onChange={v => set({ tool: v })} options={[{ value: '', label: 'All tools' }, ...tools.map(c => ({ value: c.id, label: filters.server ? c.tool : `${serverName(c.serverId)} · ${c.tool}` }))]} />
    <label className="delegation-filter-check"><input type="checkbox" checked={filters.withRules} onChange={e => set({ withRules: e.target.checked })} /> With rules</label>
    <label className="delegation-filter-check"><input type="checkbox" checked={filters.expiring} onChange={e => set({ expiring: e.target.checked })} /> Expiring</label>
    {isFiltered(filters) ? <><span className="delegation-filter-count">{shown} of {total} relations</span><button type="button" className="rule-switch" onClick={() => onChange(noFilters)}><X size={13} aria-hidden="true" />Clear filters</button></> : null}
  </div>;
}
