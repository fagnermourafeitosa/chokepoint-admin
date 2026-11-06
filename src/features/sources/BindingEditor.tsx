import { usePendingChanges } from '../auth/pending/PendingChanges';
import { SelectMenu } from '../../components/ui/dropdown/SelectMenu';
import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { mcpApi, mcpKey } from '../mcp/api';
import { sourceApi, type Source, type Binding, type BindingConfig, type Operation } from './api';
import { OpenAPIImport } from './OpenAPIImport';
import { BindingFields } from './BindingFields';
import type { EnvironmentScope } from '../access/environment-scope';
import type { SourceActions } from './useSources';

// The AuthZEN entity type must equal the type that the COAZ projection gives the call, or the call is
// blocked: "identity" for the subject and "tool" for the object of the call (backend pep/coaz/projection.go).
const entityType = (entity: BindingConfig['entity']) => (entity === 'subject' ? 'identity' : 'tool');

function configFrom(binding: Binding | undefined): BindingConfig {
  const version = binding?.draft ?? binding?.approved;
  if (!version) return { name: '', server_id: '', tool_name: '', entity: 'resource', entity_type: 'tool', path: '', parameters: [], attributes: [{ name: '', pointer: '', type: 'string' }] };
  return { name: version.name, server_id: version.server_id, tool_name: version.tool_name, entity: version.entity, entity_type: version.entity_type, path: version.path, parameters: version.parameters, attributes: version.attributes };
}

// The trusted attributes editor (Admin 048, item 33): which tool, about what, the API operation,
// the identifiers, the attributes and a sample, then a name.
export function BindingEditor({ source, binding, scope, actions, onClose }: { source: Source; binding?: Binding; scope: EnvironmentScope; actions: SourceActions; onClose: () => void }) {
  const [config, setConfig] = useState(() => configFrom(binding)), [sample, setSample] = useState('{}'), [preview, setPreview] = useState<unknown>(), [sampleError, setSampleError] = useState('');
  const [initialConfig] = useState(() => JSON.stringify(config));
  usePendingChanges(actions.busy || JSON.stringify(config) !== initialConfig || sample !== '{}');
  const servers = useInfiniteQuery({ queryKey: mcpKey(scope), queryFn: ({ signal, pageParam }) => mcpApi.list(scope, pageParam, signal), initialPageParam: 0, getNextPageParam: last => last.next_offset ?? undefined });
  const items = servers.data?.pages.flatMap(p => p.items) ?? [];
  const selectedServer = items.find(s => s.id === config.server_id);
  function choose(operation: Operation) {
    setConfig({ ...config, name: config.name || operation.operation_id || 'API attributes', path: operation.path, parameters: operation.parameters.map(p => ({ name: p.name, in: p.in, from: config.entity === 'subject' ? 'subject_id' : 'resource_id' })), attributes: operation.fields.slice(0, 32).map((field, i) => ({ name: (field.pointer.split('/').at(-1) || `attribute_${i + 1}`).replace(/[^A-Za-z0-9_]/g, '_').replace(/^[^A-Za-z]/, 'a_'), pointer: field.pointer, type: field.type })) });
    setPreview(undefined);
  }
  const setAbout = (entity: BindingConfig['entity']) => setConfig({ ...config, entity });
  async function save() {
    const next = { ...config, entity_type: entityType(config.entity) };
    const result = await actions.run(signal => sourceApi.binding(scope, source, binding?.id, 'draft', next, signal));
    if (result) { actions.saved(result); onClose(); }
  }
  async function testSample() {
    setPreview(undefined); setSampleError('');
    let value: unknown;
    try { value = JSON.parse(sample); } catch { setSampleError('Enter valid JSON.'); return; }
    const result = await actions.run(signal => sourceApi.preview(scope, source.id, value, config.attributes, signal));
    if (result) setPreview(result.values);
  }
  return <section className="cp-admin-panel source-form"><h2>{binding ? 'Edit trusted attributes' : 'Add trusted attributes'}</h2>
    <form onSubmit={e => { e.preventDefault(); void save(); }}><fieldset disabled={actions.busy}>
      <div className="source-field-pair">
        <label>MCP server<SelectMenu block required label="MCP server" value={config.server_id} onChange={v => setConfig({ ...config, server_id: v, tool_name: '' })} options={[{ value: '', label: 'Select server' }, ...items.filter(s => s.enabled).map(s => ({ value: s.id, label: s.name }))]} /></label>
        <label>Tool<SelectMenu block required label="Tool" value={config.tool_name} onChange={v => setConfig({ ...config, tool_name: v })} options={[{ value: '', label: 'Select approved tool' }, ...(selectedServer?.tools.filter(t => t.enabled && t.selected && t.reviewed && t.change !== 'removed').map(t => ({ value: t.name, label: t.name })) ?? [])]} /></label>
      </div>
      <small>Rules on this tool can read these attributes.</small>
      {servers.hasNextPage ? <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => void servers.fetchNextPage()}>Load more servers</button> : null}
      {servers.isError ? <p role="alert">Could not load servers. <button type="button" onClick={() => void servers.refetch()}>Retry</button></p> : null}
      <label>About<SelectMenu block label="About" value={config.entity} onChange={v => setAbout(v as BindingConfig['entity'])} options={[{ value: 'resource', label: 'Object of the call' }, { value: 'subject', label: 'Subject' }]} /></label>
      <small>{config.entity === 'subject' ? 'Facts about the person or service that delegates, for example their department.' : 'Facts about what the call acts on, for example the owner of an order.'}</small>
      <label>GET path<input className="cp-admin-input source-code" required value={config.path} onChange={e => setConfig({ ...config, path: e.target.value })} placeholder="/orders/{order_id}" /></label>
      <small>Relative to {source.base_url}.</small>
      <OpenAPIImport scope={scope} actions={actions} onChoose={choose} />
      <BindingFields value={config} onChange={value => { setConfig(value); setPreview(undefined); }} />
      <details className="cp-admin-accordion"><summary>Try with a sample response</summary><div>
        <label>Sample response<textarea className="cp-admin-input source-code" rows={6} value={sample} onChange={e => { setSample(e.target.value); setPreview(undefined); }} /></label>
        <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={actions.busy} onClick={() => void testSample()}>Read the attributes</button>
        {sampleError ? <p role="alert">{sampleError}</p> : null}
        {preview !== undefined ? <><p role="status">From the sample only. No API call, and no rule is checked.</p><pre>{JSON.stringify(preview, null, 2)}</pre></> : null}
      </div></details>
      <label>Name<input className="cp-admin-input" required maxLength={80} value={config.name} onChange={e => setConfig({ ...config, name: e.target.value })} /></label>
      <div className="source-actions source-actions--end"><button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={onClose}>Cancel</button><button className="cp-admin-button" disabled={!config.attributes.length}>Save draft</button></div>
    </fieldset></form>
  </section>;
}
