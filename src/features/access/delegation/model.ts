import type { ConditionRecord, PermissionDocument, SubjectKind } from './api';

export type { SubjectKind };
// The editor's view of the agent document. `issuer` is the identity connection ID; names come from the catalog.
export type Consent = { recordedBy: string; recordedAt: string; name?: string };
// confirmed: the administrator confirmed the consent in this draft; the backend records who and when.
// Harness login of a scope (Backend 045): the eligible groups and the consent validity in days.
export type ConsentGroup = { id: string; name: string; path?: string };
export type PersonConsent = { groups: ConsentGroup[]; defaultDays: number; maxDays: number };
export type IdpScope = { issuer: string; kinds: SubjectKind[]; expiresAt?: string; consent?: Consent; confirmed?: boolean; personConsent?: PersonConsent };
export type Blocked = { issuer: string; subject: string; reason?: string };
export type Delegation = { id: string; issuer: string; subject: string; kind: SubjectKind };
export type Condition = { id: string; name: string; expression: string; bindings: string[]; limits: string[] };
export type Mapping = { pointer: string; kind: string };
export type Capability = { id: string; serverId: string; tool: string; expiresAt?: string; mapping?: Mapping; conditions: Condition[] };
// A resource belongs to a server and a resource type (Backend 029). It is an allow list: no rules.
export type Resource = { id: string; serverId: string; kind: string; value: string };
export type Doc = { scopes: IdpScope[]; delegations: Delegation[]; capabilities: Capability[]; resources: Resource[]; blocked: Blocked[] };

// What the editor reads besides the document: servers, reviewed tools, bindings, identity providers and directories.
export type CatalogServer = { id: string; name: string; type: 'custom' | 'enterprise' };
export type CatalogTool = { serverId: string; tool: string; args: Record<string, string>; mapping?: Mapping };
export type CatalogBinding = { id: string; source: string; entity: 'subject' | 'resource'; attributes: { name: string; type: string }[] };
// groups: the provider reads directory groups, which harness login needs (Backend 045).
export type CatalogIdp = { id: string; name: string; enabled: boolean; provider: string; groups: boolean; harnessLogin: boolean };
export type Subject = { subject: string; name: string; kind: SubjectKind };
export type Directory = { subjects: Subject[]; truncated: boolean };
export type Catalog = {
  servers: CatalogServer[];
  tools: CatalogTool[];
  bindings: (serverId: string, tool: string) => CatalogBinding[];
  idps: CatalogIdp[];
  // undefined while the directory of the identity provider loads.
  directory: (issuer: string) => Directory | undefined;
};

export const capabilityId = (serverId: string, tool: string) => `${serverId}/${tool}`;
export const delegationId = (issuer: string, subject: string) => `${issuer}/${subject}`;
export const resourceId = (serverId: string, kind: string, value: string) => `${serverId}/${kind}/${value}`;
export const serverName = (catalog: Catalog, id: string) => catalog.servers.find(s => s.id === id)?.name ?? id;
export const idpName = (catalog: Catalog, id: string) => catalog.idps.find(i => i.id === id)?.name ?? id;
export const findTool = (catalog: Catalog, serverId: string, tool: string) => catalog.tools.find(t => t.serverId === serverId && t.tool === tool);
export const subjectName = (catalog: Catalog, issuer: string, subject: string) => catalog.directory(issuer)?.subjects.find(x => x.subject === subject)?.name ?? subject;
// Directory subjects of one identity provider and kinds.
export const idpSubjects = (catalog: Catalog, issuer: string, kinds: SubjectKind[]) => (catalog.directory(issuer)?.subjects ?? []).filter(x => kinds.includes(x.kind));

// A date from the Admin is the end of that day in UTC (Backend 033 Admin contract 1).
const toDate = (value: string | null | undefined) => (value ? value.slice(0, 10) : undefined);
const toTime = (date: string | undefined) => (date ? `${date}T23:59:59Z` : null);

export function fromDocument(d: PermissionDocument, catalog: Catalog): Doc {
  return {
    scopes: d.scopes.map(s => ({ issuer: s.identity_connection_id, kinds: s.kinds, expiresAt: toDate(s.expires_at), consent: s.consent?.recorded_by ? { recordedBy: s.consent.recorded_by, recordedAt: s.consent.recorded_at ?? '', name: s.consent.recorded_by_name } : undefined,
      personConsent: s.person_consent ? { groups: s.person_consent.groups, defaultDays: s.person_consent.default_validity_days, maxDays: s.person_consent.max_validity_days } : undefined })),
    blocked: (d.blocked ?? []).map(b => ({ issuer: b.identity_connection_id, subject: b.subject, reason: b.reason })),
    delegations: d.delegations.map(x => ({ id: delegationId(x.identity_connection_id, x.subject), issuer: x.identity_connection_id, subject: x.subject, kind: x.kind })),
    capabilities: d.capabilities.map(c => ({
      id: capabilityId(c.server_id, c.tool), serverId: c.server_id, tool: c.tool, expiresAt: toDate(c.expires_at), mapping: findTool(catalog, c.server_id, c.tool)?.mapping,
      conditions: d.conditions.filter(k => k.server_id === c.server_id && k.tool === c.tool).map(k => ({ id: k.id, name: k.name, expression: k.expression, bindings: k.required_bindings, limits: k.required_limits })),
    })),
    resources: d.resources.map(r => ({ id: resourceId(r.server_id, r.type, r.id), serverId: r.server_id, kind: r.type, value: r.id })),
  };
}

export function toDocument(doc: Doc): PermissionDocument {
  return {
    scopes: doc.scopes.map(s => ({ identity_connection_id: s.issuer, kinds: s.kinds, expires_at: toTime(s.expiresAt), consent: s.consent ? { source: 'administrator', recorded_by: s.consent.recordedBy, recorded_at: s.consent.recordedAt } : s.confirmed ? { source: 'administrator' } : null,
      // Person consent needs People in the scope (Backend 045 Administration API 3).
      person_consent: s.personConsent && s.kinds.includes('person') ? { groups: s.personConsent.groups, default_validity_days: s.personConsent.defaultDays, max_validity_days: s.personConsent.maxDays } : null })),
    // A delegation is valid only for a kind of its scope (Backend 033 Admin contract 1). A blocked subject is never delegated (Backend 045).
    delegations: doc.delegations.filter(x => doc.scopes.some(s => s.issuer === x.issuer && s.kinds.includes(x.kind)) && !isBlocked(doc, x.issuer, x.subject)).map(x => ({ identity_connection_id: x.issuer, subject: x.subject, kind: x.kind })),
    capabilities: doc.capabilities.map(c => ({ server_id: c.serverId, tool: c.tool, expires_at: toTime(c.expiresAt) })),
    resources: doc.resources.map(r => ({ server_id: r.serverId, type: r.kind, id: r.value })),
    conditions: doc.capabilities.flatMap(c => c.conditions.map((k): ConditionRecord => ({ id: k.id, name: k.name, server_id: c.serverId, tool: c.tool, expression: k.expression, required_bindings: k.bindings, required_limits: k.limits }))),
    blocked: doc.blocked.map(b => ({ identity_connection_id: b.issuer, subject: b.subject, ...(b.reason ? { reason: b.reason } : {}) })),
  };
}

export const isBlocked = (doc: Doc, issuer: string, subject: string) => doc.blocked.some(b => b.issuer === issuer && b.subject === subject);
// A scope with harness login on and no group can not be published (Backend 045 Resolved Decision 24).
export const harnessWithoutGroups = (doc: Doc) => doc.scopes.some(s => s.kinds.includes('person') && s.personConsent && s.personConsent.groups.length === 0);

// Unpublished changes: the items of each collection that differ from the published document.
export function countChanges(next: PermissionDocument, published: PermissionDocument) {
  // An absent person_consent equals null: documents published before Backend 045 do not have it.
  const key = (v: unknown) => JSON.stringify(v, (k, x) => (k === 'recorded_by_name' || (k === 'person_consent' && x == null) ? undefined : x));
  const diff = <T,>(a: T[], b: T[]) => { const left = new Set(a.map(key)), right = new Set(b.map(key)); return [...left].filter(x => !right.has(x)).length + [...right].filter(x => !left.has(x)).length; };
  return diff(next.scopes, published.scopes) + diff(next.delegations, published.delegations) + diff(next.capabilities, published.capabilities) + diff(next.resources, published.resources) + diff(next.conditions, published.conditions) + diff(next.blocked ?? [], published.blocked ?? []);
}

// A recorded time, shown in UTC like the rest of the Admin.
export const formatTime = (value: string) => (value ? `${value.slice(0, 16).replace('T', ' ')} UTC` : '');

// Removing a tool also removes the resources that no other granted tool of its server reads:
// the backend publishes a resource only for a type that a granted tool projects (Backend 033).
export function withoutCapability(doc: Doc, id: string): { doc: Doc; orphans: Resource[] } {
  const capabilities = doc.capabilities.filter(c => c.id !== id);
  const used = new Set(capabilities.flatMap(c => (c.mapping ? [`${c.serverId}|${c.mapping.kind}`] : [])));
  const orphans = doc.resources.filter(r => !used.has(`${r.serverId}|${r.kind}`));
  return { doc: { ...doc, capabilities, resources: doc.resources.filter(r => !orphans.includes(r)) }, orphans };
}
