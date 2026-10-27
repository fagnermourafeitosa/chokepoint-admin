import { usePendingChanges } from "../auth/pending/PendingChanges";
import { useState, type FormEvent } from 'react';
import type { MCPServer } from '../mcp/api';
import type { Source } from '../sources/api';
import type { Policy } from './api';

export function PolicyEditor({ policy, servers, sources, onSave, onCancel }: { policy?: Policy; servers: MCPServer[]; sources: Source[]; onSave: (policy: Policy) => void; onCancel: () => void }) {
  const [value, setValue] = useState<Policy>(() => policy ? structuredClone(policy) : { id: crypto.randomUUID(), name: '', server_id: '', tool_name: '', expression: '', required_bindings: [] });
  const [initial] = useState(() => JSON.stringify(value));
  usePendingChanges(JSON.stringify(value) !== initial);
  const server = servers.find(s => s.id === value.server_id);
  const selectedTool = server?.tools.find(t => t.name === value.tool_name);
  const schema = selectedTool?.contract.inputSchema as { properties?: Record<string, unknown> } | undefined;
  const bindings = sources.flatMap(source => source.bindings.flatMap(binding => binding.approved && binding.approved.server_id === value.server_id && binding.approved.tool_name === value.tool_name ? [{ source, binding, version: binding.approved }] : []));
  function target(serverId: string, toolName = '') { setValue({ ...value, server_id: serverId, tool_name: toolName, required_bindings: [] }); }
  function submit(event: FormEvent) { event.preventDefault(); onSave(value); }
  function insert(text: string, bindingId?: string) { setValue({ ...value, expression: value.expression ? `${value.expression} ${text}` : text, required_bindings: bindingId ? [...new Set([...value.required_bindings, bindingId])] : value.required_bindings }); }
  return <form className="permission-policy-form" onSubmit={submit}><header><h3>{policy ? 'Edit fine-grained policy' : 'Create fine-grained policy'}</h3><p className="cp-admin-muted">A boolean condition restricts access. Every applicable policy must pass.</p></header>
    <label>Policy name<input className="cp-admin-input" required maxLength={80} value={value.name} onChange={e => setValue({ ...value, name: e.target.value })} /></label>
    <div className="permission-field-pair"><label>MCP server<select className="cp-admin-input" required value={value.server_id} onChange={e => target(e.target.value)}><option value="">Select server</option>{servers.map(s => <option key={s.id} value={s.id}>{s.name}{s.enabled ? '' : ' · unavailable'}</option>)}{value.server_id && !server ? <option value={value.server_id}>Unavailable server</option> : null}</select></label>
      <label>Applies to<select className="cp-admin-input" value={value.tool_name ?? ''} onChange={e => target(value.server_id, e.target.value)}><option value="">Every permitted tool on this server</option>{server?.tools.filter(t => t.change !== 'removed').map(t => <option key={t.name} value={t.name}>{t.name}</option>)}{value.tool_name && !selectedTool ? <option value={value.tool_name}>{value.tool_name} · unavailable</option> : null}</select></label></div>
    <label>CEL condition<textarea className="cp-admin-input permission-code" required maxLength={4096} rows={6} value={value.expression} onChange={e => setValue({ ...value, expression: e.target.value })} spellCheck={false} placeholder="context.chokepoint.arguments.amount <= 1000" /></label>
    <p className="cp-admin-muted">Available objects: <code>subject</code>, <code>action</code>, <code>resource</code>, <code>context</code>. The backend validates the expression when the draft is saved. Missing required data blocks the call.</p>
    {schema?.properties ? <details><summary>Original tool arguments</summary><div className="permission-attribute-list">{Object.keys(schema.properties).map(name => <button className="cp-admin-button cp-admin-button--ghost" type="button" key={name} onClick={() => insert(`context.chokepoint.arguments[${JSON.stringify(name)}]`)}>Insert {name}</button>)}</div></details> : null}
    <fieldset><legend>Required trusted attributes</legend><p className="cp-admin-muted">Select dependencies used by this policy. An unavailable binding blocks evaluation. Attribute insertion also marks its binding as required.</p>
      {bindings.map(({ source, binding, version }) => <div className="permission-binding" key={binding.id}><label><input type="checkbox" checked={value.required_bindings.includes(binding.id)} onChange={e => setValue({ ...value, required_bindings: e.target.checked ? [...value.required_bindings, binding.id] : value.required_bindings.filter(id => id !== binding.id) })} />{source.name} / {version.name}{!source.enabled || version.source_revision !== source.config_revision ? ' · review required' : ''}</label><div className="permission-attribute-list">{version.attributes.map(attribute => <button type="button" className="cp-admin-button cp-admin-button--ghost" key={attribute.name} onClick={() => insert(`${version.entity}.properties.chokepoint[${JSON.stringify(binding.id)}].values[${JSON.stringify(attribute.name)}]`, binding.id)}>Insert {attribute.name} · {attribute.type}</button>)}</div></div>)}
      {value.required_bindings.filter(id => !bindings.some(item => item.binding.id === id)).map(id => <div key={id}><code>{id}</code> · unavailable dependency <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => setValue({ ...value, required_bindings: value.required_bindings.filter(ref => ref !== id) })}>Remove reference</button></div>)}
      {!bindings.length ? <p>{value.tool_name ? 'No approved attribute bindings for this tool. Configure them under Context sources.' : 'Select a tool to use its trusted API bindings.'}</p> : null}
    </fieldset>
    <footer className="permission-actions"><button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={onCancel}>Cancel edit</button><button className="cp-admin-button" disabled={!value.server_id || !value.expression.trim() || !value.name.trim()}>{policy ? 'Update policy in editor' : 'Add policy to editor'}</button></footer>
  </form>;
}
