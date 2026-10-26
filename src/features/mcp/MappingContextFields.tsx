import { Plus, Trash2 } from 'lucide-react';
import { object, parseMapping } from './mapping-fields';

// Context editing is declarative. Expressions are compiled/projected only by
// the backend; this component does not run a second, incomplete CEL interpreter.
export function MappingContextFields({ text, entries, disabled, onChange }: { text: string; entries: [string, unknown][]; disabled: boolean; onChange: (text: string) => void }) {
 function update(next: [string, unknown][]) {
  const root = parseMapping(text); const body = object(root.evaluation)!;
  onChange(JSON.stringify({ ...root, evaluation: { ...body, context: Object.fromEntries(next) } }, null, 2));
 }
 const display = (value: unknown) => typeof value === 'string' && value.startsWith('$') ? value : JSON.stringify(value);
 return <section className="mapping-field"><div className="mapping-inline"><label>Context attributes</label><button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={disabled} onClick={() => { let index = 1; while (entries.some(([name]) => name === `attribute_${index}`)) index++; update([...entries, [`attribute_${index}`, '']]); }}><Plus size={14} />Add attribute</button></div>
  {entries.length ? <div className="mapping-context">{entries.map(([name, value], index) => <div key={index} className="mapping-context-row"><input className="cp-admin-input" aria-label={`Attribute ${index + 1} name`} disabled={disabled} value={name} onChange={e => { const key = e.target.value; if (entries.some(([other], i) => i !== index && other === key)) return; update(entries.map((entry, i) => i === index ? [key, entry[1]] : entry)); }} /><input className="cp-admin-input mapping-mono" aria-label={`Value for ${name}`} disabled={disabled} value={display(value)} onChange={e => { let next: unknown = e.target.value; if (!e.target.value.startsWith('$')) { try { next = JSON.parse(e.target.value); } catch { /* Unquoted text is a literal string. */ } } update(entries.map((entry, i) => i === index ? [entry[0], next] : entry)); }} /><button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={disabled} aria-label={`Remove attribute ${name}`} onClick={() => update(entries.filter((_, i) => i !== index))}><Trash2 size={14} /></button></div>)}</div> : <p className="cp-admin-muted">No context attributes. Add only the data the policy needs.</p>}
  <small>Use a literal JSON value or a $-prefixed CEL expression. Optional claims can use .? selection.</small>
 </section>;
}
