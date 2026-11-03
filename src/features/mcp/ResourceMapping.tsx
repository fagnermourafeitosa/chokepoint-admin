import { useState } from 'react';
import { Database } from 'lucide-react';
import type { EnvironmentScope } from '../access/environment-scope';
import type { ManagedTool } from './api';
import { showResource, type ToolMappingEntry } from './resource-api';
import { useResourceMapping } from './useResourceMapping';
import { ResourceEditor } from './ResourceEditor';
import { ResourceImpact } from './ResourceImpact';

// The Resource block of a managed tool (Admin 027): a shortcut inside the COAZ
// mapping of the tool. The backend validates and owns the mapping. The line
// comes from the server read (Admin 034); the editor reads the tool mapping.
export function ResourceMapping({ scope, serverId, tool, entry }: { scope: EnvironmentScope; serverId: string; tool: ManagedTool; entry: ToolMappingEntry }) {
  const [stage, setStage] = useState<'closed' | 'edit' | 'approve'>('closed');
  const m = useResourceMapping(scope, serverId, tool.name, entry, stage !== 'closed');
  const { view, line, active, draft } = m;
  const editable = line.active.editable && (!line.draft || line.draft.editable);
  const removing = !!line.draft && !line.draft.resource && !!line.active.resource;
  const label = line.draft ? (removing ? 'Removal draft' : `Draft · ${showResource(line.draft.resource)}`) : line.active.resource ? (line.source === 'server' ? 'Declared by the server' : 'Active') : '';
  const opened = stage !== 'closed';
  return <div className="resource-mapping">
    <div className="resource-mapping-line">
      <Database size={15} aria-hidden="true" /><span>Resource</span><code>{line.active.custom ?? showResource(line.active.resource)}</code>
      {label ? <span className="mcp-badge" data-tone={draft ? 'warning' : 'success'}>{label}</span> : null}
      {editable ? <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => setStage(s => (s === 'closed' ? 'edit' : 'closed'))}>{stage === 'closed' ? 'Configure resource' : 'Close'}</button> : <small className="cp-admin-muted">This mapping uses an advanced form. Edit it in Configure mapping.</small>}
    </div>
    {m.error ? <p role="alert" className="cp-admin-notice" data-tone="danger">{m.error}{m.conflict ? <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" disabled={m.pending} onClick={() => void m.reload()}>Reload</button> : null}</p> : null}
    {m.notice ? <p role="status" className="cp-admin-notice">{m.notice}</p> : null}
    {opened && !view ? (m.query.isError ? <p role="alert" className="resource-warning">Could not load the mapping of this tool. <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => void m.reload()}>Retry</button></p> : <p role="status" className="cp-admin-muted">Loading the mapping…</p>) : null}
    {stage === 'edit' && editable && view ? <>
      {view.source === 'server' && active.resource && !draft ? <p className="cp-admin-muted">Declared by the server. A saved draft creates a local mapping that replaces it after approval.</p> : null}
      <ResourceEditor key={view.server_revision} tool={tool} initial={draft ? draft.resource : active.resource} active={active.resource} agents={m.agents} agentsError={m.agentsError} pending={m.pending} onSave={async r => { await m.save(r); }} />
      {draft ? <div className="resource-actions">
        <button type="button" className="cp-admin-button cp-admin-button--small" disabled={m.pending} onClick={() => setStage('approve')}>Review &amp; approve</button>
        <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" disabled={m.pending} onClick={() => void m.discard()}>Discard draft</button>
      </div> : null}
    </> : null}
    {stage === 'approve' && draft && view ? <div className="resource-mapping-editor">
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
