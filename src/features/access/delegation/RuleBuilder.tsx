import { Plus, Trash2 } from 'lucide-react';
import { findTool, type Catalog } from './model';
import { SelectMenu } from '../../../components/ui/dropdown/SelectMenu';

// A field the rule can read: a call argument or a trusted attribute. Only the CEL leaves the Admin.
export type RuleField = { key: string; label: string; group: string; type: string; cel: string; binding?: string; limit?: string };
export const limitsGroup = 'Instance limits';
// An instance limit is not known when the rule is written: the administrator types its name (Backend 030 Resolved Decision 6).
export const limitName = /^[a-z][a-z0-9_]{0,63}$/;
export const limitField = (name: string, type: string): RuleField => ({ key: `limit:${name}`, label: `limits.${name}`, group: limitsGroup, type, cel: `context.chokepoint.limits["${name}"]`, limit: name });
export type Clause = { id: string; field: string; op: string; value: string; valueField?: string };
export type Rule = { join: 'all' | 'any'; clauses: Clause[] };

const ops: Record<string, { id: string; label: string; cel: string; noValue?: boolean }[]> = {
  string: [{ id: 'eq', label: 'is', cel: '==' }, { id: 'ne', label: 'is not', cel: '!=' }, { id: 'in', label: 'is one of', cel: 'in' }, { id: 'starts', label: 'starts with', cel: 'startsWith' }],
  number: [{ id: 'le', label: 'is at most', cel: '<=' }, { id: 'lt', label: 'is less than', cel: '<' }, { id: 'ge', label: 'is at least', cel: '>=' }, { id: 'gt', label: 'is more than', cel: '>' }, { id: 'eq', label: 'is', cel: '==' }],
  bool: [{ id: 'true', label: 'is true', cel: '', noValue: true }, { id: 'false', label: 'is false', cel: '!', noValue: true }],
};

export function ruleFields(catalog: Catalog, serverId: string, tool: string): RuleField[] {
  const args = Object.entries(findTool(catalog, serverId, tool)?.args ?? {}).map(([name, type]): RuleField => ({ key: `arg:${name}`, label: name, group: 'Call arguments', type, cel: `context.chokepoint.arguments["${name}"]` }));
  const attrs = catalog.bindings(serverId, tool).flatMap(s => s.attributes.map((a): RuleField => ({ key: `${s.id}:${a.name}`, label: `${s.entity}.${a.name}`, group: s.source, type: a.type, cel: `${s.entity}.properties.chokepoint["${s.id}"].values["${a.name}"]`, binding: s.id })));
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
export const ruleLimits = (rule: Rule, fields: RuleField[]) => [...new Set(rule.clauses.flatMap(c => [c.field, c.valueField]).map(k => fields.find(f => f.key === k)?.limit).filter((l): l is string => !!l))];
export const ruleComplete = (rule: Rule, fields: RuleField[]) => rule.clauses.length > 0 && rule.clauses.every(c => { const f = fields.find(x => x.key === c.field); const op = f && (ops[f.type] ?? ops.string).find(o => o.id === c.op); return !!op && (op.noValue || !!c.valueField || c.value.trim() !== ''); });

function FieldSelect({ fields, value, onChange, label, only }: { fields: RuleField[]; value: string; onChange: (v: string) => void; label: string; only?: string }) {
  const list = only ? fields.filter(f => f.type === only) : fields;
  const groups = [...new Set(list.map(f => f.group))];
  return <SelectMenu block label={label} value={value} onChange={onChange} options={groups.flatMap(g => list.filter(f => f.group === g).map(f => ({ value: f.key, label: `${f.label} · ${f.type} — ${g}` })))} />;
}

export function RuleBuilder({ fields, rule, onChange }: { fields: RuleField[]; rule: Rule; onChange: (r: Rule) => void }) {
  const set = (id: string, patch: Partial<Clause>) => onChange({ ...rule, clauses: rule.clauses.map(c => (c.id === id ? { ...c, ...patch } : c)) });
  const add = () => { const f = fields[0]; onChange({ ...rule, clauses: [...rule.clauses, { id: `q-${Date.now()}`, field: f.key, op: (ops[f.type] ?? ops.string)[0].id, value: '' }] }); };
  return <div className="rule-builder">
    <div className="rule-join">Allow the call when <SelectMenu label="Match" value={rule.join} onChange={v => onChange({ ...rule, join: v as Rule['join'] })} options={[{ value: 'all', label: 'all' }, { value: 'any', label: 'any' }]} /> of these are true:</div>
    {rule.clauses.map(c => {
      const f = fields.find(x => x.key === c.field)!; const list = ops[f.type] ?? ops.string; const op = list.find(o => o.id === c.op) ?? list[0];
      return <div key={c.id} className="rule-clause">
        <FieldSelect fields={fields} label="Field" value={c.field} onChange={v => { const nf = fields.find(x => x.key === v)!; set(c.id, { field: v, op: (ops[nf.type] ?? ops.string)[0].id, value: '', valueField: undefined }); }} />
        <SelectMenu block label="Operator" value={op.id} onChange={v => set(c.id, { op: v })} options={list.map(o => ({ value: o.id, label: o.label }))} />
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
