import { useState } from 'react';
import { CircleHelp, Database, Plus } from 'lucide-react';
import { Tooltip } from '../../components/ui/tooltip/Tooltip';
import { ConfirmDialog } from '../../components/ui/dialog/ConfirmDialog';
import { sourceApi, type Source } from './api';
import { useSources } from './useSources';
import { SourceConnection } from './SourceConnection';
import { SourceBindings } from './SourceBindings';
import type { EnvironmentScope } from '../access/environment-scope';
import './sources.css';

const auth: Record<Source['auth_type'], string> = { bearer: 'Bearer token', api_key: 'API key', none: 'None' };

// What the old Keep facts authoritative box said, now behind the help icon of the title.
const help = 'Credentials stay in Xokepoint; your client and your identity provider never fetch these attributes. Saving a source does not test its API. When the connection changes, turn its trusted attributes on again.';

const subtitle = 'Context sources are your authorized APIs. Their trusted attributes, about the subject or the object of a call, are read before the rules of a tool are checked.';

// What a source supplies, counted from the current version of each binding (Admin 048, item 29).
function supplies(source: Source) {
  const versions = source.bindings.map(b => b.draft ?? b.approved).filter(v => !!v);
  const attributes = versions.reduce((n, v) => n + v.attributes.length, 0);
  const tools = new Set(versions.map(v => `${v.server_id}/${v.tool_name}`)).size;
  return { attributes, tools, draft: source.bindings.some(b => b.draft) };
}

// Context sources (Admin 048, items 29 to 31): the list, and a source with its Connection and
// Trusted attributes tabs.
export function SourcesPage({ scope }: { scope: EnvironmentScope }) {
  const actions = useSources(scope);
  const [selected, setSelected] = useState<string>();
  const [tab, setTab] = useState<'connection' | 'bindings'>('connection');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<Source>();
  const source = actions.sources.find(s => s.id === selected);
  // Edit opens the connection of the source; a new source starts there too.
  function choose(item?: Source) { setSelected(item?.id ?? 'new'); setTab('connection'); }
  // The backend deletes only a source without bindings, so Delete first turns off or discards each
  // of its trusted attributes, then deletes the source.
  async function deleteSource(item: Source) {
    const done = await actions.run(async signal => {
      let current = item;
      for (const b of item.bindings) current = await sourceApi.binding(scope, current, b.id, b.approved ? 'retire' : 'discard', undefined, signal);
      await sourceApi.remove(scope, current, signal);
      return true;
    });
    if (done) { actions.removed(item.id); setDeleting(undefined); setSelected(undefined); }
  }
  const shown = actions.sources.filter(s => `${s.name} ${s.base_url}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="source-manager" aria-label="Context sources">
    <header className="access-page-heading">
      <div>
        <h1 className="cp-admin-title"><span className="source-title">{selected ? (source?.name ?? 'New context source') : 'Context sources'}<Tooltip content={help}><CircleHelp size={18} aria-label="About context sources" /></Tooltip></span></h1>
        <p className="cp-admin-muted">{subtitle}</p>
      </div>
      {selected ? <button className="cp-admin-button cp-admin-button--secondary access-primary-action" disabled={actions.busy} onClick={() => setSelected(undefined)}>Back to sources</button> : <button className="cp-admin-button access-primary-action" onClick={() => choose()}><Plus size={18} aria-hidden="true" />Connect API source</button>}
    </header>
    {actions.error ? <div className="cp-admin-notice" role="alert">{actions.error} <button className="cp-admin-button cp-admin-button--secondary" disabled={actions.busy} onClick={() => void actions.refetch()}>Reload</button></div> : null}
    {actions.isPending ? <p role="status">Loading sources…</p>
      : actions.isError ? <p role="alert">Could not load sources. <button className="cp-admin-button" onClick={() => void actions.refetch()}>Retry</button></p>
      : selected ? <>
        <nav className="source-tabs" aria-label="Source settings">
          <button aria-current={tab === 'connection' ? 'page' : undefined} onClick={() => setTab('connection')}>Connection</button>
          <button disabled={!source} aria-current={tab === 'bindings' ? 'page' : undefined} onClick={() => setTab('bindings')}>Trusted attributes</button>
        </nav>
        {tab === 'connection'
          ? <SourceConnection key={`${selected}:${source?.revision ?? 0}`} scope={scope} source={source} actions={actions} onSaved={saved => { setSelected(saved.id); setTab('bindings'); }} onDelete={source ? () => setDeleting(source) : undefined} onCancel={() => setSelected(undefined)} />
          : source ? <SourceBindings key={source.id} source={source} scope={scope} actions={actions} /> : null}

      </>
      : <>
        <label className="source-search">Find a source<input className="cp-admin-input" type="search" placeholder="Search sources…" value={search} onChange={e => setSearch(e.target.value)} /></label>
        {actions.sources.length ? <div className="cp-admin-table-scroll" role="region" aria-label="Context sources" tabIndex={0}><table className="cp-admin-table source-table">
          <thead><tr><th>Source</th><th>Authentication</th><th>Trusted attributes</th><th>Status</th><th className="source-actions-head">Actions</th></tr></thead>
          <tbody>{shown.map(s => { const n = supplies(s); return <tr key={s.id}>
            <td><div className="source-name"><Database size={20} aria-hidden="true" /><span><strong>{s.name}</strong><small className="cp-admin-muted">{s.base_url}</small></span></div></td>
            <td>{auth[s.auth_type]}</td>
            <td>{n.attributes} {n.attributes === 1 ? 'attribute' : 'attributes'} · {n.tools} {n.tools === 1 ? 'tool' : 'tools'}{n.draft ? <> <span className="mcp-badge" data-tone="warning">Draft</span></> : null}</td>
            <td><span className="mcp-badge" data-tone={s.enabled ? 'success' : undefined}>{s.enabled ? 'Enabled' : 'Disabled'}</span></td>
            <td><div className="source-row-actions">
              <button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => choose(s)}>Edit</button>
              <button className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" disabled={actions.busy} onClick={() => setDeleting(s)}>Delete</button>
            </div></td>
          </tr>; })}</tbody>
        </table></div> : <p>No context sources yet. Connect the API that knows your customers and orders.</p>}
      </>}
    {deleting ? <ConfirmDialog title="Delete source" confirmLabel="Delete source" busyLabel="Deleting…" busy={actions.busy}
      warning={deleting.bindings.length ? <>Its trusted attributes are turned off and removed: {deleting.bindings.map(b => (b.approved ?? b.draft)?.name).join(', ')}. Rules that read them deny their calls.</> : undefined}
      onConfirm={() => void deleteSource(deleting)} onClose={() => setDeleting(undefined)}>
      <p>Delete <strong>{deleting.name}</strong>? This removes its settings and its credential.</p>
    </ConfirmDialog> : null}
  </section>;
}
