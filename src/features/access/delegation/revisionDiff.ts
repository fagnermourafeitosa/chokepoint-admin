import type { PermissionDocument } from './api';
import { idpName, serverName, subjectName, type Catalog } from './model';

// The changes of a revision against the revision before it (Admin 032 section 4).
export type Section = 'delegator' | 'tool' | 'resource' | 'rule';
export type ChangeKind = 'added' | 'removed' | 'changed';
export type Change = { section: Section; kind: ChangeKind; label: string; detail?: string };

const kinds = (k: string[]) => k.map(v => (v === 'person' ? 'people' : 'services')).join(', ');

// compare lists the items of one section by key: added, removed, and changed when the
// same key has another value.
function compare<T>(section: Section, before: T[], after: T[], key: (v: T) => string, label: (v: T) => string, detail: (v: T) => string | undefined, same: (a: T, b: T) => boolean): Change[] {
  const old = new Map(before.map(v => [key(v), v]));
  const next = new Map(after.map(v => [key(v), v]));
  const result: Change[] = [];
  for (const [k, v] of next) {
    const was = old.get(k);
    if (!was) result.push({ section, kind: 'added', label: label(v), detail: detail(v) });
    else if (!same(was, v)) result.push({ section, kind: 'changed', label: label(v), detail: detail(v) });
  }
  for (const [k, v] of old) if (!next.has(k)) result.push({ section, kind: 'removed', label: label(v), detail: detail(v) });
  return result;
}

// revisionDiff compares the snapshot of a revision with the one before it. A revocation has no
// snapshot, so every item is removed; the first revision has nothing before it, so every item is added.
export function revisionDiff(before: PermissionDocument | undefined, after: PermissionDocument | undefined, catalog: Catalog): Change[] {
  const b = before ?? { scopes: [], delegations: [], capabilities: [], resources: [], conditions: [] };
  const a = after ?? { scopes: [], delegations: [], capabilities: [], resources: [], conditions: [] };
  const expiry = (at: string | null) => (at ? `until ${at.slice(0, 10)}` : undefined);
  return [
    ...compare('delegator', b.scopes, a.scopes, s => s.identity_connection_id, s => idpName(catalog, s.identity_connection_id), s => [kinds(s.kinds), expiry(s.expires_at)].filter(Boolean).join(' · '), (x, y) => kinds(x.kinds) === kinds(y.kinds) && x.expires_at === y.expires_at),
    ...compare('delegator', b.delegations, a.delegations, d => `${d.identity_connection_id}/${d.subject}/${d.kind}`, d => subjectName(catalog, d.identity_connection_id, d.subject), d => `${idpName(catalog, d.identity_connection_id)} · ${d.kind}`, () => true),
    ...compare('tool', b.capabilities, a.capabilities, c => `${c.server_id}/${c.tool}`, c => c.tool, c => [serverName(catalog, c.server_id), expiry(c.expires_at)].filter(Boolean).join(' · '), (x, y) => x.expires_at === y.expires_at),
    ...compare('resource', b.resources, a.resources, r => `${r.server_id}/${r.type}/${r.id}`, r => r.id, r => `${r.type} · ${serverName(catalog, r.server_id)}`, () => true),
    ...compare('rule', b.conditions, a.conditions, c => c.id, c => `${c.name} · ${c.tool}`, c => c.expression, (x, y) => x.name === y.name && x.expression === y.expression && x.server_id === y.server_id && x.tool === y.tool),
  ];
}
