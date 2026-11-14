import { useMemo, useState } from 'react';
import { CircleCheck, Code, Info } from 'lucide-react';
import { findTool, type Condition } from './model';
import { useCatalog } from './catalog';
import { RuleBuilder, ruleBindings, ruleCel, ruleComplete, ruleFields, ruleLimits, ruleSentence, type Rule, type RuleField } from './RuleBuilder';
import { LimitClause, type Param } from './LimitClause';
import { howLimitsCount, limitComplete, type Usage } from './usage';

// The rule editor (Admin 048): a required name, conditions on call arguments and trusted
// attributes, limit lines that read earlier calls of the agent (Admin 054), and Reads as.
// Instance limits are not offered in the Admin. initialField opens the rule on one argument.
// The builder writes the CEL; raw CEL is an advanced, one-way escape hatch.
export function ConditionEditor({ serverId, tool, initialField, onSave, onCancel }: { serverId: string; tool: string; initialField?: string; onSave: (c: Condition) => void; onCancel: () => void }) {
  const { catalog } = useCatalog();
  const base = useMemo(() => ruleFields(catalog, serverId, tool), [catalog, serverId, tool]);
  const fields: RuleField[] = base;
  // The parameters of this tool and of the other tools of the server, with their schema types.
  const params = useMemo<Param[]>(() => Object.entries(findTool(catalog, serverId, tool)?.schema ?? {}).map(([name, type]) => ({ name, type })), [catalog, serverId, tool]);
  const tools = useMemo<Record<string, Param[]>>(() => Object.fromEntries(catalog.tools.filter(t => t.serverId === serverId && t.tool !== tool).map(t => [t.tool, Object.entries(t.schema).map(([name, type]) => ({ name, type }))])), [catalog, serverId, tool]);
  const first = base.find(f => f.key === initialField) ?? base[0];
  const [rule, setRule] = useState<Rule>({ join: 'all', clauses: first ? [{ id: 'q-1', field: first.key, op: first.type === 'number' ? 'le' : first.type === 'bool' ? 'false' : 'eq', value: '' }] : [] });
  const [limits, setLimits] = useState<Usage[]>([]);
  const [name, setName] = useState('');
  const [raw, setRaw] = useState<string>();
  const sentence = ruleSentence(rule, fields, limits, tool), cel = raw ?? ruleCel(rule, fields, limits);
  // The limit lines are sent with a CEL edit too, so they must be complete in both modes.
  const ready = name.trim() !== '' && (raw !== undefined ? raw.trim() !== '' && limits.every(limitComplete) : ruleComplete(rule, fields, limits));
  const bindings = ruleBindings(rule, fields), required = ruleLimits(rule, fields);
  // Each new limit line gets a new identity: a saved change starts its totals from zero (Backend 087 Implementation Decision 13).
  const addLimit = () => setLimits([...limits, { id: crypto.randomUUID(), operator: 'count_calls', windowValue: 1, windowUnit: 'hours', compare: 'le', limit: '' }]);
  const limitLines = limits.map(u => <LimitClause key={u.id} usage={u} tool={tool} params={params} tools={tools} onChange={next => setLimits(limits.map(x => (x.id === u.id ? next : x)))} onRemove={() => setLimits(limits.filter(x => x.id !== u.id))} />);
  return <div className="condition-editor">
    <label className="relation-field"><span>Name <span className="required-mark" aria-hidden="true">*</span></span><input className="cp-admin-input" required aria-required="true" value={name} onChange={e => setName(e.target.value)} maxLength={80} /></label>
    {raw === undefined ? <>
      {!base.length ? <p className="cp-admin-muted">This tool has no scalar arguments and no trusted attributes. Add trusted attributes in Context sources to write a rule.</p> : null}
      <RuleBuilder fields={fields} rule={rule} onChange={setRule} limitLines={limitLines} onAddLimit={addLimit} />
      {limits.length ? <details className="limit-notes"><summary><Info size={14} aria-hidden="true" />How limits count</summary><ul>{howLimitsCount.map(t => <li key={t}>{t}</li>)}</ul></details> : null}
      {sentence ? <p className="rule-sentence rule-sentence--read"><CircleCheck size={14} aria-hidden="true" />Reads as: <strong>{sentence}</strong></p> : null}
      <button type="button" className="rule-switch" onClick={() => setRaw(ruleCel(rule, fields, limits))}><Code size={13} aria-hidden="true" />Edit as CEL (advanced)</button>
    </> : <>
      <label className="relation-field"><span>CEL expression</span><textarea className="cp-admin-input condition-code" rows={4} spellCheck={false} value={raw} onChange={e => setRaw(e.target.value)} /></label>
      <p className="cp-admin-muted rule-note">The backend checks that the expression returns a boolean. After a CEL edit, the rule can not go back to the builder.</p>
      <button type="button" className="rule-switch" onClick={() => setRaw(undefined)}>Discard CEL edits and use the builder</button>
    </>}
    <div className="condition-actions">
      <button type="button" className="cp-admin-button cp-admin-button--small" disabled={!ready} onClick={() => onSave({ id: crypto.randomUUID(), name: name.trim().slice(0, 80), expression: cel.trim(), bindings, limits: required, usage: limits })}>Add to draft</button>
      <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={onCancel}>Cancel</button>
    </div>
  </div>;
}
