import { useMemo, useState } from 'react';
import { CircleCheck, CircleHelp, Code, Plus } from 'lucide-react';
import { SelectMenu } from '../../../src/components/ui/dropdown/SelectMenu';
import { Tooltip } from '../../../src/components/ui/tooltip/Tooltip';
import type { Condition } from '../../../src/features/access/delegation/model';
import { useCatalog } from '../../../src/features/access/delegation/catalog';
import { RuleBuilder, limitField, limitName, limitsGroup, ruleBindings, ruleCel, ruleComplete, ruleFields, ruleLimits, ruleSentence, type Rule, type RuleField } from './RuleBuilder';

const limitsHelp = 'Each instance of the agent can carry its own limits in its signed token. Type the name that the instance sends. If the token has no limit with this name, the call is denied.';

// Instance limits: the administrator types the name and chooses number or string.
function LimitFields({ limits, onAdd }: { limits: RuleField[]; onAdd: (f: RuleField) => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('number');
  const valid = limitName.test(name) && !limits.some(l => l.limit === name);
  return <div className="relation-field"><span className="relation-label">{limitsGroup}<Tooltip content={limitsHelp}><CircleHelp size={14} aria-label="About instance limits" /></Tooltip></span>
    {limits.length ? <small>{limits.map(l => `${l.label} · ${l.type}`).join(', ')}</small> : null}
    <div className="rule-limit">
      <input className="cp-admin-input" aria-label="Instance limit name" placeholder="max_amount" value={name} maxLength={64} onChange={e => setName(e.target.value.trim())} aria-invalid={!!name && !limitName.test(name)} />
      <SelectMenu label="Instance limit type" value={type} onChange={setType} options={[{ value: 'number', label: 'number' }, { value: 'string', label: 'string' }]} />
      <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" disabled={!valid} onClick={() => { onAdd(limitField(name, type)); setName(''); }}><Plus size={14} aria-hidden="true" />Add instance limit</button>
    </div>
    {name && !limitName.test(name) ? <small>Use lowercase letters, digits and _, starting with a letter.</small> : null}
  </div>;
}

// Admin 048 prototype copy of ConditionEditor: initialField opens the rule already built on one
// argument (the "Use a rule" call to action of an argument that can not be matched exactly).
// The builder writes the CEL. Raw CEL is an advanced, one-way escape hatch.
export function ConditionEditor({ serverId, tool, initialField, onSave, onCancel }: { serverId: string; tool: string; initialField?: string; onSave: (c: Condition) => void; onCancel: () => void }) {
  const { catalog } = useCatalog();
  const base = useMemo(() => ruleFields(catalog, serverId, tool), [catalog, serverId, tool]);
  const [limits, setLimits] = useState<RuleField[]>([]);
  const fields = useMemo(() => [...base, ...limits], [base, limits]);
  const first = base.find(f => f.key === initialField) ?? base[0];
  const [rule, setRule] = useState<Rule>({ join: 'all', clauses: first ? [{ id: 'q-1', field: first.key, op: first.type === 'number' ? 'le' : first.type === 'bool' ? 'false' : 'eq', value: '' }] : [] });
  const [name, setName] = useState('');
  const [raw, setRaw] = useState<string>();
  const sentence = ruleSentence(rule, fields), cel = raw ?? ruleCel(rule, fields);
  const ready = name.trim() !== '' && (raw !== undefined ? raw.trim() !== '' : ruleComplete(rule, fields));
  const bindings = ruleBindings(rule, fields), required = ruleLimits(rule, fields);
  return <div className="condition-editor">
    <label className="relation-field"><span>Name <span className="proto-required" aria-hidden="true">*</span></span><input className="cp-admin-input" required aria-required="true" value={name} onChange={e => setName(e.target.value)} maxLength={80} /></label>
    {raw === undefined ? <>
      {!base.length ? <p className="cp-admin-muted">This tool has no scalar arguments and no trusted attributes. Add trusted attributes in Context sources to write a rule.</p> : null}
      <RuleBuilder fields={fields} rule={rule} onChange={setRule} />
      {sentence ? <p className="rule-sentence proto-rule-sentence"><CircleCheck size={14} aria-hidden="true" />Reads as: <strong>{sentence}</strong></p> : null}
      <button type="button" className="rule-switch" onClick={() => setRaw(ruleCel(rule, fields))}><Code size={13} aria-hidden="true" />Edit as CEL (advanced)</button>
    </> : <>
      <label className="relation-field"><span>CEL expression</span><textarea className="cp-admin-input condition-code" rows={4} spellCheck={false} value={raw} onChange={e => setRaw(e.target.value)} /></label>
      <p className="cp-admin-muted rule-note">The backend checks that the expression returns a boolean. After a CEL edit, the rule can not go back to the builder.</p>
      <button type="button" className="rule-switch" onClick={() => setRaw(undefined)}>Discard CEL edits and use the builder</button>
    </>}
    <div className="condition-actions">
      <button type="button" className="cp-admin-button cp-admin-button--small" disabled={!ready} onClick={() => onSave({ id: crypto.randomUUID(), name: name.trim().slice(0, 80), expression: cel.trim(), bindings, limits: required })}>Add to draft</button>
      <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={onCancel}>Cancel</button>
    </div>
  </div>;
}
