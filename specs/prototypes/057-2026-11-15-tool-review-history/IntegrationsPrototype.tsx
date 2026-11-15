import { useState } from 'react';
import { MoreHorizontal, Plus, Server, Users } from 'lucide-react';
import { TracePager } from '../../../src/features/investigate/TraceUI';
import '../../../src/features/mcp/mcp.css';
import '../../../src/features/investigate/investigate.css';
import '../../../src/features/identity/identity.css';
import { ReviewHistory } from './HistoryPrototype';
import { EditDialog } from './EditDialog';
import { servers as fixture, type ListedServer } from './data';
import './prototype.css';

// Admin 057 prototype: the Custom MCPs list of Integrations. A row no longer opens the server details
// below the list: the Edit dialog shows the connection and what the server must trust, the review page
// shows the tools, and History opens the review history. Each row has one visible action, Discover,
// and a menu for the others, as the rows of Identity providers (src/features/identity/IdentityRegistry.tsx).
// The list has a pager. Fixed data.

const size = 10;

export function IntegrationsPrototype() {
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState(false);
  const [editing, setEditing] = useState<ListedServer>();
  // Disable connection acts at once, as in the Admin today: the server stops serving its tools, and
  // Review & re-enable turns it on again after a review.
  const [servers, setServers] = useState(fixture);
  const disable = (name: string) => setServers(list => list.map(s => (s.name === name ? { ...s, enabled: false } : s)));
  const rows = servers.slice((page - 1) * size, page * size);
  return <section aria-label="Integrations" className="mcp-registry">
    <header className="access-page-heading"><div><h1 className="cp-admin-title">Integrations</h1><p className="cp-admin-muted">Connect custom MCPs and identity providers, then manage agent access.</p></div><button type="button" className="cp-admin-button"><Plus size={16} />Connect custom MCP</button></header>
    <div className="mcp-types" role="group" aria-label="Integration type"><button aria-pressed="true"><Server size={17} />Custom MCPs</button><button aria-pressed="false"><Users size={17} />Identity providers</button></div>
    <div className="mcp-toolbar"><label htmlFor="mcp-search">Find a connection</label><input id="mcp-search" type="search" className="cp-admin-input" placeholder="Search by name or endpoint" /></div>
    <div className="cp-admin-table-scroll identity-table-region" role="region" aria-label="MCP servers table" tabIndex={0}><table className="cp-admin-table mcp-servers">
      <thead><tr><th>Connection</th><th>Managed tools</th><th>Status</th><th className="il-actions-head">Actions</th></tr></thead>
      <tbody>{rows.map(s => <tr key={s.name}>
        <td><span className="il-name"><Server size={24} aria-hidden="true" /><span><strong>{s.name}</strong><small>Custom MCP · {s.transport}</small></span></span></td>
        <td>{s.tools} tools{s.reviewRequired ? <span className="mcp-badge" data-tone="warning">Review required</span> : null}</td>
        {/* The status is the switch (user, 2026-11-15). Off disables at once; on opens the review with
            Enable server after review checked, because only a confirmed review enables a server. */}
        <td><label className="cp-admin-choice il-status"><input className="cp-admin-switch" type="checkbox" role="switch" checked={s.enabled} aria-label={`${s.name} enabled`} onChange={e => (e.target.checked ? window.location.assign('/prototype/tool-review-order') : disable(s.name))} />{s.enabled ? 'Enabled' : 'Disabled'}</label></td>
        <td><div className="identity-row-actions il-row-actions">
          <a className="cp-admin-button cp-admin-button--ghost" href="/prototype/tool-review-order">{s.reviewRequired ? 'Review' : 'Discover'}</a>
          <details className="identity-menu" name="mcp-row-menu"><summary aria-label={`More actions for ${s.name}`}><MoreHorizontal size={18} /></summary><div onClick={e => e.currentTarget.closest('details')?.removeAttribute('open')}>
            <button type="button" onClick={() => setEditing(s)}>Edit connection</button>
            <button type="button" onClick={() => setHistory(true)}>Review history</button>
          </div></details>
        </div></td>
      </tr>)}</tbody>
    </table></div>
    <TracePager page={page} size={size} total={servers.length} onPage={setPage} />
    {history ? <ReviewHistory onClose={() => setHistory(false)} /> : null}
    {editing ? <EditDialog server={editing} onClose={() => setEditing(undefined)} /> : null}
  </section>;
}
