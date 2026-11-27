import type { ConditionRecord, DelegationRecord, PermissionDocument, ScopeRecord, SubjectKind } from './api';
import { capabilityId, idpName, recordKey, serverName, subjectName, type Catalog } from './model';
import { celSentence } from './RuleBuilder';
import { usageFromRecord } from './usage';

// The changes of one permission document against the one before it (Admin 032 section 4, Admin 064):
// the draft against the published revision, or a revision against the revision before it.
export type Section = 'delegator' | 'tool' | 'resource' | 'rule';
export type ChangeKind = 'added' | 'removed' | 'changed';
// item: what changed, with the names and values that the loss-of-access lines need (Admin 064).
export type ChangeItem =
  | { type: 'scope'; issuer: string; name: string; kindsBefore: SubjectKind[]; kindsAfter: SubjectKind[]; expiresBefore?: string; expiresAfter?: string }
  | { type: 'delegation'; issuer: string; subject: string; name: string }
  | { type: 'blocked'; issuer: string; subject: string; name: string }
  | { type: 'capability'; id: string; server: string; tool: string; expiresBefore?: string; expiresAfter?: string }
  | { type: 'resource'; serverId: string; server: string; kind: string; value: string }
  | { type: 'rule'; capability: string; tool: string; name: string; before?: string; after?: string };
// children: the changes that this change causes, such as the people of a removed identity provider.
// They show under it and are not counted again. before and after: a changed rule, as sentences.
export type Change = { section: Section; kind: ChangeKind; label: string; detail?: string; before?: string; after?: string; children?: Change[]; item: ChangeItem };
export type Diff = { changes: Change[]; providersAfter: number };

const empty: PermissionDocument = { scopes: [], delegations: [], capabilities: [], resources: [], conditions: [], blocked: [] };
const kindsText = (k: SubjectKind[]) => k.map(v => (v === 'person' ? 'people' : 'services')).join(', ');
const day = (at: string | null | undefined) => (at ? at.slice(0, 10) : undefined);
const until = (at: string | null | undefined) => (at ? `until ${day(at)}` : undefined);

// compare pairs the records of one collection by identity: added, removed, and changed when the
// same identity has another value (the comparison key of the model).
function compare<T>(before: T[], after: T[], id: (v: T) => string) {
  const old = new Map(before.map(v => [id(v), v])), next = new Map(after.map(v => [id(v), v]));
  const out: { kind: ChangeKind; was?: T; now?: T }[] = [];
  for (const [k, v] of next) { const was = old.get(k); if (!was) out.push({ kind: 'added', now: v }); else if (recordKey(was) !== recordKey(v)) out.push({ kind: 'changed', was, now: v }); }
  for (const [k, v] of old) if (!next.has(k)) out.push({ kind: 'removed', was: v });
  return out;
}

// What changed in an identity provider that stays: its kinds, its expiry, the consent or its harness login.
function scopeChange(was: ScopeRecord, now: ScopeRecord) {
  const parts: string[] = [];
  // A provider left with no kind reads as none, not as an empty side of the arrow.
  if (kindsText(was.kinds) !== kindsText(now.kinds)) parts.push(`${kindsText(was.kinds) || 'none'} → ${kindsText(now.kinds) || 'none'}`);
  if (day(was.expires_at) !== day(now.expires_at)) parts.push(now.expires_at ? `until ${day(now.expires_at)}` : 'no expiry');
  if (recordKey(was.consent) !== recordKey(now.consent)) parts.push('consent');
  if (recordKey(was.person_consent ?? null) !== recordKey(now.person_consent ?? null)) parts.push('harness login');
  return parts.join(' · ') || kindsText(now.kinds);
}

function sentence(c: ConditionRecord, catalog: Catalog) {
  return celSentence(c.expression, catalog.bindings(c.server_id, c.tool), (c.usage ?? []).map(usageFromRecord), c.tool) ?? c.expression;
}

// revisionDiff compares two documents. A revocation has no document, so every item is removed; the
// first revision has nothing before it, so every item is added. The delegations of an identity provider
// sit under its change: under the added or removed provider, or under a changed provider whose people changed.
export function revisionDiff(before: PermissionDocument | undefined, after: PermissionDocument | undefined, catalog: Catalog): Diff {
  const b = before ?? empty, a = after ?? empty;
  const count = (d: PermissionDocument, issuer: string) => d.delegations.filter(x => x.identity_connection_id === issuer).length;
  const people = compare<DelegationRecord>(b.delegations, a.delegations, d => `${d.identity_connection_id}/${d.subject}/${d.kind}`).map(c => {
    const d = (c.now ?? c.was)!;
    return { issuer: d.identity_connection_id, change: { section: 'delegator' as const, kind: c.kind, label: subjectName(catalog, d.identity_connection_id, d.subject), detail: d.kind, item: { type: 'delegation' as const, issuer: d.identity_connection_id, subject: d.subject, name: subjectName(catalog, d.identity_connection_id, d.subject) } } };
  });
  const scopeItem = (was: ScopeRecord | undefined, now: ScopeRecord | undefined): ChangeItem => {
    const s = (now ?? was)!;
    return { type: 'scope', issuer: s.identity_connection_id, name: idpName(catalog, s.identity_connection_id), kindsBefore: was?.kinds ?? [], kindsAfter: now?.kinds ?? [], expiresBefore: day(was?.expires_at), expiresAfter: day(now?.expires_at) };
  };
  const scopes: Change[] = compare<ScopeRecord>(b.scopes, a.scopes, s => s.identity_connection_id).map(c => {
    const s = (c.now ?? c.was)!, issuer = s.identity_connection_id;
    const detail = c.kind === 'changed' ? scopeChange(c.was!, c.now!) : [kindsText(s.kinds), until(s.expires_at)].filter(Boolean).join(' · ');
    return { section: 'delegator', kind: c.kind, label: idpName(catalog, issuer), detail, item: scopeItem(c.was, c.now) };
  });
  // People that changed under a provider that did not: the provider reads as changed, with the counts.
  for (const issuer of new Set(people.map(p => p.issuer))) {
    if (scopes.some(s => s.item.type === 'scope' && s.item.issuer === issuer)) continue;
    const scope = a.scopes.find(s => s.identity_connection_id === issuer) ?? b.scopes.find(s => s.identity_connection_id === issuer);
    if (!scope) continue;
    scopes.push({ section: 'delegator', kind: 'changed', label: idpName(catalog, issuer), detail: `${count(b, issuer)} → ${count(a, issuer)} ${kindsText(scope.kinds)}`, item: scopeItem(scope, scope) });
  }
  for (const s of scopes) if (s.item.type === 'scope') { const issuer = s.item.issuer; const under = people.filter(p => p.issuer === issuer).map(p => p.change); if (under.length) s.children = under; }
  const blocked: Change[] = compare(b.blocked ?? [], a.blocked ?? [], x => `${x.identity_connection_id}/${x.subject}`).filter(c => c.kind !== 'changed').map(c => {
    const x = (c.now ?? c.was)!, name = subjectName(catalog, x.identity_connection_id, x.subject);
    return { section: 'delegator', kind: c.kind, label: name, detail: `blocked · ${idpName(catalog, x.identity_connection_id)}`, item: { type: 'blocked', issuer: x.identity_connection_id, subject: x.subject, name } };
  });
  const tools: Change[] = compare(b.capabilities, a.capabilities, c => capabilityId(c.server_id, c.tool)).map(c => {
    const x = (c.now ?? c.was)!, server = serverName(catalog, x.server_id);
    return { section: 'tool', kind: c.kind, label: x.tool, detail: [server, until(x.expires_at)].filter(Boolean).join(' · '), item: { type: 'capability', id: capabilityId(x.server_id, x.tool), server, tool: x.tool, expiresBefore: day(c.was?.expires_at), expiresAfter: day(c.now?.expires_at) } };
  });
  const resources: Change[] = compare(b.resources, a.resources, r => `${r.server_id}/${r.type}/${r.id}`).map(c => {
    const r = (c.now ?? c.was)!, server = serverName(catalog, r.server_id);
    return { section: 'resource', kind: c.kind, label: r.id, detail: `${r.type} · ${server}`, item: { type: 'resource', serverId: r.server_id, server, kind: r.type, value: r.id } };
  });
  const rules: Change[] = compare(b.conditions, a.conditions, c => c.id).map(c => {
    const r = (c.now ?? c.was)!, was = c.was && sentence(c.was, catalog), now = c.now && sentence(c.now, catalog);
    const values = c.kind === 'changed' ? (was !== now ? { before: was, after: now } : {}) : c.kind === 'added' ? { after: now } : { before: was };
    return { section: 'rule', kind: c.kind, label: r.name, detail: r.tool, ...values, item: { type: 'rule', capability: capabilityId(r.server_id, r.tool), tool: r.tool, name: r.name, ...values } };
  });
  return { changes: [...scopes, ...blocked, ...tools, ...resources, ...rules], providersAfter: a.scopes.length };
}

// The kind of each changed relation of the Graph and List views: an identity provider or a tool.
// A changed rule marks its tool as changed when the tool itself did not change.
export function relationMarks(changes: Change[]) {
  const marks = new Map<string, ChangeKind>();
  for (const c of changes) {
    if (c.item.type === 'scope') marks.set(`idp:${c.item.issuer}`, c.kind);
    if (c.item.type === 'capability') marks.set(`tool:${c.item.id}`, c.kind);
  }
  for (const c of changes) if (c.item.type === 'rule' && !marks.has(`tool:${c.item.capability}`)) marks.set(`tool:${c.item.capability}`, 'changed');
  return marks;
}
