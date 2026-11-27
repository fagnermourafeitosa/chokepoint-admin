// Admin 064 prototype: fixed data from the Acme demo instance (refunds-assistant on Acme Billing).
// Nothing here is read from or written to the backend.

export type Kind = 'added' | 'removed' | 'changed';
export type Section = 'delegator' | 'tool' | 'rule';

// One change of the permission document. A change can hold the changes it causes, such as the
// people of an identity provider that is removed: they show under it and are not counted again.
export type Change = { section: Section; kind: Kind; label: string; detail?: string; before?: string; after?: string; children?: Change[] };

// published: the Who of the published revision, when the draft changed it.
export type Row = { label: string; cells: string[]; rules: number; kind?: Kind; published?: string };
// subjects and providers: the counts of the section bar in the draft (published: 2 people, 1 provider).
// losses: one line for each change that takes access away, in the order of the change list
// (Admin 064, warning rule). A change that only gives access has no line.
export type Scenario = { id: string; name: string; delegators: Row[]; tools: Row[]; changes: Change[]; losses: string[]; subjects: number; providers: number };
export const published = { subjects: 2, providers: 1 };

export const agent = { name: 'refunds-assistant', description: 'Answers order questions and issues refunds within limits.', effective: 6 };

// The agents of the Acme demo instance, as the agent list shows them.
export const agents = [
  agent,
  { name: 'support-assistant', description: 'Reads and answers support tickets of the first tier.' },
  { name: 'issues-manager', description: 'Triages and updates issues in the Acme repositories.' },
  { name: 'analytics-assistant', description: 'Runs read-only reports on the sales and inventory data.' },
];

const consent = 'Beatriz Nunes · 2026-11-12 14:05 UTC';

const people = (kind: Kind): Change[] => [
  { section: 'delegator', kind, label: 'Marina Alves', detail: 'person' },
  { section: 'delegator', kind, label: 'Rafael Souza', detail: 'person' },
];

const tools = (extra: Row[] = []): Row[] => [
  { label: 'get_order', cells: ['get_order', 'Acme Billing'], rules: 0 },
  { label: 'list_refunds', cells: ['list_refunds', 'Acme Billing'], rules: 0 },
  ...extra,
];

export const scenarios: Scenario[] = [
  {
    id: 'remove-idp',
    name: 'Remove an identity provider',
    subjects: 0,
    providers: 0,
    delegators: [{ label: 'Acme Identity', cells: ['Acme Identity', '2 of 7', 'People', consent], rules: 0, kind: 'removed' }],
    tools: tools([{ label: 'refund_order', cells: ['refund_order', 'Acme Billing'], rules: 2 }]),
    changes: [{ section: 'delegator', kind: 'removed', label: 'Acme Identity', detail: 'identity provider · people', children: people('removed') }],
    losses: ['Nobody can delegate to refunds-assistant after this. Every call of the agent is denied: Subject did not delegate.'],
  },
  {
    id: 'edit-access',
    name: 'Change a rule, add a tool, remove a person',
    subjects: 1,
    providers: 1,
    delegators: [{ label: 'Acme Identity', cells: ['Acme Identity', '1 of 7', 'People', consent], rules: 0, kind: 'changed', published: '2 of 7' }],
    tools: tools([
      { label: 'refund_order', cells: ['refund_order', 'Acme Billing'], rules: 2, kind: 'changed' },
      { label: 'issue_credit_note', cells: ['issue_credit_note', 'Acme Billing'], rules: 0, kind: 'added' },
    ]),
    changes: [
      { section: 'delegator', kind: 'changed', label: 'Acme Identity', detail: '2 of 7 people → 1 of 7', children: [{ section: 'delegator', kind: 'removed', label: 'Rafael Souza', detail: 'person' }] },
      { section: 'tool', kind: 'added', label: 'issue_credit_note', detail: 'Acme Billing · no rules' },
      { section: 'rule', kind: 'changed', label: 'Refund up to 500', detail: 'refund_order', before: 'amount is at most 500', after: 'amount is at most 200' },
    ],
    losses: [
      'Rafael Souza can no longer delegate to refunds-assistant. The calls made for Rafael Souza are denied: Subject did not delegate.',
      'A rule of refund_order changed: amount is at most 500 → amount is at most 200. Calls that passed before can be denied: A rule of this agent · server · tool was not met.',
    ],
  },
];

// A change counts once, with the changes it causes under it.
export const total = (changes: Change[]) => changes.length;
export const count = (changes: Change[], kind: Kind) => changes.filter(c => c.kind === kind).length;

export type Revision = { revision: number; note: string; by: string; at: string; applied: string; changes: Change[]; effective?: boolean; same?: string };

export const revisions: Revision[] = [
  { revision: 6, note: 'Harness login for Finance', by: 'Beatriz Nunes', at: 'Nov 12, 14:06 UTC', applied: 'Nov 12, 14:06 UTC', changes: [], effective: true, same: 'Who can delegate, the tools and the rules are the same as in revision 4.' },
  { revision: 4, note: 'Add a call rule', by: 'Beatriz Nunes', at: 'Nov 12, 14:05 UTC', applied: 'Nov 12, 14:05 UTC', changes: [
    { section: 'rule', kind: 'added', label: 'Refund up to 500', detail: 'refund_order', after: 'amount is at most 500' },
  ] },
  { revision: 2, note: 'Initial access for the team', by: 'Beatriz Nunes', at: 'Nov 12, 14:05 UTC', applied: 'Nov 12, 14:05 UTC', changes: [
    { section: 'delegator', kind: 'added', label: 'Acme Identity', detail: 'identity provider · people', children: people('added') },
    { section: 'tool', kind: 'added', label: 'get_order', detail: 'Acme Billing' },
    { section: 'tool', kind: 'added', label: 'list_refunds', detail: 'Acme Billing' },
    { section: 'tool', kind: 'added', label: 'refund_order', detail: 'Acme Billing' },
  ] },
];
