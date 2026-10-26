import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sourceApi, type Source, type Binding, type BindingVersion } from './api';
import { BindingEditor } from './BindingEditor';
import type { EnvironmentScope } from '../access/environment-scope';
import type { SourceActions } from './useSources';

function Summary({ version }: { version: BindingVersion | undefined }) {
  return version ? <dl><dt>Binding</dt><dd>{version.name}</dd><dt>Operation</dt><dd>GET {version.path}</dd><dt>Target</dt><dd>{version.entity} · {version.entity_type} · {version.tool_name}</dd><dt>Request parameters</dt><dd>{version.parameters.map(p => `${p.in} ${p.name} ← ${p.from}${p.pointer ?? ''}`).join('; ') || 'None'}</dd><dt>Required attributes</dt><dd>{version.attributes.map(a => `${a.name} (${a.type}) ← ${a.pointer || '/ (root)'}`).join('; ')}</dd><dt>Source version</dt><dd>{version.source_revision}</dd></dl> : <p>No approved binding</p>;
}

export function SourceBindings({ source, scope, actions }: { source: Source; scope: EnvironmentScope; actions: SourceActions }) {
  const [editing, setEditing] = useState<string>(), [review, setReview] = useState<{ id: string; action: 'approve' | 'retire' }>();
  const binding = source.bindings.find(b => b.id === editing), reviewed = source.bindings.find(b => b.id === review?.id);
  // Fetch actual published dependencies at retirement review, not from a cached
  // source document. A failed lookup cannot be presented as "no dependencies".
  const dependencies = useQuery({ queryKey: ['binding-dependencies', scope.userId, scope.tenantId, scope.environmentId, review?.id], queryFn: ({ signal }) => sourceApi.dependencies(scope, review!.id, signal), enabled: review?.action === 'retire', retry: false });
  async function change(item: Binding, action: 'approve' | 'discard' | 'retire') {
    const result = await actions.run(signal => sourceApi.binding(scope, source, item.id, action, undefined, signal));
    if (result) { actions.saved(result); setReview(undefined); }
  }
  if (editing) return <BindingEditor key={`${source.revision}:${editing}`} source={source} binding={binding} scope={scope} actions={actions} onClose={() => setEditing(undefined)} />;
  if (review && reviewed) return <section className="cp-admin-panel source-form"><h2>{review.action === 'approve' ? 'Review binding activation' : 'Review binding retirement'}</h2>
    <div className="source-columns"><section><h3>Currently approved</h3><Summary version={reviewed.approved} /></section><section><h3>{review.action === 'approve' ? 'After activation' : 'After retirement'}</h3>{review.action === 'approve' ? <Summary version={reviewed.draft} /> : <p>The binding will stop supplying attributes. Policies requiring those attributes will block access.</p>}</section></div>
    {review.action === 'retire' ? <section><h3>Published policy dependencies</h3>{dependencies.isPending ? <p role="status">Loading affected policies…</p> : dependencies.isError ? <p role="alert">Could not check dependencies. <button className="cp-admin-button" onClick={() => void dependencies.refetch()}>Retry</button></p> : dependencies.data?.items.length ? <ul>{dependencies.data.items.map(ref => <li key={`${ref.agent_id}:${ref.policy_id}`}>{ref.agent_name} / {ref.policy_name}</li>)}</ul> : <p>No published policy declares this binding as required.</p>}</section> : null}
    <p>This binding is required when active. A disabled, changed or unavailable source stops evaluation. Activation also checks the current approved tool schema.</p>
    {!source.enabled ? <p role="alert">Enable this source before activating bindings.</p> : null}
    <div className="source-actions"><button className="cp-admin-button" disabled={actions.busy || (review.action === 'approve' && (!source.enabled || reviewed.draft?.source_revision !== source.config_revision)) || (review.action === 'retire' && (dependencies.isPending || dependencies.isError))} onClick={() => void change(reviewed, review.action)}>Confirm {review.action === 'approve' ? 'activation' : 'retirement'}</button><button className="cp-admin-button cp-admin-button--secondary" disabled={actions.busy} onClick={() => setReview(undefined)}>Cancel</button></div>
  </section>;
  return <section><div className="source-section-heading"><div><h2>{source.name}</h2><p className="cp-admin-muted">Bindings fetch required facts before policy evaluation.</p></div><button className="cp-admin-button" onClick={() => setEditing('new')}>Add attribute binding</button></div><div className="cp-admin-table-scroll"><table className="cp-admin-table"><thead><tr><th>Binding</th><th>Target</th><th>Status</th><th>Actions</th></tr></thead><tbody>{source.bindings.map(item => {
    const version = item.draft ?? item.approved;
    return <tr key={item.id}><td><strong>{version?.name}</strong><small>GET {version?.path}</small></td><td>{version?.entity} · {version?.entity_type}<small>{version?.tool_name}</small></td><td>{item.approved ? 'Approved' : 'Draft only'}<small>{item.draft ? 'Draft saved' : ''}{item.approved?.source_revision !== source.config_revision && item.approved ? ' · Review required' : ''}</small></td><td className="source-row-actions"><button className="cp-admin-button cp-admin-button--ghost" disabled={actions.busy} onClick={() => setEditing(item.id)}>Edit</button>{item.draft ? <><button className="cp-admin-button cp-admin-button--ghost" disabled={actions.busy} onClick={() => setReview({ id: item.id, action: 'approve' })}>Review draft</button><button className="cp-admin-button cp-admin-button--ghost" disabled={actions.busy} onClick={() => void change(item, 'discard')}>Discard draft</button></> : null}{item.approved ? <button className="cp-admin-button cp-admin-button--ghost" disabled={actions.busy} onClick={() => setReview({ id: item.id, action: 'retire' })}>Retire</button> : null}</td></tr>;
  })}</tbody></table></div>{!source.bindings.length ? <p>No bindings yet. Add one manually or import an OpenAPI operation in the binding editor.</p> : null}</section>;
}
