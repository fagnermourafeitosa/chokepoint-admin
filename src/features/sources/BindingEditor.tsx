import { usePendingChanges } from '../auth/pending/PendingChanges';
import { SelectMenu } from '../../components/ui/dropdown/SelectMenu';
import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { mcpApi, mcpKey } from '../mcp/api';
import { sourceApi, type Source, type Binding, type BindingConfig, type Operation, type Parameter } from './api';
import { OpenAPIImport } from './OpenAPIImport';
import { BindingFields } from './BindingFields';
import type { EnvironmentScope } from '../access/environment-scope';
import type { SourceActions } from './useSources';

// The AuthZEN entity type must equal the type that the COAZ projection gives the call, or the call is
// blocked: "identity" for the subject and "tool" for the object of the call (backend pep/coaz/projection.go).
const entityType = (entity: BindingConfig['entity']) => (entity === 'subject' ? 'identity' : 'tool');

// Admin 050: Resource ID is no longer an identifier. A parameter saved with it opens as Tool
// argument with no pointer, so saving asks for the argument.
const fromResourceId = (p: Parameter): Parameter => ((p.from as string) === 'resource_id' ? { name: p.name, in: p.in, from: 'argument' } : p);

function configFrom(binding: Binding | undefined): BindingConfig {
  const version = binding?.draft ?? binding?.approved;
  if (!version) return { name: '', server_id: '', tool_name: '', entity: 'resource', entity_type: 'tool', path: '', parameters: [], attributes: [{ name: '', pointer: '', type: 'string' }] };
  return { name: version.name, server_id: version.server_id, tool_name: version.tool_name, entity: version.entity, entity_type: version.entity_type, path: version.path, parameters: version.parameters.map(fromResourceId), attributes: version.attributes };
}

// The trusted attributes editor (Admin 048, item 34): a name, which tool, what the attributes
// describe, the API operation, the identifiers and the attributes.
export function BindingEditor({ source, binding, scope, actions, onClose }: { source: Source; binding?: Binding; scope: EnvironmentScope; actions: SourceActions; onClose: () => void }) {
  const [config, setConfig] = useState(() => configFrom(binding));
  const [initialConfig] = useState(() => JSON.stringify(config));
  usePendingChanges(actions.busy || JSON.stringify(config) !== initialConfig);
  const servers = useInfiniteQuery({ queryKey: mcpKey(scope), queryFn: ({ signal, pageParam }) => mcpApi.list(scope, pageParam, signal), initialPageParam: 0, getNextPageParam: last => last.next_offset ?? undefined });
  const items = servers.data?.pages.flatMap(p => p.items) ?? [];
  const selectedServer = items.find(s => s.id === config.server_id);
  function choose(operation: Operation) {
    setConfig({ ...config, name: config.name || operation.operation_id || 'API attributes', path: operation.path, parameters: operation.parameters.map(p => ({ name: p.name, in: p.in, ...(config.entity === 'subject' ? { from: 'subject_id' as const } : { from: 'argument' as const, pointer: `/${p.name}` }) })), attributes: operation.fields.slice(0, 32).map((field, i) => ({ name: (field.pointer.split('/').at(-1) || `attribute_${i + 1}`).replace(/[^A-Za-z0-9_]/g, '_').replace(/^[^A-Za-z]/, 'a_'), pointer: field.pointer, type: field.type })) });
  }
  const setAbout = (entity: BindingConfig['entity']) => setConfig({ ...config, entity });
  async function save() {
    const next = { ...config, entity_type: entityType(config.entity) };
    const result = await actions.run(signal => sourceApi.binding(scope, source, binding?.id, 'draft', next, signal));
    if (result) { actions.saved(result); onClose(); }
  }
  return <section className="cp-admin-panel source-form"><h2>{binding ? 'Edit trusted attributes' : 'Add trusted attributes'}</h2>
    <form onSubmit={e => { e.preventDefault(); void save(); }}><fieldset disabled={actions.busy}>
      <label>Name<input className="cp-admin-input" required maxLength={80} value={config.name} onChange={e => setConfig({ ...config, name: e.target.value })} /></label>
      <div className="source-field-pair">
        <label>MCP server<SelectMenu block required label="MCP server" value={config.server_id} onChange={v => setConfig({ ...config, server_id: v, tool_name: '' })} options={[{ value: '', label: 'Select server' }, ...items.filter(s => s.enabled).map(s => ({ value: s.id, label: s.name }))]} /></label>
        <label>Tool<SelectMenu block required label="Tool" value={config.tool_name} onChange={v => setConfig({ ...config, tool_name: v })} options={[{ value: '', label: 'Select approved tool' }, ...(selectedServer?.tools.filter(t => t.enabled && t.selected && t.reviewed && t.change !== 'removed').map(t => ({ value: t.name, label: t.name })) ?? [])]} /></label>
      </div>
      <small>Rules on this tool can read these attributes.</small>
      {servers.hasNextPage ? <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => void servers.fetchNextPage()}>Load more servers</button> : null}
      {servers.isError ? <p role="alert">Could not load servers. <button type="button" onClick={() => void servers.refetch()}>Retry</button></p> : null}
      <label>These attributes describe<SelectMenu block label="These attributes describe" value={config.entity} onChange={v => setAbout(v as BindingConfig['entity'])} options={[{ value: 'subject', label: 'The subject · the person or service that delegates to the agent' }, { value: 'resource', label: 'The object of the call · what the tool acts on' }]} /></label>
      <small>{config.entity === 'subject' ? 'For example the department or the refund limit of the person.' : 'For example the owner or the status of an order.'}</small>
      <label>GET path<input className="cp-admin-input source-code" required value={config.path} onChange={e => setConfig({ ...config, path: e.target.value })} placeholder="/orders/{order_id}" /></label>
      <small>Relative to {source.base_url}.</small>
      <OpenAPIImport scope={scope} actions={actions} onChoose={choose} />
      <BindingFields value={config} onChange={setConfig} />
      <div className="source-actions source-actions--end"><button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={onClose}>Cancel</button><button className="cp-admin-button" disabled={!config.attributes.length}>Save draft</button></div>
    </fieldset></form>
  </section>;
}
