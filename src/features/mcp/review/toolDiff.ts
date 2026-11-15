import type { ToolContract } from '../api';

// The field diff of a changed tool since its approval (Admin 055, implementation decision 2), computed
// from previous and contract. The text that the model reads is a removed and an added row; a parameter
// added or removed and a type or required change are one row; every other difference is one Other
// fields item. Each item counts once in the summary.

export type Param = { name: string; type: string; required: boolean; description?: string };
export type DiffRow = { kind: 'added' | 'removed' | 'changed'; text: string; json?: boolean; detail?: string };
export type DiffItem = { section: string; rows: DiffRow[] };

type Schema = { type?: string; description?: string; properties?: Record<string, Schema>; items?: Schema; required?: string[]; $defs?: Record<string, Schema> };

// The parameters of a tool at every depth of its input schema: nested properties, array items and
// $defs, named by their path (for example order.items.sku).
export function params(contract?: ToolContract): Param[] {
  const out: Param[] = [];
  const walk = (schema: Schema | undefined, prefix: string) => {
    if (!schema || typeof schema !== 'object') return;
    for (const [name, child] of Object.entries(schema.properties ?? {})) {
      const path = prefix ? `${prefix}.${name}` : name;
      out.push({ name: path, type: child?.type ?? 'any', required: schema.required?.includes(name) ?? false, description: child?.description });
      walk(child, path);
      if (child?.items) walk(child.items, `${path}[]`);
    }
    for (const [name, def] of Object.entries(schema.$defs ?? {})) walk(def, prefix ? `${prefix}.$defs.${name}` : `$defs.${name}`);
  };
  walk(contract?.inputSchema as Schema | undefined, '');
  return out;
}

const textRows = (was?: string, now?: string): DiffRow[] => [{ kind: 'removed', text: was || 'No description.' }, { kind: 'added', text: now || 'No description.' }];

// JSON with sorted keys at every level: the stored contract (PostgreSQL jsonb) and the discovered one
// can list the same keys in another order, and the backend compares them by value.
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, (v as Record<string, unknown>)[k]])) : v));
}

// Everything of a contract except the fields that have their own rows.
function rest(c: ToolContract): string {
  const { name: _n, title: _t, description: _d, inputSchema: _i, ...others } = c;
  return canonical(others);
}

// The input schema without the descriptions, types and required lists that have their own rows.
function schemaShape(schema: unknown): string {
  return canonical(JSON.parse(JSON.stringify(schema ?? null, (key, value) => (key === 'description' || key === 'type' || key === 'required' ? undefined : value))));
}

export function changesOf(was: ToolContract, now: ToolContract): DiffItem[] {
  const items: DiffItem[] = [];
  if (was.title !== now.title) items.push({ section: 'Title', rows: textRows(was.title, now.title) });
  if (was.description !== now.description) items.push({ section: 'Description', rows: textRows(was.description, now.description) });
  const before = new Map(params(was).map(p => [p.name, p])), after = new Map(params(now).map(p => [p.name, p]));
  for (const p of after.values()) {
    const old = before.get(p.name);
    if (!old) { items.push({ section: `Parameter ${p.name}`, rows: [{ kind: 'added', text: `Parameter added · ${p.type}${p.required ? ' · required' : ''}`, detail: p.description }] }); continue; }
    if (old.type !== p.type) items.push({ section: `Parameter ${p.name}`, rows: [{ kind: 'changed', text: `Type ${old.type} → ${p.type}` }] });
    if (old.required !== p.required) items.push({ section: `Parameter ${p.name}`, rows: [{ kind: 'changed', text: p.required ? 'Now required' : 'No longer required' }] });
    if (old.description !== p.description) items.push({ section: `Parameter ${p.name}`, rows: textRows(old.description, p.description) });
  }
  for (const p of before.values()) if (!after.has(p.name)) items.push({ section: `Parameter ${p.name}`, rows: [{ kind: 'removed', text: 'Parameter removed' }] });
  const otherWas = rest(was), otherNow = rest(now);
  const shapeWas = schemaShape(was.inputSchema), shapeNow = schemaShape(now.inputSchema);
  if (otherWas !== otherNow || shapeWas !== shapeNow) {
    const show = (other: string, shape: string) => (otherWas !== otherNow ? other : '') + (shapeWas !== shapeNow ? `${otherWas !== otherNow ? ' ' : ''}inputSchema ${shape}` : '');
    items.push({ section: 'Other fields', rows: [{ kind: 'removed', text: show(otherWas, shapeWas), json: true }, { kind: 'added', text: show(otherNow, shapeNow), json: true }] });
  }
  return items;
}
