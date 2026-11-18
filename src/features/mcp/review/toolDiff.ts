import type { ToolContract } from '../api';

// The field diff of a changed tool since its approval (Admin 055, implementation decision 2), computed
// from previous and contract. The text that the model reads is a removed and an added row; a parameter
// added or removed and a type or required change are one row. Every other difference is listed by its
// JSON path with its previous and current value (Backend 104 Implementation Decision 2), so a changed
// contract never has an empty diff. Each item counts once in the summary.

// at is the path of the parameter schema in the contract, as keys.
export type Param = { name: string; type: string; required: boolean; description?: string; at: string[] };
export type DiffRow = { kind: 'added' | 'removed' | 'changed'; text: string; json?: boolean; detail?: string };
export type DiffItem = { section: string; rows: DiffRow[] };

type Schema = { type?: string; description?: string; properties?: Record<string, Schema>; items?: Schema; required?: string[]; $defs?: Record<string, Schema> };

// The parameters of a tool at every depth of its input schema: nested properties, array items and
// $defs, named by their path (for example order.items.sku).
export function params(contract?: ToolContract): Param[] {
  const out: Param[] = [];
  const walk = (schema: Schema | undefined, prefix: string, at: string[]) => {
    if (!schema || typeof schema !== 'object') return;
    for (const [name, child] of Object.entries(schema.properties ?? {})) {
      const path = prefix ? `${prefix}.${name}` : name;
      const childAt = [...at, 'properties', name];
      out.push({ name: path, type: child?.type ?? 'any', required: schema.required?.includes(name) ?? false, description: child?.description, at: childAt });
      walk(child, path, childAt);
      if (child?.items) walk(child.items, `${path}[]`, [...childAt, 'items']);
    }
    for (const [name, def] of Object.entries(schema.$defs ?? {})) walk(def, prefix ? `${prefix}.$defs.${name}` : `$defs.${name}`, [...at, '$defs', name]);
  };
  walk(contract?.inputSchema as Schema | undefined, '', ['inputSchema']);
  return out;
}

const textRows = (was?: string, now?: string): DiffRow[] => [{ kind: 'removed', text: was || 'No description.' }, { kind: 'added', text: now || 'No description.' }];

// JSON with sorted keys at every level: the stored contract (PostgreSQL jsonb) and the discovered one
// can list the same keys in another order, and the backend compares them by value.
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, (v as Record<string, unknown>)[k]])) : v));
}

type Json = unknown;
const isObject = (v: Json): v is Record<string, Json> => !!v && typeof v === 'object' && !Array.isArray(v);

function valueAt(value: Json, at: string[]): Json {
  return at.reduce<Json>((v, key) => (isObject(v) ? v[key] : undefined), value);
}

// setAt writes value at a path of a copy made by structuredClone, creating the missing objects on the
// way; undefined removes the key.
function setAt(root: Json, at: string[], value: Json) {
  let parent = root;
  for (const key of at.slice(0, -1)) {
    if (!isObject(parent)) return;
    if (!isObject(parent[key])) {
      if (value === undefined) return;
      parent[key] = {};
    }
    parent = parent[key];
  }
  if (!isObject(parent)) return;
  const key = at[at.length - 1];
  if (value === undefined) delete parent[key];
  else parent[key] = structuredClone(value);
}

type Leaf = { at: string[]; was: Json; now: Json };

// The smallest differing values of two JSON values, with their paths. Arrays of another length differ
// as a whole.
function leaves(was: Json, now: Json, at: string[], out: Leaf[]): Leaf[] {
  if (canonical(was) === canonical(now)) return out;
  if (isObject(was) && isObject(now)) {
    for (const key of new Set([...Object.keys(was), ...Object.keys(now)])) leaves(was[key], now[key], [...at, key], out);
  } else if (Array.isArray(was) && Array.isArray(now) && was.length === now.length) {
    was.forEach((item, i) => leaves(item, now[i], [...at, String(i)], out));
  } else out.push({ at, was, now });
  return out;
}

// A JSON path for people: keys joined by dots, array positions in brackets.
const pathOf = (at: string[]) => at.reduce((path, key) => (/^\d+$/.test(key) ? `${path}[${key}]` : path ? `${path}.${key}` : key), '');

const shown = (v: Json) => (v === undefined ? 'Not set' : canonical(v));

export function changesOf(was: ToolContract, now: ToolContract): DiffItem[] {
  const items: DiffItem[] = [];
  // shownWas is the previous contract with the changes of the readable rows applied: what still differs
  // from the current contract has no row yet and is listed by its path.
  const shownWas = structuredClone(was) as Json;
  const apply = (at: string[]) => setAt(shownWas, at, valueAt(now, at));
  if (was.title !== now.title) { items.push({ section: 'Title', rows: textRows(was.title, now.title) }); apply(['title']); }
  if (was.description !== now.description) { items.push({ section: 'Description', rows: textRows(was.description, now.description) }); apply(['description']); }
  const before = new Map(params(was).map(p => [p.name, p])), after = new Map(params(now).map(p => [p.name, p]));
  // A required row moves only its own name in the required list of its parent schema.
  const applyRequired = (p: Param, required: boolean) => {
    const listAt = [...p.at.slice(0, -2), 'required'], name = p.at[p.at.length - 1];
    const list = valueAt(shownWas, listAt), target = valueAt(now, listAt);
    const names = Array.isArray(list) ? list.filter(n => n !== name) : [];
    const moved = required ? [...names, name] : names;
    // When the names are now those of the current list, its order is taken too: the row says it all.
    const same = Array.isArray(target) && target.length === moved.length && moved.every(n => target.includes(n));
    setAt(shownWas, listAt, same ? target : moved.length || Array.isArray(target) ? moved : undefined);
  };
  for (const p of after.values()) {
    const old = before.get(p.name);
    if (!old) { items.push({ section: `Parameter ${p.name}`, rows: [{ kind: 'added', text: `Parameter added · ${p.type}${p.required ? ' · required' : ''}`, detail: p.description }] }); apply(p.at); if (p.required) applyRequired(p, true); continue; }
    if (old.type !== p.type) { items.push({ section: `Parameter ${p.name}`, rows: [{ kind: 'changed', text: `Type ${old.type} → ${p.type}` }] }); apply([...p.at, 'type']); }
    if (old.required !== p.required) { items.push({ section: `Parameter ${p.name}`, rows: [{ kind: 'changed', text: p.required ? 'Now required' : 'No longer required' }] }); applyRequired(p, p.required); }
    if (old.description !== p.description) { items.push({ section: `Parameter ${p.name}`, rows: textRows(old.description, p.description) }); apply([...p.at, 'description']); }
  }
  for (const p of before.values()) if (!after.has(p.name)) { items.push({ section: `Parameter ${p.name}`, rows: [{ kind: 'removed', text: 'Parameter removed' }] }); apply(p.at); if (p.required) applyRequired(p, false); }
  for (const leaf of leaves(shownWas, now, [], [])) {
    const original = valueAt(was, leaf.at);
    items.push({ section: pathOf(leaf.at), rows: [{ kind: 'removed', text: shown(original), json: true }, { kind: 'added', text: shown(leaf.now), json: true }] });
  }
  return items;
}
