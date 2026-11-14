// Admin 048: RuleBuilder: each line of a rule is a condition.
import { useState, type ReactNode } from 'react';
import { CircleHelp, Plus, Trash2, X } from 'lucide-react';
import { Tooltip } from '../../../components/ui/tooltip/Tooltip';
import { findTool, type Catalog, type CatalogBinding } from './model';
import { SelectMenu } from '../../../components/ui/dropdown/SelectMenu';
import { celLimit, limitCel, limitComplete, limitHelp, limitSentence, type Usage } from './usage';

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
  // An argument or attribute is dynamic in CEL and the backend accepts only a boolean expression,
  // so "is true" compares with true; "is false" negates, which CEL types as a boolean.
  bool: [{ id: 'true', label: 'is true', cel: ' == true', noValue: true }, { id: 'false', label: 'is false', cel: '!', noValue: true }],
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
  if (op.noValue) return op.id === 'true' ? `${f.cel}${op.cel}` : `${op.cel}${f.cel}`;
  const right = c.valueField ? fields.find(x => x.key === c.valueField)?.cel ?? '' : '';
  if (op.id === 'in') return `${f.cel} in [${c.value.split(',').map(v => literal(f.type, v.trim())).join(', ')}]`;
  if (op.id === 'starts') return `${f.cel}.startsWith(${right || literal(f.type, c.value)})`;
  return `${f.cel} ${op.cel} ${right || literal(f.type, c.value)}`;
}

// limits: the limit lines of the rule (Admin 054); they join the conditions with the same all/any.
export function ruleCel(rule: Rule, fields: RuleField[], limits: Usage[] = []) {
  const parts = [...rule.clauses.map(c => clauseCel(c, fields)), ...limits.map(limitCel)].filter(Boolean);
  return parts.length > 1 ? parts.map(p => `(${p})`).join(rule.join === 'all' ? ' && ' : ' || ') : parts[0] ?? '';
}

export function ruleSentence(rule: Rule, fields: RuleField[], limits: Usage[] = [], tool = '') {
  return [...rule.clauses.map(c => {
    const f = fields.find(x => x.key === c.field); if (!f) return '';
    const op = (ops[f.type] ?? ops.string).find(o => o.id === c.op)!;
    const value = c.valueField ? fields.find(x => x.key === c.valueField)?.label : op.id === 'in' ? `[${listValues(c.value).join(', ') || '…'}]` : c.value || '…';
    return `${f.label} ${op.label}${op.noValue ? '' : ` ${value}`}`;
  }), ...limits.map(u => limitSentence(u, tool))].filter(Boolean).join(rule.join === 'all' ? ' AND ' : ' OR ');
}

// Admin 049: the inverse of ruleCel. It reads only the CEL that the builder writes (clauseCel, ruleCel)
// and returns its clauses, or nothing for any other shape: the screen then shows the CEL. All or
// nothing: one clause that can not be read leaves the whole rule as CEL.
const argCel = /^context\.chokepoint\.arguments\["([^"\\]+)"\]$/;
const attrCel = /^(subject|resource)\.properties\.chokepoint\["([^"\\]+)"\]\.values\["([^"\\]+)"\]$/;
const stringLiteral = /^"(?:[^"\\]|\\.)*"$/;
const numberLiteral = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
const compareOps: { cel: string; ids: Record<string, string> }[] = [
  { cel: '<=', ids: { number: 'le' } }, { cel: '>=', ids: { number: 'ge' } }, { cel: '==', ids: { number: 'eq', string: 'eq' } },
  { cel: '!=', ids: { string: 'ne' } }, { cel: '<', ids: { number: 'lt' } }, { cel: '>', ids: { number: 'gt' } },
];

// Splits text on a separator outside strings, parentheses and brackets.
function splitTop(text: string, sep: string): string[] | undefined {
  const parts: string[] = []; let depth = 0, quoted = false, start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) { if (ch === '\\') i++; else if (ch === '"') quoted = false; continue; }
    if (ch === '"') quoted = true;
    else if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') { if (--depth < 0) return undefined; }
    else if (depth === 0 && text.startsWith(sep, i)) { parts.push(text.slice(start, i)); start = i + sep.length; i += sep.length - 1; }
  }
  if (quoted || depth) return undefined;
  parts.push(text.slice(start));
  return parts;
}

// A call argument takes its type from the clause; a trusted attribute takes it from its binding.
function celField(text: string, bindings: CatalogBinding[], key: string, type?: string): RuleField | undefined {
  const arg = argCel.exec(text);
  if (arg) return type ? { key, label: arg[1], group: 'Call arguments', type, cel: text } : undefined;
  const attr = attrCel.exec(text);
  const binding = attr && bindings.find(b => b.id === attr[2] && b.entity === attr[1]);
  const a = binding?.attributes.find(x => x.name === attr![3]);
  return binding && a && (!type || a.type === type) ? { key, label: `${binding.entity}.${a.name}`, group: binding.source, type: a.type, cel: text, binding: binding.id } : undefined;
}

const attributeType = (text: string, bindings: CatalogBinding[]) => celField(text, bindings, '')?.type;

function celClause(text: string, i: number, bindings: CatalogBinding[]): { clause: Clause; fields: RuleField[] } | undefined {
  const key = `c${i}`, id = `q-${i}`;
  const isTrue = /^(.+) == true$/.exec(text);
  const trueField = isTrue && celField(isTrue[1], bindings, key, 'bool');
  if (trueField) return { clause: { id, field: key, op: 'true', value: '' }, fields: [trueField] };
  const bool = /^(!?)(.+)$/.exec(text)!;
  const boolField = celField(bool[2], bindings, key, 'bool');
  if (boolField) return { clause: { id, field: key, op: bool[1] ? 'false' : 'true', value: '' }, fields: [boolField] };
  const list = /^(.+?) in \[(.*)\]$/.exec(text);
  if (list) {
    const values = splitTop(list[2], ', ');
    if (!values?.length || !values.every(v => stringLiteral.test(v))) return undefined;
    const decoded = values.map(v => JSON.parse(v) as string);
    const f = celField(list[1], bindings, key, 'string');
    return f && decoded.every(v => v && !v.includes(',')) ? { clause: { id, field: key, op: 'in', value: decoded.join(', ') }, fields: [f] } : undefined;
  }
  const starts = /^(.+)\.startsWith\((.+)\)$/.exec(text);
  const [left, right, cel] = starts ? [starts[1], starts[2], 'startsWith'] : (() => {
    for (const o of compareOps) { const parts = splitTop(text, ` ${o.cel} `); if (parts?.length === 2) return [parts[0], parts[1], o.cel]; }
    return [];
  })();
  if (!left || !right || !cel) return undefined;
  const literal = stringLiteral.test(right) ? 'string' : numberLiteral.test(right) ? 'number' : undefined;
  const type = attributeType(left, bindings) ?? literal ?? attributeType(right, bindings) ?? (['<', '<=', '>', '>='].includes(cel) ? 'number' : undefined);
  const opId = cel === 'startsWith' ? (type === 'string' ? 'starts' : undefined) : compareOps.find(o => o.cel === cel)?.ids[type ?? ''];
  const f = type && celField(left, bindings, key, type);
  if (!f || !opId) return undefined;
  if (literal) return literal === type ? { clause: { id, field: key, op: opId, value: literal === 'string' ? JSON.parse(right) as string : right }, fields: [f] } : undefined;
  const other = celField(right, bindings, `${key}v`, type);
  return other ? { clause: { id, field: key, op: opId, value: '', valueField: other.key }, fields: [f, other] } : undefined;
}

// usage: the usage definitions of the saved rule; a clause that reads one is a limit line (Admin 054).
export function celRule(expression: string, bindings: CatalogBinding[], usage: Usage[] = []): { rule: Rule; fields: RuleField[]; limits: Usage[] } | undefined {
  const text = expression.trim();
  let join: Rule['join'] = 'all', parts = [text];
  for (const [j, sep] of [['all', ' && '], ['any', ' || ']] as const) {
    const split = splitTop(text, sep);
    if (!split) return undefined;
    if (split.length > 1) {
      if (!split.every(p => p.startsWith('(') && p.endsWith(')'))) return undefined;
      join = j; parts = split.map(p => p.slice(1, -1)); break;
    }
  }
  const limits: Usage[] = [], clauses: ({ clause: Clause; fields: RuleField[] } | undefined)[] = [];
  parts.forEach((p, i) => { const limit = celLimit(p, usage); if (limit) limits.push(limit); else clauses.push(celClause(p, i, bindings)); });
  if (!clauses.every(Boolean)) return undefined;
  return { rule: { join, clauses: clauses.map(c => c!.clause) }, fields: clauses.flatMap(c => c!.fields), limits };
}

// The sentence of a saved rule, or undefined when its CEL can not be read (Admin 049 item 14).
export function celSentence(expression: string, bindings: CatalogBinding[], usage: Usage[] = [], tool = '') {
  const parsed = celRule(expression, bindings, usage);
  return parsed ? ruleSentence(parsed.rule, parsed.fields, parsed.limits, tool) || undefined : undefined;
}

export const ruleBindings = (rule: Rule, fields: RuleField[]) => [...new Set(rule.clauses.flatMap(c => [c.field, c.valueField]).map(k => fields.find(f => f.key === k)?.binding).filter((b): b is string => !!b))];
export const ruleLimits = (rule: Rule, fields: RuleField[]) => [...new Set(rule.clauses.flatMap(c => [c.field, c.valueField]).map(k => fields.find(f => f.key === k)?.limit).filter((l): l is string => !!l))];
export const ruleComplete = (rule: Rule, fields: RuleField[], limits: Usage[] = []) => rule.clauses.length + limits.length > 0 && limits.every(limitComplete) && rule.clauses.every(c => { const f = fields.find(x => x.key === c.field); const op = f && (ops[f.type] ?? ops.string).find(o => o.id === c.op); return !!op && (op.noValue || !!c.valueField || c.value.trim() !== ''); });

// is one of: the values of the list, kept as one comma-separated string in the clause.
const listValues = (v: string) => v.split(',').map(x => x.trim()).filter(Boolean);

// Admin 048: the list of "is one of" looks like an array: [ 1001 × , 1002 × ] and an input to add more.
function ListValue({ value, type, onChange }: { value: string; type: string; onChange: (v: string) => void }) {
  const [text, setText] = useState('');
  const items = listValues(value);
  const add = (raw: string) => { const next = [...new Set([...items, ...listValues(raw.replace(/\n/g, ','))])]; onChange(next.join(', ')); setText(''); };
  return <div className="rule-list-value" role="group" aria-label="List of values">
    <span className="rule-list-bracket" aria-hidden="true">[</span>
    {items.map((v, i) => <span key={v} className="rule-list-item"><code>{v}</code><button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(items.filter(x => x !== v).join(', '))}><X size={12} /></button>{i < items.length - 1 ? <span aria-hidden="true">,</span> : null}</span>)}
    <input className="rule-list-input" aria-label="Add a value" type={type === 'number' ? 'number' : 'text'} value={text} placeholder={items.length ? 'add' : 'value'}
      onChange={e => setText(e.target.value)} onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && text.trim()) { e.preventDefault(); add(text); } if (e.key === 'Backspace' && !text && items.length) onChange(items.slice(0, -1).join(', ')); }}
      onBlur={() => { if (text.trim()) add(text); }} onPaste={e => { const t = e.clipboardData.getData('text'); if (/[,\n]/.test(t)) { e.preventDefault(); add(t); } }} />
    <span className="rule-list-bracket" aria-hidden="true">]</span>
  </div>;
}

function FieldSelect({ fields, value, onChange, label, only }: { fields: RuleField[]; value: string; onChange: (v: string) => void; label: string; only?: string }) {
  const list = only ? fields.filter(f => f.type === only) : fields;
  const groups = [...new Set(list.map(f => f.group))];
  return <SelectMenu block label={label} value={value} onChange={onChange} options={groups.flatMap(g => list.filter(f => f.group === g).map(f => ({ value: f.key, label: `${f.label} · ${f.type} — ${g}` })))} />;
}

// limitLines and onAddLimit add the limit lines of Admin 054 after the conditions, with Add a limit
// next to Add a condition and its help.
export function RuleBuilder({ fields, rule, onChange, limitLines, onAddLimit }: { fields: RuleField[]; rule: Rule; onChange: (r: Rule) => void; limitLines?: ReactNode; onAddLimit?: () => void }) {
  const set = (id: string, patch: Partial<Clause>) => onChange({ ...rule, clauses: rule.clauses.map(c => (c.id === id ? { ...c, ...patch } : c)) });
  const add = () => { const f = fields[0]; onChange({ ...rule, clauses: [...rule.clauses, { id: `q-${Date.now()}`, field: f.key, op: (ops[f.type] ?? ops.string)[0].id, value: '' }] }); };
  return <div className="rule-builder">
    <div className="rule-join">Allow the call when <SelectMenu label="Match" value={rule.join} onChange={v => onChange({ ...rule, join: v as Rule['join'] })} options={[{ value: 'all', label: 'all' }, { value: 'any', label: 'any' }]} /> of these are true:</div>
    {rule.clauses.map(c => {
      const f = fields.find(x => x.key === c.field)!; const list = ops[f.type] ?? ops.string; const op = list.find(o => o.id === c.op) ?? list[0];
      // Admin 048: compare only with a trusted attribute, never with another call argument (instance limits are not in the Admin for now).
      const others = fields.filter(x => x.key !== c.field && x.binding);
      return <div key={c.id} className="rule-clause">
        <FieldSelect fields={fields} label="Field" value={c.field} onChange={v => { const nf = fields.find(x => x.key === v)!; set(c.id, { field: v, op: (ops[nf.type] ?? ops.string)[0].id, value: '', valueField: undefined }); }} />
        <SelectMenu block label="Operator" value={op.id} onChange={v => set(c.id, { op: v })} options={list.map(o => ({ value: o.id, label: o.label }))} />
        {op.noValue ? <span /> : <div className="rule-value">
          {c.valueField !== undefined ? <FieldSelect fields={others} only={f.type} label="Compare with a trusted attribute" value={c.valueField} onChange={v => set(c.id, { valueField: v })} />
            : op.id === 'in' ? <ListValue value={c.value} type={f.type} onChange={v => set(c.id, { value: v })} />
            : <input className="cp-admin-input" aria-label="Value" type={f.type === 'number' ? 'number' : 'text'} value={c.value} placeholder="value" onChange={e => set(c.id, { value: e.target.value })} />}
          {op.id !== 'in' && others.some(x => x.type === f.type) ? <button type="button" className="rule-switch" onClick={() => set(c.id, { valueField: c.valueField !== undefined ? undefined : others.find(x => x.type === f.type)!.key })}>{c.valueField !== undefined ? 'Use a value' : 'Compare with a trusted attribute'}</button> : null}
        </div>}
        <button type="button" className="relation-icon-button" aria-label="Remove this condition" onClick={() => onChange({ ...rule, clauses: rule.clauses.filter(x => x.id !== c.id) })}><Trash2 size={14} /></button>
      </div>;
    })}
    {limitLines}
    <div className="limit-add">
      <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small rule-add" onClick={add} disabled={!fields.length}><Plus size={14} aria-hidden="true" />Add a condition</button>
      {onAddLimit ? <><button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={onAddLimit}><Plus size={14} aria-hidden="true" />Add a limit</button>
        <Tooltip content={limitHelp}><CircleHelp size={14} aria-label="About limits" /></Tooltip></> : null}
    </div>
  </div>;
}
