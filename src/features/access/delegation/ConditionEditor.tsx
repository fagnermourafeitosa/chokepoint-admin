import { useMemo, useState } from 'react';
import { CircleCheck, Code } from 'lucide-react';
import type { Condition } from './fixtures';
import { RuleBuilder, ruleBindings, ruleCel, ruleComplete, ruleFields, ruleSentence, type Rule } from './RuleBuilder';
import { WaitingBackend } from './WaitingBackend';

// The builder writes the CEL. Raw CEL is an advanced, one-way escape hatch.
export function ConditionEditor({ tool, onSave, onCancel }: { tool: string; onSave: (c: Condition) => void; onCancel: () => void }) {
  const fields = useMemo(() => ruleFields(tool), [tool]);
  const first = fields[0];
  const [rule, setRule] = useState<Rule>({ join: 'all', clauses: first ? [{ id: 'q-1', field: first.key, op: first.type === 'number' ? 'le' : first.type === 'bool' ? 'false' : 'eq', value: '' }] : [] });
  const [name, setName] = useState('');
  const [raw, setRaw] = useState<string>();
  const sentence = ruleSentence(rule, fields), cel = raw ?? ruleCel(rule, fields);
  const ready = raw !== undefined ? raw.trim() !== '' : ruleComplete(rule, fields);
  if (!fields.length) return <div className="condition-editor"><p className="cp-admin-muted">This tool has no arguments and no approved bindings, so there is nothing a rule can check. Add a binding under Context sources.</p><button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={onCancel}>Close</button></div>;
  return <div className="condition-editor">
    <div className="relation-field-head"><strong>Rule on call data</strong><WaitingBackend spec="033" /></div>
    {raw === undefined ? <>
      <RuleBuilder fields={fields} rule={rule} onChange={setRule} />
      {sentence ? <p className="rule-sentence"><CircleCheck size={14} aria-hidden="true" />Reads as: <strong>{sentence}</strong></p> : null}
      <details className="rule-cel"><summary>Generated CEL</summary><code>{cel || '—'}</code></details>
      <button type="button" className="rule-switch" onClick={() => setRaw(ruleCel(rule, fields))}><Code size={13} aria-hidden="true" />Edit as CEL (advanced)</button>
    </> : <>
      <label className="relation-field"><span>CEL expression</span><textarea className="cp-admin-input condition-code" rows={4} spellCheck={false} value={raw} onChange={e => setRaw(e.target.value)} /></label>
      <p className="cp-admin-muted rule-note">The backend checks that the expression returns a boolean. After a CEL edit, the rule can not go back to the builder.</p>
      <button type="button" className="rule-switch" onClick={() => setRaw(undefined)}>Discard CEL edits and use the builder</button>
    </>}
    <label className="relation-field"><span>Name</span><input className="cp-admin-input" value={name} onChange={e => setName(e.target.value)} placeholder={sentence || 'Short name for this rule'} maxLength={80} /></label>
    <div className="relation-field"><span>Required bindings</span><small>{ruleBindings(rule, fields).join(', ') || 'None. The rule reads only call arguments.'}</small></div>
    <div className="condition-actions">
      <button type="button" className="cp-admin-button cp-admin-button--small" disabled={!ready} onClick={() => onSave({ id: `k-${Date.now()}`, name: name.trim() || sentence || 'Custom rule', expression: cel.trim(), bindings: ruleBindings(rule, fields) })}>Add to draft</button>
      <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={onCancel}>Cancel</button>
    </div>
  </div>;
}
