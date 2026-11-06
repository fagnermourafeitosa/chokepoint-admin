import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ConfirmDialog } from '../../components/ui/dialog/ConfirmDialog';
import { Dialog } from '../../components/ui/dialog/Dialog';
import { Notice } from '../../components/ui/notice/Notice';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Server, Wrench } from 'lucide-react';
import { mcpApi, mcpKey } from '../mcp/api';
import { sourceApi, type Source, type Binding, type BindingVersion } from './api';
import { BindingEditor } from './BindingEditor';
import type { EnvironmentScope } from '../access/environment-scope';
import type { SourceActions } from './useSources';

const about = (v?: BindingVersion) => (v?.entity === 'subject' ? 'Of the subject' : 'Of the object of the call');

// The status of one binding (Admin 048, item 32): On, Draft or Needs review.
function status(item: Binding, source: Source): { label: string; tone?: string } {
  if (item.approved && item.approved.source_revision !== source.config_revision) return { label: 'Needs review', tone: 'warning' };
  if (item.draft) return { label: 'Draft', tone: 'warning' };
  return item.approved ? { label: 'On', tone: 'success' } : { label: 'Draft', tone: 'warning' };
}

// What a version reads, in one sentence, for the Turn on dialog.
function reads(v: BindingVersion) {
  return <p>Reads <strong>{v.attributes.map(a => a.name).join(', ')}</strong> about the {v.entity === 'subject' ? 'subject' : 'object of the call'} of <code>{v.tool_name}</code>, with GET <code>{v.path}</code>.</p>;
}

// The trusted attributes of a source (Admin 048, items 32 and 34).
export function SourceBindings({ source, scope, actions }: { source: Source; scope: EnvironmentScope; actions: SourceActions }) {
  const [editing, setEditing] = useState<string>();
  const [review, setReview] = useState<{ id: string; action: 'approve' | 'retire' }>();
  // Server names for the Tool column, from the same cached list as the editor.
  const servers = useInfiniteQuery({ queryKey: mcpKey(scope), queryFn: ({ signal, pageParam }) => mcpApi.list(scope, pageParam, signal), initialPageParam: 0, getNextPageParam: last => last.next_offset ?? undefined });
  const serverName = (id?: string) => servers.data?.pages.flatMap(p => p.items).find(x => x.id === id)?.name ?? '';
  const binding = source.bindings.find(b => b.id === editing), reviewed = source.bindings.find(b => b.id === review?.id);
  // The published rules that read the attributes are fetched when Turn off opens, never from a cached
  // document. A failed lookup is not shown as "no rule".
  const dependencies = useQuery({ queryKey: ['binding-dependencies', scope.userId, scope.tenantId, scope.environmentId, review?.id], queryFn: ({ signal }) => sourceApi.dependencies(scope, review!.id, signal), enabled: review?.action === 'retire', retry: false });
  async function change(item: Binding, action: 'approve' | 'discard' | 'retire') {
    const result = await actions.run(signal => sourceApi.binding(scope, source, item.id, action, undefined, signal));
    if (result) { actions.saved(result); setReview(undefined); }
  }
  if (editing) return <BindingEditor key={`${source.revision}:${editing}`} source={source} binding={binding} scope={scope} actions={actions} onClose={() => setEditing(undefined)} />;
  const turnOn = review?.action === 'approve' && reviewed?.draft;
  const blocked = !source.enabled ? 'Enable this source first, in the Connection tab.' : reviewed?.draft && reviewed.draft.source_revision !== source.config_revision ? 'The connection changed after this draft. Edit and save the draft again.' : undefined;
  const rules = dependencies.data?.items ?? [];
  return <section>
    <div className="source-section-heading"><div><h2>Trusted attributes</h2><p className="cp-admin-muted">Each operation reads trusted attributes from this API for one tool, before its rules are checked.</p></div><button className="cp-admin-button" onClick={() => setEditing('new')}>Add trusted attributes</button></div>
    {source.bindings.length ? <div className="cp-admin-table-scroll"><table className="cp-admin-table source-table">
      <thead><tr><th>Name</th><th>MCP server · tool</th><th>Attributes</th><th>Status</th><th className="source-actions-head">Actions</th></tr></thead>
      <tbody>{source.bindings.map(item => {
        const version = item.draft ?? item.approved, st = status(item, source);
        return <tr key={item.id}>
          <td><strong>{version?.name}</strong><small className="source-mono">GET {version?.path}</small></td>
          <td><div className="source-tool"><span><Server size={14} aria-hidden="true" />{serverName(version?.server_id)}</span><span><Wrench size={14} aria-hidden="true" /><code>{version?.tool_name}</code></span></div></td>
          <td><div className="source-attribute-list"><strong className="source-describes-line">{about(version)}</strong>{version?.attributes.map(a => <span key={a.name}><code>{a.name}</code><span className="mcp-badge">{a.type}</span></span>)}</div></td>
          <td><span className="mcp-badge" data-tone={st.tone}>{st.label}</span></td>
          <td><div className="source-row-actions">
            <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" disabled={actions.busy} onClick={() => setEditing(item.id)}>Edit</button>
            {item.draft ? <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" disabled={actions.busy} onClick={() => setReview({ id: item.id, action: 'approve' })}>Turn on</button> : null}
            {item.draft ? <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" disabled={actions.busy} onClick={() => void change(item, 'discard')}>Discard draft</button> : null}
            {item.approved ? <button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" disabled={actions.busy} onClick={() => setReview({ id: item.id, action: 'retire' })}>Turn off</button> : null}
          </div></td>
        </tr>;
      })}</tbody>
    </table></div> : <p className="cp-admin-muted">No trusted attributes yet. Add them by hand, or import an operation from an OpenAPI description.</p>}
    {turnOn && reviewed?.draft ? <Dialog title="Turn on these trusted attributes?" onClose={() => { if (!actions.busy) setReview(undefined); }}>
      <div className="admin-dialog-body">
        {reads(reviewed.draft)}
        <p>{reviewed.approved ? 'They replace the version that is on now.' : 'Rules on this tool can read them from the next call.'} If the API fails or the source is turned off, calls that need them are denied.</p>
        {blocked ? <Notice tone="warning">{blocked}</Notice> : null}
      </div>
      <div className="admin-dialog-actions">
        <button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={actions.busy} onClick={() => setReview(undefined)}>Cancel</button>
        <button type="button" className="cp-admin-button" disabled={actions.busy || !!blocked} onClick={() => void change(reviewed, 'approve')}>{actions.busy ? 'Turning on…' : 'Turn on'}</button>
      </div>
    </Dialog> : null}
    {review?.action === 'retire' && reviewed ? <ConfirmDialog title="Turn off these trusted attributes?" confirmLabel="Turn off" busyLabel="Turning off…" busy={actions.busy || dependencies.isPending} error={dependencies.isError ? 'Could not check which rules read them. Close and try again.' : undefined} onConfirm={() => { if (!dependencies.isError && !dependencies.isPending) void change(reviewed, 'retire'); }} onClose={() => setReview(undefined)}>
      <p><strong>{reviewed.approved?.name}</strong> stops supplying {reviewed.approved?.attributes.map(a => a.name).join(', ')} to <code>{reviewed.approved?.tool_name}</code>.</p>
      {dependencies.isPending ? <p role="status">Checking which rules read them…</p>
        : rules.length ? <Notice tone="warning" title="These published rules read them and will deny every call"><ul>{rules.map(r => <li key={`${r.agent_id}:${r.policy_id}`}>{r.agent_name} · {r.policy_name}</li>)}</ul></Notice>
        : dependencies.isSuccess ? <p className="cp-admin-muted">No published rule reads them.</p> : null}
    </ConfirmDialog> : null}
  </section>;
}
