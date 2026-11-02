import { useState } from 'react';
import { Database } from 'lucide-react';
import type { EnvironmentScope } from '../access/environment-scope';
import type { ManagedTool } from './api';
import { showResource } from './resource-api';
import { useResourceMapping } from './useResourceMapping';
import { ResourceEditor } from './ResourceEditor';
import { ResourceImpact } from './ResourceImpact';

// The Resource block of a managed tool (Admin 027): a shortcut inside the COAZ
// mapping of the tool. The backend validates and owns the mapping.
export function ResourceMapping({ scope, serverId, tool }: { scope: EnvironmentScope; serverId: string; tool: ManagedTool }) {
  const [stage, setStage] = useState<'closed' | 'edit' | 'approve'>('closed');
  const m = useResourceMapping(scope, serverId, tool.name, stage !== 'closed');
  const { view, active, draft } = m;
  if (m.query.isError && !view) return <div className="resource-mapping"><p role="alert" className="resource-warning">Could not load the resource of this tool. <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => void m.reload()}>Retry</button></p></div>;
  if (!view) return <div className="resource-mapping"><p role="status" className="cp-admin-muted">Loading resource…</p></div>;
  const editable = active.editable && (!draft || draft.editable);
  const removing = !!draft && !draft.resource && !!active.resource;
  const label = draft ? (removing ? 'Removal draft' : `Draft · ${showResource(draft.resource)}`) : active.resource ? (view.source === 'server' ? 'Declared by the server' : 'Active') : '';
  return <div className="resource-mapping">
    <div className="resource-mapping-line">
      <Database size={15} aria-hidden="true" /><span>Resource</span><code>{active.custom ?? showResource(active.resource)}</code>
      {label ? <span className="mcp-badge" data-tone={draft ? 'warning' : 'success'}>{label}</span> : null}
      {editable ? <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => setStage(s => (s === 'closed' ? 'edit' : 'closed'))}>{stage === 'closed' ? 'Configure resource' : 'Close'}</button> : <small className="cp-admin-muted">This mapping uses an advanced form. Edit it in Configure mapping.</small>}
    </div>
    {m.error ? <p role="alert" className="cp-admin-notice" data-tone="danger">{m.error}{m.conflict ? <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" disabled={m.pending} onClick={() => void m.reload()}>Reload</button> : null}</p> : null}
    {m.notice ? <p role="status" className="cp-admin-notice">{m.notice}</p> : null}
    {stage === 'edit' && editable ? <>
      {view.source === 'server' && active.resource && !draft ? <p className="cp-admin-muted">Declared by the server. A saved draft creates a local mapping that replaces it after approval.</p> : null}
      <ResourceEditor key={view.server_revision} tool={tool} initial={draft ? draft.resource : active.resource} active={active.resource} agents={m.agents} agentsError={m.agentsError} pending={m.pending} onSave={async r => { await m.save(r); }} />
      {draft ? <div className="resource-actions">
        <button type="button" className="cp-admin-button cp-admin-button--small" disabled={m.pending} onClick={() => setStage('approve')}>Review &amp; approve</button>
        <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" disabled={m.pending} onClick={() => void m.discard()}>Discard draft</button>
      </div> : null}
    </> : null}
    {stage === 'approve' && draft ? <div className="resource-mapping-editor">
      <p><strong>Review the resource change</strong></p>
      <div className="resource-preview"><span>Current</span><code>{showResource(active.resource)}</code><span>→</span><span>Proposed</span><strong>{showResource(draft.resource)}</strong></div>
      <ResourceImpact active={active.resource} next={draft.resource} agents={m.agents} error={m.agentsError} />
      {!view.can_approve ? <p role="alert" className="cp-admin-notice" data-tone="danger">Review and enable the current server and tool through discovery before approving this mapping.</p> : null}
      <p className="cp-admin-muted resource-note">Approval replaces the active mapping of this tool. New calls use it.</p>
      <div className="resource-actions">
        <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={m.pending} onClick={() => setStage('edit')}>Back</button>
        <button type="button" className="cp-admin-button cp-admin-button--small" disabled={m.pending || !view.can_approve} onClick={async () => { if (await m.approve()) setStage('closed'); }}>{m.pending ? 'Approving…' : 'Approve'}</button>
      </div>
    </div> : null}
  </div>;
}
