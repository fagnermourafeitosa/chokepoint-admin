import { useMemo, useState } from 'react';
import { CircleCheck, Code } from 'lucide-react';
import type { Condition } from './model';
import { useCatalog } from './catalog';
import { RuleBuilder, ruleBindings, ruleCel, ruleComplete, ruleFields, ruleLimits, ruleSentence, type Rule, type RuleField } from './RuleBuilder';

// The rule editor (Admin 048): a required name, conditions on call arguments and trusted
// attributes, and Reads as. Instance limits are not offered in the Admin. initialField opens the
// rule on one argument. The builder writes the CEL; raw CEL is an advanced, one-way escape hatch.
export function ConditionEditor({ serverId, tool, initialField, onSave, onCancel }: { serverId: string; tool: string; initialField?: string; onSave: (c: Condition) => void; onCancel: () => void }) {
  const { catalog } = useCatalog();
  const base = useMemo(() => ruleFields(catalog, serverId, tool), [catalog, serverId, tool]);
  const fields: RuleField[] = base;
  const first = base.find(f => f.key === initialField) ?? base[0];
  const [rule, setRule] = useState<Rule>({ join: 'all', clauses: first ? [{ id: 'q-1', field: first.key, op: first.type === 'number' ? 'le' : first.type === 'bool' ? 'false' : 'eq', value: '' }] : [] });
  const [name, setName] = useState('');
  const [raw, setRaw] = useState<string>();
  const sentence = ruleSentence(rule, fields), cel = raw ?? ruleCel(rule, fields);
  const ready = name.trim() !== '' && (raw !== undefined ? raw.trim() !== '' : ruleComplete(rule, fields));
  const bindings = ruleBindings(rule, fields), required = ruleLimits(rule, fields);
  return <div className="condition-editor">
    <label className="relation-field"><span>Name <span className="required-mark" aria-hidden="true">*</span></span><input className="cp-admin-input" required aria-required="true" value={name} onChange={e => setName(e.target.value)} maxLength={80} /></label>
    {raw === undefined ? <>
      {!base.length ? <p className="cp-admin-muted">This tool has no scalar arguments and no trusted attributes. Add trusted attributes in Context sources to write a rule.</p> : null}
      <RuleBuilder fields={fields} rule={rule} onChange={setRule} />
      {sentence ? <p className="rule-sentence rule-sentence--read"><CircleCheck size={14} aria-hidden="true" />Reads as: <strong>{sentence}</strong></p> : null}
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
