// Layout prototype only. Fixed data for the central use case: agents acting on GitHub and a payments API. No API reads or writes.
export type SubjectKind = 'person' | 'service';
export type Consent = { source: 'administrator' | 'idp'; recordedBy: string; recordedAt: string };
export type Delegation = { id: string; issuer: string; subject: string; name: string; kind: SubjectKind; expiresAt?: string; consent: Consent };
export type Condition = { id: string; name: string; expression: string; bindings: string[] };
export type Capability = { id: string; serverId: string; tool: string; expiresAt?: string; mapping?: { pointer: string; kind: string }; conditions: Condition[] };
// A resource belongs to a server and a resource type (Backend 029). It is an allow list: no rules.
export type Resource = { id: string; serverId: string; kind: string; value: string };
export type Server = { id: string; name: string; type: 'custom' | 'enterprise' };
// Who can delegate is set for each identity provider: everyone (with exceptions) or only selected subjects.
export type IdpScope = { issuer: string; mode: 'everyone' | 'selected'; kinds: SubjectKind[]; except: string[]; expiresAt?: string; consent: Consent };
export type Doc = { scopes: IdpScope[]; delegations: Delegation[]; capabilities: Capability[]; resources: Resource[] };

export const servers: Server[] = [{ id: 'github', name: 'GitHub', type: 'enterprise' }, { id: 'payments', name: 'Payments API', type: 'custom' }];
export const currentAdmin = 'Marina Alves';

// The resource type proposal: <tool>_<argument>.
export const resourceType = (tool: string, arg: string) => `${tool}_${arg}`;
const repo = (tool: string) => ({ pointer: '/repository', kind: resourceType(tool, 'repository') });

// Reviewed tools of each server, with their input arguments and resource mapping.
const githubTools: [string, Record<string, string>][] = [
  ['merge_pull_request', { repository: 'string', pull_number: 'number', merge_method: 'string' }],
  ['close_pull_request', { repository: 'string', pull_number: 'number' }],
  ['list_issues', { repository: 'string', state: 'string' }],
  ['move_issue', { repository: 'string', issue_number: 'number', column: 'string' }],
  ['create_issue', { repository: 'string', title: 'string' }],
  ['get_file_contents', { repository: 'string', path: 'string' }],
  ['list_pull_requests', { repository: 'string', state: 'string' }],
  ['create_branch', { repository: 'string', branch: 'string' }],
  ['search_code', { repository: 'string', query: 'string' }],
  ['list_commits', { repository: 'string', branch: 'string' }],
];
export const toolCatalog: { serverId: string; tool: string; args: Record<string, string>; mapping?: { pointer: string; kind: string } }[] = [
  ...githubTools.map(([tool, args]) => ({ serverId: 'github', tool, args, mapping: repo(tool) })),
  { serverId: 'payments', tool: 'get_invoice', args: { invoice_id: 'string' } },
  { serverId: 'payments', tool: 'issue_refund', args: { invoice_id: 'string', amount: 'number', reason: 'string' } },
];

// Approved source bindings for each tool (trusted attributes from the PIP).
const reviews = { id: 'pr-reviews', source: 'GitHub API / pull request reviews', entity: 'resource' as const, attributes: [{ name: 'approvals', type: 'number' }, { name: 'changes_requested', type: 'bool' }] };
export const toolBindings: Record<string, { id: string; source: string; entity: 'subject' | 'resource'; attributes: { name: string; type: string }[] }[]> = {
  merge_pull_request: [reviews],
  close_pull_request: [reviews],
  move_issue: [{ id: 'issue-details', source: 'GitHub API / issue', entity: 'resource', attributes: [{ name: 'status', type: 'string' }, { name: 'labels_count', type: 'number' }] }],
  issue_refund: [{ id: 'employee-profile', source: 'HR API / employee profile', entity: 'subject', attributes: [{ name: 'department', type: 'string' }, { name: 'refund_limit', type: 'number' }] }],
};

// Subjects listed from each identity provider directory.
export const baseDirectory = [
  { issuer: 'Keycloak customer', people: [{ subject: 'alice', name: 'Alice Martins' }, { subject: 'bruno', name: 'Bruno Costa' }, { subject: 'camila', name: 'Camila Rocha' }, { subject: 'diego', name: 'Diego Alves' }], services: [{ subject: 'release-pipeline', name: 'release-pipeline' }, { subject: 'support-bot', name: 'support-bot' }] },
  { issuer: 'Google Workspace', people: [{ subject: '1029384756', name: 'Erica Lima' }], services: [{ subject: '1188776655', name: 'reports@acme.iam' }] },
];

const consent = (at: string): Consent => ({ source: 'administrator', recordedBy: currentAdmin, recordedAt: `2026-10-31 ${at} UTC` });
const reviewsValue = (name: string) => `resource.properties.chokepoint["pr-reviews"].values["${name}"]`;
const cap = (serverId: string, tool: string, conditions: Condition[] = [], expiresAt?: string): Capability => {
  const t = toolCatalog.find(x => x.tool === tool);
  return { id: `c-${tool}`, serverId, tool, expiresAt, mapping: t?.mapping ? { ...t.mapping } : undefined, conditions };
};
const res = (tool: string, value: string, serverId = 'github'): Resource => ({ id: `r-${tool}-${value}`, serverId, kind: resourceType(tool, 'repository'), value });

export const initialDoc: Doc = {
  scopes: [{ issuer: 'Keycloak customer', mode: 'selected', kinds: ['person', 'service'], except: [], consent: consent('09:10') }],
  delegations: [
    { id: 'd-alice', issuer: 'Keycloak customer', subject: 'alice', name: 'Alice Martins', kind: 'person', expiresAt: '2026-11-30', consent: consent('09:12') },
    { id: 'd-bruno', issuer: 'Keycloak customer', subject: 'bruno', name: 'Bruno Costa', kind: 'person', consent: consent('09:14') },
    { id: 'd-pipeline', issuer: 'Keycloak customer', subject: 'release-pipeline', name: 'release-pipeline', kind: 'service', consent: consent('09:20') },
  ],
  capabilities: [
    cap('github', 'merge_pull_request', [{ id: 'k-approvals', name: 'At least 2 approvals, no changes requested', expression: `${reviewsValue('approvals')} >= 2 && !${reviewsValue('changes_requested')}`, bindings: ['pr-reviews'] }]),
    cap('github', 'list_issues'),
    cap('github', 'move_issue', [{ id: 'k-closed', name: 'Only closed issues', expression: 'resource.properties.chokepoint["issue-details"].values["status"] == "closed"', bindings: ['issue-details'] }]),
    cap('payments', 'get_invoice'),
    cap('payments', 'issue_refund', [{ id: 'k-amount', name: 'Refund up to 500', expression: 'context.chokepoint.arguments["amount"] <= 500', bindings: [] }], '2026-12-31'),
  ],
  resources: [
    res('merge_pull_request', 'acme/payments-api'),
    res('list_issues', 'acme/payments-api'),
    res('list_issues', 'acme/web'),
    res('move_issue', 'acme/web'),
  ],
};

// Large sample to check how the screen scales: 100 subjects, 12 tools, 160 resources.
const first = ['Ana', 'Bruno', 'Carla', 'Davi', 'Elisa', 'Felipe', 'Gabi', 'Hugo', 'Iara', 'João'], last = ['Silva', 'Souza', 'Lima', 'Costa', 'Rocha', 'Alves', 'Melo', 'Dias', 'Nunes'];
const largeSubjects: Delegation[] = Array.from({ length: 100 }, (_, i) => {
  const service = i % 10 === 9, issuer = i % 4 === 3 ? 'Google Workspace' : 'Keycloak customer';
  const name = service ? `worker-${i}` : `${first[i % first.length]} ${last[i % last.length]} ${i}`;
  return { id: `d-l${i}`, issuer, subject: service ? `svc-${i}` : `user-${i}`, name, kind: service ? 'service' : 'person', expiresAt: i % 3 === 0 ? '2026-12-31' : undefined, consent: consent(`10:${String(i % 60).padStart(2, '0')}`) };
});
const repos = ['payments-api', 'web', 'checkout', 'billing', 'auth', 'search', 'ledger', 'mobile', 'infra', 'notifications'];
const repoName = (i: number) => `acme/${repos[i % 10]}${i >= 10 ? `-${Math.floor(i / 10)}` : ''}`;
export const largeDoc: Doc = {
  scopes: [
    { issuer: 'Keycloak customer', mode: 'everyone', kinds: ['person', 'service'], except: ['user-5', 'user-12'], expiresAt: '2027-03-31', consent: consent('10:00') },
    { issuer: 'Google Workspace', mode: 'selected', kinds: ['person'], except: [], consent: consent('10:05') },
  ],
  delegations: largeSubjects.filter(d => d.issuer === 'Google Workspace'),
  capabilities: [
    ...initialDoc.capabilities,
    ...githubTools.map(([tool]) => tool).filter(tool => !initialDoc.capabilities.some(c => c.tool === tool)).map(tool => cap('github', tool)),
  ],
  resources: [
    ...Array.from({ length: 80 }, (_, i) => res('list_issues', repoName(i))),
    ...Array.from({ length: 60 }, (_, i) => res('get_file_contents', repoName(i))),
    ...Array.from({ length: 20 }, (_, i) => res('merge_pull_request', repoName(i))),
  ],
};

// Directory of each identity provider, as the backend lists it (people and services).
export const directory = baseDirectory.map(d => ({
  ...d,
  people: [...d.people, ...largeSubjects.filter(x => x.issuer === d.issuer && x.kind === 'person').map(x => ({ subject: x.subject, name: x.name }))],
  services: [...d.services, ...largeSubjects.filter(x => x.issuer === d.issuer && x.kind === 'service').map(x => ({ subject: x.subject, name: x.name }))],
}));
