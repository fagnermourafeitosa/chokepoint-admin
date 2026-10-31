import { Plus, Trash2 } from 'lucide-react';
import { toolBindings, toolCatalog } from './fixtures';

// A field the rule can read: a call argument or a trusted attribute. Only the CEL leaves the Admin.
export type RuleField = { key: string; label: string; group: string; type: string; cel: string; binding?: string };
export type Clause = { id: string; field: string; op: string; value: string; valueField?: string };
export type Rule = { join: 'all' | 'any'; clauses: Clause[] };

const ops: Record<string, { id: string; label: string; cel: string; noValue?: boolean }[]> = {
  string: [{ id: 'eq', label: 'is', cel: '==' }, { id: 'ne', label: 'is not', cel: '!=' }, { id: 'in', label: 'is one of', cel: 'in' }, { id: 'starts', label: 'starts with', cel: 'startsWith' }],
  number: [{ id: 'le', label: 'is at most', cel: '<=' }, { id: 'lt', label: 'is less than', cel: '<' }, { id: 'ge', label: 'is at least', cel: '>=' }, { id: 'gt', label: 'is more than', cel: '>' }, { id: 'eq', label: 'is', cel: '==' }],
  bool: [{ id: 'true', label: 'is true', cel: '', noValue: true }, { id: 'false', label: 'is false', cel: '!', noValue: true }],
};

export function ruleFields(tool: string): RuleField[] {
  const args = Object.entries(toolCatalog.find(t => t.tool === tool)?.args ?? {}).map(([name, type]): RuleField => ({ key: `arg:${name}`, label: name, group: 'Call arguments', type, cel: `context.chokepoint.arguments["${name}"]` }));
  const attrs = (toolBindings[tool] ?? []).flatMap(s => s.attributes.map((a): RuleField => ({ key: `${s.id}:${a.name}`, label: `${s.entity}.${a.name}`, group: s.source, type: a.type, cel: `${s.entity}.properties.chokepoint["${s.id}"].values["${a.name}"]`, binding: s.id })));
  return [...args, ...attrs];
}

const literal = (type: string, v: string) => (type === 'number' ? (v.trim() || '0') : JSON.stringify(v));

function clauseCel(c: Clause, fields: RuleField[]) {
  const f = fields.find(x => x.key === c.field); if (!f) return '';
  const op = (ops[f.type] ?? ops.string).find(o => o.id === c.op)!;
  if (op.noValue) return `${op.cel}${f.cel}`;
  const right = c.valueField ? fields.find(x => x.key === c.valueField)?.cel ?? '' : '';
  if (op.id === 'in') return `${f.cel} in [${c.value.split(',').map(v => literal(f.type, v.trim())).join(', ')}]`;
  if (op.id === 'starts') return `${f.cel}.startsWith(${right || literal(f.type, c.value)})`;
  return `${f.cel} ${op.cel} ${right || literal(f.type, c.value)}`;
}

export function ruleCel(rule: Rule, fields: RuleField[]) {
  const parts = rule.clauses.map(c => clauseCel(c, fields)).filter(Boolean);
  return parts.length > 1 ? parts.map(p => `(${p})`).join(rule.join === 'all' ? ' && ' : ' || ') : parts[0] ?? '';
}

export function ruleSentence(rule: Rule, fields: RuleField[]) {
  return rule.clauses.map(c => {
    const f = fields.find(x => x.key === c.field); if (!f) return '';
    const op = (ops[f.type] ?? ops.string).find(o => o.id === c.op)!;
    return `${f.label} ${op.label}${op.noValue ? '' : ` ${c.valueField ? fields.find(x => x.key === c.valueField)?.label : c.value || '…'}`}`;
  }).filter(Boolean).join(rule.join === 'all' ? ' and ' : ' or ');
}

export const ruleBindings = (rule: Rule, fields: RuleField[]) => [...new Set(rule.clauses.flatMap(c => [c.field, c.valueField]).map(k => fields.find(f => f.key === k)?.binding).filter((b): b is string => !!b))];
export const ruleComplete = (rule: Rule, fields: RuleField[]) => rule.clauses.length > 0 && rule.clauses.every(c => { const f = fields.find(x => x.key === c.field); const op = f && (ops[f.type] ?? ops.string).find(o => o.id === c.op); return !!op && (op.noValue || !!c.valueField || c.value.trim() !== ''); });

function FieldSelect({ fields, value, onChange, label, only }: { fields: RuleField[]; value: string; onChange: (v: string) => void; label: string; only?: string }) {
  const list = only ? fields.filter(f => f.type === only) : fields;
  const groups = [...new Set(list.map(f => f.group))];
  return <select className="cp-admin-input" aria-label={label} value={value} onChange={e => onChange(e.target.value)}>{groups.map(g => <optgroup key={g} label={g}>{list.filter(f => f.group === g).map(f => <option key={f.key} value={f.key}>{f.label} · {f.type}</option>)}</optgroup>)}</select>;
}

export function RuleBuilder({ fields, rule, onChange }: { fields: RuleField[]; rule: Rule; onChange: (r: Rule) => void }) {
  const set = (id: string, patch: Partial<Clause>) => onChange({ ...rule, clauses: rule.clauses.map(c => (c.id === id ? { ...c, ...patch } : c)) });
  const add = () => { const f = fields[0]; onChange({ ...rule, clauses: [...rule.clauses, { id: `q-${Date.now()}`, field: f.key, op: (ops[f.type] ?? ops.string)[0].id, value: '' }] }); };
  return <div className="rule-builder">
    <div className="rule-join">Allow the call when <select className="cp-admin-input" aria-label="Match" value={rule.join} onChange={e => onChange({ ...rule, join: e.target.value as Rule['join'] })}><option value="all">all</option><option value="any">any</option></select> of these are true:</div>
    {rule.clauses.map(c => {
      const f = fields.find(x => x.key === c.field)!; const list = ops[f.type] ?? ops.string; const op = list.find(o => o.id === c.op) ?? list[0];
      return <div key={c.id} className="rule-clause">
        <FieldSelect fields={fields} label="Field" value={c.field} onChange={v => { const nf = fields.find(x => x.key === v)!; set(c.id, { field: v, op: (ops[nf.type] ?? ops.string)[0].id, value: '', valueField: undefined }); }} />
        <select className="cp-admin-input" aria-label="Operator" value={op.id} onChange={e => set(c.id, { op: e.target.value })}>{list.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
        {op.noValue ? <span /> : <div className="rule-value">
          {c.valueField !== undefined ? <FieldSelect fields={fields.filter(x => x.key !== c.field)} only={f.type} label="Compare with field" value={c.valueField} onChange={v => set(c.id, { valueField: v })} />
            : <input className="cp-admin-input" aria-label="Value" type={f.type === 'number' ? 'number' : 'text'} value={c.value} placeholder={op.id === 'in' ? 'RJ, SP' : 'value'} onChange={e => set(c.id, { value: e.target.value })} />}
          {op.id !== 'in' && fields.some(x => x.key !== c.field && x.type === f.type) ? <button type="button" className="rule-switch" onClick={() => set(c.id, { valueField: c.valueField !== undefined ? undefined : fields.find(x => x.key !== c.field && x.type === f.type)!.key })}>{c.valueField !== undefined ? 'Use a value' : 'Compare with a field'}</button> : null}
        </div>}
        <button type="button" className="relation-icon-button" aria-label="Remove this check" onClick={() => onChange({ ...rule, clauses: rule.clauses.filter(x => x.id !== c.id) })}><Trash2 size={14} /></button>
      </div>;
    })}
    <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small rule-add" onClick={add} disabled={!fields.length}><Plus size={14} aria-hidden="true" />Add a check</button>
  </div>;
}
