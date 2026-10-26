import { useState } from 'react';
import type { AgentScope } from '../access/agent-api';
import type { Policy } from './api';
import { usePermissions } from './usePermissions';
import { PeopleEditor } from './PeopleEditor';
import { GrantsEditor } from './GrantsEditor';
import { PolicyEditor } from './PolicyEditor';
import { PermissionReview } from './PermissionReview';
import './permissions.css';

export function PermissionManager({ scope, agentId }: { scope: AgentScope; agentId: string }) {
  const state = usePermissions(scope, agentId);
  const [tab, setTab] = useState<'grants' | 'people' | 'policies'>('grants');
  const [editing, setEditing] = useState<Policy | 'new'>();
  const [review, setReview] = useState<'publish' | 'revoke'>();
  if (state.query.isPending || state.catalogs.isPending) return <p className="access-detail-content" role="status">Loading permissions and catalogs…</p>;
  if (state.query.isError || state.catalogs.isError || !state.configuration || !state.catalogs.data) return <div className="access-detail-content" role="alert">Could not load this grouping's permissions. <button className="cp-admin-button cp-admin-button--ghost" onClick={() => { void state.query.refetch(); void state.catalogs.refetch(); }}>Retry</button></div>;
  const { configuration, document, catalogs: { data: catalog } } = state;
  function savePolicy(policy: Policy) { state.edit({ ...document, policies: document.policies.some(p => p.id === policy.id) ? document.policies.map(p => p.id === policy.id ? policy : p) : [...document.policies, policy] }); setEditing(undefined); }
  async function confirm() { if (review && await state.change(review)) setReview(undefined); }
  const disabled = state.busy || state.conflict;
  return <div className="permission-manager"><div className="permission-state"><span>{state.dirty ? 'Unsaved edits' : configuration.draft ? 'Saved draft' : configuration.published ? 'Published permissions' : 'No published permissions'} · revision {configuration.revision}</span><small>{configuration.published ? `${configuration.published.members.length} published user associations` : 'Default deny until permissions are published'}</small></div>
    <div className="access-detail-tabs" role="group" aria-label="Permission editor sections">{(['grants', 'people', 'policies'] as const).map(item => <button type="button" key={item} aria-pressed={tab === item} disabled={state.busy} onClick={() => { setTab(item); setEditing(undefined); }}>{item === 'grants' ? 'Servers & tools' : item === 'people' ? 'People' : 'Fine-grained policies'} <span>{item === 'grants' ? document.grants.length : item === 'people' ? document.members.length : document.policies.length}</span></button>)}</div>
    <div className="access-detail-content">{state.error ? <p role="alert">{state.error}</p> : null}{state.conflict ? <p role="alert">Published configuration changed while you were editing. Reload before continuing.</p> : null}
      {tab === 'people' ? <PeopleEditor members={document.members} identities={catalog.identities} disabled={disabled} onChange={members => state.edit({ ...document, members })} /> : tab === 'grants' ? <GrantsEditor grants={document.grants} servers={catalog.servers} disabled={disabled} onChange={grants => state.edit({ ...document, grants })} /> : editing ? <PolicyEditor key={editing === 'new' ? 'new' : editing.id} policy={editing === 'new' ? undefined : editing} servers={catalog.servers} sources={catalog.sources} onSave={savePolicy} onCancel={() => setEditing(undefined)} /> : <section aria-label="Fine-grained policies"><header className="permission-section-header"><div><h3>Fine-grained conditions</h3><p className="cp-admin-muted">All matching conditions must pass for the requested server and tool.</p></div><button className="cp-admin-button" disabled={disabled} onClick={() => setEditing('new')}>Create policy</button></header>
        {document.policies.map(policy => <article key={policy.id} className="permission-policy-row"><div><strong>{policy.name}</strong><small>{catalog.servers.find(s => s.id === policy.server_id)?.name ?? policy.server_id} / {policy.tool_name || 'Every permitted tool'}</small><code>{policy.expression}</code><small>{policy.required_bindings.length} required source bindings</small></div><div className="permission-row-actions"><button className="cp-admin-button cp-admin-button--ghost" disabled={disabled} onClick={() => setEditing(policy)}>Edit</button><button className="cp-admin-button cp-admin-button--ghost" disabled={disabled} onClick={() => state.edit({ ...document, policies: document.policies.filter(p => p.id !== policy.id) })}>Remove</button></div></article>)}
        {!document.policies.length ? <p>No fine-grained policies. Add conditions for tool arguments, user attributes or resource attributes.</p> : null}
      </section>}
    </div>
    <footer className="permission-footer"><p>Changes stay inactive until publication. Access requires server permission, tool permission and every applicable policy.</p><div className="permission-actions"><button className="cp-admin-button cp-admin-button--ghost" disabled={state.busy} onClick={() => void state.reload()}>Reload</button>{configuration.draft ? <button className="cp-admin-button cp-admin-button--ghost" disabled={disabled || state.dirty} onClick={() => void state.change('discard')}>Discard saved draft</button> : null}<button className="cp-admin-button cp-admin-button--secondary" disabled={disabled || !!editing || !state.dirty} onClick={() => void state.change('draft')}>Save draft</button><button className="cp-admin-button" disabled={disabled || state.dirty || !configuration.draft || !!editing} onClick={() => setReview('publish')}>Review & publish</button>{configuration.published ? <button className="cp-admin-button cp-admin-button--ghost" disabled={disabled || state.dirty || !!editing} onClick={() => setReview('revoke')}>Revoke published access</button> : null}</div></footer>
    {review ? <PermissionReview configuration={configuration} servers={catalog.servers} revoke={review === 'revoke'} busy={state.busy} error={state.error} onClose={() => setReview(undefined)} onConfirm={() => void confirm()} /> : null}
  </div>;
}
