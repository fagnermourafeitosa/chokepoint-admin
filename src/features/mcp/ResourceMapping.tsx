import { useState } from 'react';
import { Database, TriangleAlert } from 'lucide-react';
import type { ManagedTool } from './api';
import { WaitingBackend } from '../access/delegation/WaitingBackend';
import { Tooltip } from '../../components/ui/tooltip/Tooltip';
import { CircleHelp } from 'lucide-react';

// Layout prototype (Admin A2): the resource mapping of a reviewed tool (Backend 029). Local state only.
export type ResourceMap = { pointer: string; kind: string };
export type ResourceState = { active?: ResourceMap; draft?: ResourceMap | null };

const kindPattern = /^[a-z][a-z0-9_]{1,79}$/;
// The proposal is <tool>_<argument>, as a valid identifier. The administrator can edit it.
const propose = (tool: string, arg: string) => `${tool}_${arg}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');

function argumentsOf(tool: ManagedTool) {
  const schema = tool.contract.inputSchema as { properties?: Record<string, { type?: string; description?: string }>; required?: string[] } | undefined;
  return Object.entries(schema?.properties ?? {}).map(([name, p]) => ({ name, type: p.type ?? 'unknown', required: schema?.required?.includes(name) ?? false, description: p.description }));
}

const show = (m?: ResourceMap) => (m ? `/${m.pointer} → ${m.kind}` : 'None');

export function ResourceMapping({ tool, state, kinds, agents, onChange }: { tool: ManagedTool; state: ResourceState; kinds: string[]; agents: (kind: string) => string[]; onChange: (s: ResourceState) => void }) {
  const [open, setOpen] = useState(false);
  const current = state.draft === undefined ? state.active : state.draft ?? undefined;
  const [pointer, setPointer] = useState(current?.pointer ?? '');
  const [kind, setKind] = useState(current?.kind ?? '');
  const [edited, setEdited] = useState(!!current?.kind);
  const args = argumentsOf(tool);
  const arg = args.find(a => a.name === pointer);
  const sample = pointer.includes('repo') ? 'acme/payments-api' : '42';
  const validKind = kindPattern.test(kind);
  const pending = state.draft !== undefined;
  const removing = state.draft === null;
  const affected = state.active ? agents(state.active.kind) : [];
  const label = pending ? (removing ? 'Removal draft' : 'Draft') : state.active ? 'Active' : '';
  return <div className="resource-mapping">
    <div className="resource-mapping-line">
      <Database size={15} aria-hidden="true" /><span>Resource</span><code>{show(state.active)}</code>
      {label ? <span className="mcp-badge" data-tone={pending ? 'warning' : 'success'}>{label}{pending && !removing ? ` · ${show(state.draft ?? undefined)}` : ''}</span> : null}
      <WaitingBackend spec="029" />
      <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => setOpen(v => !v)}>{open ? 'Close' : 'Configure resource'}</button>
    </div>
    {open ? <div className="resource-mapping-editor">
      <p className="cp-admin-muted">The resource is the object a call acts on. An agent can call this tool only on resources it has.</p>
      <label className="resource-field"><span>Argument</span>
        <select className="cp-admin-input" value={pointer} onChange={e => { setPointer(e.target.value); if (!edited) setKind(e.target.value ? propose(tool.name, e.target.value) : ''); }}>
          <option value="">No resource. Calls have no resource check.</option>
          {args.map(a => <option key={a.name} value={a.name} disabled={a.type !== 'string'}>{a.name} · {a.type}{a.required ? ' · required' : ''}{a.type !== 'string' ? ' · must be a string' : ''}</option>)}
        </select>
        {!args.length ? <small>This tool has no arguments, so it can not have a resource.</small> : null}
      </label>
      {pointer ? <>
        <div className="resource-field">
          <span className="resource-label">Resource type{!edited ? <em> · proposed</em> : null}<Tooltip content="A label that identifies one type of resource on this server. It must be unique on the server. It has no other effect."><CircleHelp size={14} aria-label="About resource type" /></Tooltip></span>
          <input className="cp-admin-input" aria-label="Resource type" value={kind} onChange={e => { setKind(e.target.value.trim()); setEdited(true); }} aria-invalid={!!kind && !validKind} />
          <small>{kind && !validKind ? 'Use lowercase letters, digits and _.' : !edited ? `Proposed from the tool and the argument (${tool.name}_${pointer}). You can edit it.` : ''}</small>
        </div>
        {arg && !arg.required ? <p className="resource-warning"><TriangleAlert size={14} aria-hidden="true" />{arg.name} is optional. A call without it is denied.</p> : null}
        <div className="resource-preview"><span>Example</span><code>{`{ "${pointer}": "${sample}" }`}</code><span>→</span><strong>{kind || 'resource_type'} › {sample}</strong><small>Missing, empty or not a string: the call is denied.</small></div>
      </> : null}
      {state.active && (!pointer || kind !== state.active.kind) && affected.length ? <p className="resource-warning"><TriangleAlert size={14} aria-hidden="true" />{affected.length} {affected.length === 1 ? 'agent has' : 'agents have'} resources of type {state.active.kind} ({affected.join(', ')}). {pointer ? 'They do not apply to this tool after the change.' : 'Without a resource this tool has no resource check for them.'}</p> : null}
      <div className="resource-actions">
        <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={!!pointer && !validKind} onClick={() => { onChange({ ...state, draft: pointer ? { pointer, kind } : null }); setOpen(false); }}>Save draft</button>
        {pending ? <button type="button" className="cp-admin-button cp-admin-button--small" onClick={() => { onChange({ active: state.draft ?? undefined }); setOpen(false); }}>Review &amp; approve</button> : null}
        {pending ? <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => { onChange({ active: state.active }); setPointer(state.active?.pointer ?? ''); setKind(state.active?.kind ?? ''); }}>Discard draft</button> : null}
      </div>
      <p className="cp-admin-muted resource-note">A draft has no effect. After approval, new calls use the mapping. A change needs a new review, like source bindings.</p>
    </div> : null}
  </div>;
}
