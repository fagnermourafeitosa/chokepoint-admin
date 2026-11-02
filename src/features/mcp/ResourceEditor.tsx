import { useState } from 'react';
import { CircleHelp, TriangleAlert } from 'lucide-react';
import { SelectMenu } from '../../components/ui/dropdown/SelectMenu';
import { Tooltip } from '../../components/ui/tooltip/Tooltip';
import { usePendingChanges } from '../auth/pending/PendingChanges';
import type { ManagedTool } from './api';
import { propose, resourceTypePattern, toolArguments, type ResourceMap } from './resource-api';
import { ResourceImpact } from './ResourceImpact';
import type { ResourceAgent } from './resource-api';

const sample = 'example-value';

// The form of the Resource block (Admin 027 section 2). The keyed parent resets
// it when the mapping changes, so it always starts from the saved draft or the active mapping.
export function ResourceEditor({ tool, initial, active, agents, agentsError, pending, onSave }: { tool: ManagedTool; initial?: ResourceMap; active?: ResourceMap; agents: ResourceAgent[]; agentsError: boolean; pending: boolean; onSave: (resource?: ResourceMap) => void }) {
  const [argument, setArgument] = useState(initial?.argument ?? '');
  const [type, setType] = useState(initial?.type ?? '');
  const [edited, setEdited] = useState(!!initial?.type);
  usePendingChanges(argument !== (initial?.argument ?? '') || type !== (initial?.type ?? ''));
  const args = toolArguments(tool);
  const selected = args.find(a => a.name === argument);
  const valid = resourceTypePattern.test(type);
  const next = argument ? { argument, type } : undefined;
  return <div className="resource-mapping-editor">
    <p className="cp-admin-muted">The resource is the object a call acts on. An agent can call this tool only on resources it has.</p>
    <div className="resource-field"><span>Argument</span>
      <SelectMenu block label="Argument" value={argument} disabled={pending || !args.length} onChange={v => { setArgument(v); if (!edited) setType(v ? propose(tool.name, v) : ''); }}
        options={[{ value: '', label: 'No resource. Calls have no resource check.' }, ...args.map(a => ({ value: a.name, disabled: !a.usable, label: `${a.name} · ${a.type}${a.required ? ' · required' : ''}${a.type !== 'string' ? ' · must be a string' : !a.usable ? ' · name can not be used' : ''}` }))]} />
      {!args.length ? <small>This tool has no arguments, so it can not have a resource.</small> : null}
    </div>
    {argument ? <>
      <div className="resource-field">
        <span className="resource-label">Resource type{!edited ? <em> · proposed</em> : null}<Tooltip content="A label that identifies one type of resource on this server. Tools with the same resource type share the allowed values in an agent. It has no other effect."><CircleHelp size={14} aria-label="About resource type" /></Tooltip></span>
        <input className="cp-admin-input" aria-label="Resource type" disabled={pending} value={type} onChange={e => { setType(e.target.value.trim()); setEdited(true); }} aria-invalid={!!type && !valid} />
        <small>{type && !valid ? 'Use 2 to 80 lowercase letters, digits and _, starting with a letter.' : !edited ? 'Proposed from the tool and the argument. You can edit it.' : ''}</small>
      </div>
      {selected && !selected.required ? <p className="resource-warning"><TriangleAlert size={14} aria-hidden="true" />{selected.name} is optional. A call without it is denied.</p> : null}
      <div className="resource-preview"><span>Example</span><code>{`{ "${argument}": "${sample}" }`}</code><span>→</span><strong>{type || 'resource_type'} › {sample}</strong><small>Missing, empty or not a string: the call is denied.</small></div>
    </> : null}
    <ResourceImpact active={active} next={next} agents={agents} error={agentsError} />
    <div className="resource-actions">
      <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={pending || (!!argument && !valid)} onClick={() => onSave(next)}>{pending ? 'Saving…' : 'Save draft'}</button>
    </div>
    <p className="cp-admin-muted resource-note">A draft has no effect. After approval, new calls use the mapping. A change needs a new review, like source bindings.</p>
  </div>;
}
