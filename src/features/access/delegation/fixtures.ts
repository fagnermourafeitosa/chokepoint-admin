// Layout prototype only. Fixed data based on the Backend 033 development seed; no API reads or writes.
export type SubjectKind = 'person' | 'service';
export type Consent = { source: 'administrator' | 'idp'; recordedBy: string; recordedAt: string };
export type Delegation = { id: string; issuer: string; subject: string; name: string; kind: SubjectKind; expiresAt?: string; consent: Consent };
export type Condition = { id: string; name: string; expression: string; bindings: string[] };
export type Capability = { id: string; serverId: string; tool: string; expiresAt?: string; mapping?: { pointer: string; kind: string }; conditions: Condition[] };
// A resource belongs to a server and a kind (Backend 029), not to one tool. It is an allow list: no rules.
export type Resource = { id: string; serverId: string; kind: string; value: string };
export type Server = { id: string; name: string; type: 'custom' | 'enterprise' };
// Who can delegate is set for each identity provider: everyone (with exceptions) or only selected subjects.
export type IdpScope = { issuer: string; mode: 'everyone' | 'selected'; kinds: SubjectKind[]; except: string[]; expiresAt?: string; consent: Consent };
export type Doc = { scopes: IdpScope[]; delegations: Delegation[]; capabilities: Capability[]; resources: Resource[] };

export const servers: Server[] = [{ id: 'catalog', name: 'Catalog', type: 'custom' }, { id: 'github', name: 'GitHub', type: 'enterprise' }];
export const currentAdmin = 'Development Admin A';

// Reviewed tools of the server, with their input arguments and resource mapping.
export const toolCatalog = [
  { serverId: 'catalog', tool: 'current_time', args: { timezone: 'string' } },
  { serverId: 'catalog', tool: 'list_test_items', args: { limit: 'number', status: 'string' } },
  { serverId: 'catalog', tool: 'get_test_item', args: { id: 'string' }, mapping: { pointer: '/id', kind: 'test_item' } },
  { serverId: 'catalog', tool: 'echo', args: { message: 'string' } },
  ...['get_file_contents', 'list_issues', 'create_issue', 'list_pull_requests', 'create_pull_request', 'merge_pull_request', 'list_commits', 'search_code', 'create_branch', 'add_issue_comment', 'get_pull_request', 'list_branches', 'move_issue', 'close_pull_request'].map(tool => ({ serverId: 'github', tool, args: { repository: 'string', limit: 'number' }, mapping: { pointer: '/repository', kind: 'github_repository' } })),
] as const;

// Approved source bindings for each tool (trusted attributes from the PIP).
export const toolBindings: Record<string, { id: string; source: string; entity: 'subject' | 'resource'; attributes: { name: string; type: string }[] }[]> = {
  list_test_items: [{ id: 'subject-profile', source: 'Attribute API / subject profile', entity: 'subject', attributes: [{ name: 'state', type: 'string' }, { name: 'blocked', type: 'bool' }] }],
  move_issue: [{ id: 'issue-details', source: 'GitHub API / issue', entity: 'resource', attributes: [{ name: 'status', type: 'string' }, { name: 'labels_count', type: 'number' }] }],
  close_pull_request: [{ id: 'pr-reviews', source: 'GitHub API / pull request reviews', entity: 'resource', attributes: [{ name: 'approvals', type: 'number' }, { name: 'changes_requested', type: 'bool' }] }],
  merge_pull_request: [{ id: 'pr-reviews', source: 'GitHub API / pull request reviews', entity: 'resource', attributes: [{ name: 'approvals', type: 'number' }, { name: 'changes_requested', type: 'bool' }] }],
  get_test_item: [
    { id: 'subject-profile', source: 'Attribute API / subject profile', entity: 'subject', attributes: [{ name: 'state', type: 'string' }, { name: 'blocked', type: 'bool' }] },
    { id: 'item-details', source: 'Attribute API / item details', entity: 'resource', attributes: [{ name: 'owner_state', type: 'string' }, { name: 'archived', type: 'bool' }] },
  ],
};

// Subjects listed from each identity provider directory.
export const baseDirectory = [
  { issuer: 'Keycloak customer', people: [{ subject: 'alice', name: 'Alice Martins' }, { subject: 'bruno', name: 'Bruno Costa' }, { subject: 'camila', name: 'Camila Rocha' }, { subject: 'diego', name: 'Diego Alves' }], services: [{ subject: 'chokepoint-test-service', name: 'chokepoint-test-service' }, { subject: 'billing-worker', name: 'billing-worker' }] },
  { issuer: 'Google Workspace', people: [{ subject: '1029384756', name: 'Erica Lima' }], services: [{ subject: '1188776655', name: 'reports-bot@acme.iam' }] },
];

const consent = (at: string): Consent => ({ source: 'administrator', recordedBy: currentAdmin, recordedAt: `2026-10-31 ${at} UTC` });
const profile = (name: string) => `subject.properties.chokepoint["subject-profile"].values["${name}"]`;

export const initialDoc: Doc = {
  scopes: [{ issuer: 'Keycloak customer', mode: 'selected', kinds: ['person', 'service'], except: [], consent: consent('09:10') }],
  delegations: [
    { id: 'd-alice', issuer: 'Keycloak customer', subject: 'alice', name: 'Alice Martins', kind: 'person', expiresAt: '2026-11-30', consent: consent('09:12') },
    { id: 'd-bruno', issuer: 'Keycloak customer', subject: 'bruno', name: 'Bruno Costa', kind: 'person', consent: consent('09:14') },
    { id: 'd-svc', issuer: 'Keycloak customer', subject: 'chokepoint-test-service', name: 'chokepoint-test-service', kind: 'service', consent: consent('09:20') },
  ],
  capabilities: [
    { id: 'c-current_time', serverId: 'catalog', tool: 'current_time', conditions: [] },
    { id: 'c-list_test_items', serverId: 'catalog', tool: 'list_test_items', conditions: [{ id: 'k-rj', name: 'Only RJ, not blocked', expression: `${profile('state')} == "RJ" && !${profile('blocked')}`, bindings: ['subject-profile'] }] },
    { id: 'c-get_test_item', serverId: 'catalog', tool: 'get_test_item', expiresAt: '2026-12-31', mapping: { pointer: '/id', kind: 'test_item' }, conditions: [] },
  ],
  resources: [
    { id: 'r-1', serverId: 'catalog', kind: 'test_item', value: '1' },
    { id: 'r-2', serverId: 'catalog', kind: 'test_item', value: '2' },
  ],
};

// Large sample to check how the screen scales: 100 subjects, 17 tools, 160 resources.
const first = ['Ana', 'Bruno', 'Carla', 'Davi', 'Elisa', 'Felipe', 'Gabi', 'Hugo', 'Iara', 'João'], last = ['Silva', 'Souza', 'Lima', 'Costa', 'Rocha', 'Alves', 'Melo', 'Dias', 'Nunes'];
const largeSubjects: Delegation[] = Array.from({ length: 100 }, (_, i) => {
    const service = i % 10 === 9, issuer = i % 4 === 3 ? 'Google Workspace' : 'Keycloak customer';
    const name = service ? `worker-${i}` : `${first[i % first.length]} ${last[i % last.length]} ${i}`;
    return { id: `d-l${i}`, issuer, subject: service ? `svc-${i}` : `user-${i}`, name, kind: service ? 'service' as const : 'person' as const, expiresAt: i % 3 === 0 ? '2026-12-31' : undefined, consent: consent(`10:${String(i % 60).padStart(2, '0')}`) };
  });
export const largeDoc: Doc = {
  scopes: [
    { issuer: 'Keycloak customer', mode: 'everyone', kinds: ['person', 'service'], except: ['user-5', 'user-12'], expiresAt: '2027-03-31', consent: consent('10:00') },
    { issuer: 'Google Workspace', mode: 'selected', kinds: ['person'], except: [], consent: consent('10:05') },
  ],
  delegations: largeSubjects.filter(d => d.issuer === 'Google Workspace'),
  capabilities: [
    ...initialDoc.capabilities,
    ...toolCatalog.filter(t => t.serverId === 'github').map(t => ({ id: `c-${t.tool}`, serverId: 'github', tool: t.tool, mapping: { pointer: '/repository', kind: 'github_repository' }, conditions: t.tool === 'close_pull_request'
      ? [{ id: 'k-approvals', name: 'At least 2 approvals', expression: 'resource.properties.chokepoint["pr-reviews"].values["approvals"] >= 2', bindings: ['pr-reviews'] }]
      : t.tool === 'move_issue' ? [{ id: 'k-closed', name: 'Only closed issues', expression: 'resource.properties.chokepoint["issue-details"].values["status"] == "closed"', bindings: ['issue-details'] }] : [] })),
  ],
  resources: [
    ...Array.from({ length: 40 }, (_, i) => ({ id: `r-t${i}`, serverId: 'catalog', kind: 'test_item', value: String(i + 1) })),
    ...Array.from({ length: 120 }, (_, i) => ({ id: `r-g${i}`, serverId: 'github', kind: 'github_repository', value: `acme/service-${i}` })),
  ],
};

// Directory of each identity provider, as the backend lists it (people and services).
export const directory = baseDirectory.map(d => ({
  ...d,
  people: [...d.people, ...largeSubjects.filter(x => x.issuer === d.issuer && x.kind === 'person').map(x => ({ subject: x.subject, name: x.name }))],
  services: [...d.services, ...largeSubjects.filter(x => x.issuer === d.issuer && x.kind === 'service').map(x => ({ subject: x.subject, name: x.name }))],
}));
