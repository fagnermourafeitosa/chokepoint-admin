import { Dialog } from '../../components/ui/dialog/Dialog';
import type { MCPServer } from '../mcp/api';
import type { Configuration, PermissionDocument } from './api';
import { emptyDocument } from './api';

function Definition({ document, servers }: { document: PermissionDocument; servers: MCPServer[] }) {
  return <><h4>User associations</h4>{document.members.length ? <ul>{document.members.map(m => <li key={`${m.issuer}:${m.subject}`}><code>{m.subject}</code><small>{m.issuer}</small></li>)}</ul> : <p>No users associated.</p>}
    <h4>Server and tool permissions</h4>{document.grants.length ? <ul>{document.grants.map(g => <li key={g.server_id}><strong>{servers.find(s => s.id === g.server_id)?.name ?? g.server_id}</strong><small>Server access granted</small><span>{g.tools.length ? g.tools.join(', ') : 'No tool permissions'}</span></li>)}</ul> : <p>No server or tool permissions.</p>}
    <h4>Fine-grained policies</h4>{document.policies.length ? document.policies.map(p => <div className="permission-review-rule" key={p.id}><strong>{p.name}</strong><small>{servers.find(s => s.id === p.server_id)?.name ?? p.server_id} / {p.tool_name || 'All permitted tools'}</small><pre>{p.expression}</pre><small>{p.required_bindings.length} required source bindings</small></div>) : <p>No additional conditions. Explicit server/tool permissions are still required.</p>}</>;
}

export function PermissionReview({ configuration, servers, revoke, busy, error, onClose, onConfirm }: { configuration: Configuration; servers: MCPServer[]; revoke: boolean; busy: boolean; error: string; onClose: () => void; onConfirm: () => void }) {
  return <Dialog title={revoke ? 'Revoke published permissions' : 'Publish permission changes'} onClose={() => { if (!busy) onClose(); }}>
    <div className="admin-dialog-body permission-review"><p>{revoke ? 'Remove the published access from this grouping. An independent saved draft is retained. Other groupings are still evaluated.' : 'These saved changes will replace the published permissions for this grouping. Every applicable fine-grained condition must pass.'}</p>
      <details><summary>Currently published</summary><Definition document={configuration.published ?? emptyDocument()} servers={servers} /></details>
      {!revoke && configuration.draft ? <section><h3>After publication</h3><Definition document={configuration.draft} servers={servers} /></section> : null}
      {error ? <p role="alert">{error}</p> : null}
    </div><div className="admin-dialog-actions"><button className="cp-admin-button cp-admin-button--secondary" disabled={busy} onClick={onClose}>Cancel</button><button className={`cp-admin-button${revoke ? ' cp-admin-button--danger' : ''}`} disabled={busy} onClick={onConfirm}>{busy ? 'Saving…' : revoke ? 'Revoke published permissions' : 'Publish changes'}</button></div>
  </Dialog>;
}
