import type { AgentRef, Decision, DecisionDetail, Evidence, Exchange, Page, Problem, SubjectRef } from '../../../src/features/investigate/types';

// Admin 049 prototype: fixed data of the Investigate list, captured from the Acme demo instance on
// 2026-11-07 (Production). Nothing is fetched and nothing is written.

const issuer = 'http://id.acme.localhost:8180/realms/acme';
const idp = '0175ae16-8cfb-46bb-a28a-19a111618c48';

export const agents = {
  analytics: { id: 'agent-analytics', name: 'analytics-assistant', status: 'active' },
  refunds: { id: 'agent-refunds', name: 'refunds-assistant', status: 'active' },
  support: { id: 'agent-support', name: 'support-assistant', status: 'active' },
  issues: { id: 'agent-issues', name: 'issues-manager', status: 'active' },
} satisfies Record<string, AgentRef>;

const person = (subject: string, name: string): SubjectRef => ({ identity_connection_id: idp, issuer, subject, kind: 'person', name });
const people = {
  camila: person('u-camila', 'Camila Rocha'),
  pedro: person('u-pedro', 'Pedro Lima'),
  rafael: person('u-rafael', 'Rafael Souza'),
  lucas: person('u-lucas', 'Lucas Ferreira'),
  julia: person('u-julia', 'Júlia Mendes'),
};

const servers = {
  analytics: { server_id: 'srv-analytics', server_name: 'Acme Analytics' },
  helpdesk: { server_id: 'srv-helpdesk', server_name: 'Acme Helpdesk' },
  billing: { server_id: 'srv-billing', server_name: 'Acme Billing' },
  issues: { server_id: 'srv-issues', server_name: 'Acme Issues' },
};

const condition = { label: 'condition', description: 'A policy condition was not met.' } as const;
// The rules of the Acme agents, in the CEL that the rule builder writes. The Admin has no allowed
// values: a rule checks the values.
const amountRule = 'context.chokepoint.arguments["amount"] <= 500';
const queueRule = 'context.chokepoint.arguments["queue"] == "tier-1"';
const datasetRule = 'context.chokepoint.arguments["dataset"] in ["sales_daily", "inventory"]';

// Each rule read as a sentence, in the words of the rule editor ("Reads as", ruleSentence).
export const ruleSentence: Record<string, string> = {
  [amountRule]: 'amount is at most 500',
  [queueRule]: 'queue is tier-1',
  [datasetRule]: 'dataset is one of [sales_daily, inventory]',
};

type ProblemInput = Pick<Problem, 'tool' | 'agent' | 'reason' | 'subject' | 'resource' | 'count' | 'principal_count'> &
  { server: { server_id: string; server_name: string }; window: string; first: string; last: string; id: string; rule?: string; signal: 'open' | 'reviewed' | 'resolved' };
const problem = (p: ProblemInput): Problem => ({
  ...p.server, tool: p.tool, agent: p.agent, reason: p.reason, subject: p.subject, resource: p.resource,
  count: p.count, principal_count: p.principal_count, window_start: p.window,
  window_end: new Date(new Date(p.window).getTime() + 3600000).toISOString().replace('.000', ''),
  first_at: p.first, last_at: p.last, latest_decision_id: p.id, condition: p.rule ?? null,
  signal: { id: `sig-${p.id}`, status: p.signal },
});

export const problems: Page<Problem> = {
  total: 30, page: 1, page_size: 6,
  items: [
    problem({ server: servers.analytics, tool: 'run_report', agent: agents.analytics, reason: condition, subject: people.camila, resource: null, count: 1, principal_count: 1, window: '2026-11-06T01:00:00Z', first: '2026-11-06T01:42:28Z', last: '2026-11-06T01:42:28Z', id: '240', rule: datasetRule, signal: 'resolved' }),
    problem({ server: servers.helpdesk, tool: 'close_ticket', agent: agents.support, reason: condition, subject: people.pedro, resource: null, count: 1, principal_count: 1, window: '2026-11-06T01:00:00Z', first: '2026-11-06T01:42:28Z', last: '2026-11-06T01:42:28Z', id: '234', rule: queueRule, signal: 'resolved' }),
    problem({ server: servers.billing, tool: 'refund_order', agent: agents.refunds, reason: condition, subject: people.rafael, resource: null, count: 1, principal_count: 1, window: '2026-11-06T01:00:00Z', first: '2026-11-06T01:42:27Z', last: '2026-11-06T01:42:27Z', id: '230', rule: amountRule, signal: 'resolved' }),
    problem({ server: servers.billing, tool: 'refund_order', agent: agents.refunds, reason: condition, subject: people.rafael, resource: null, count: 3, principal_count: 2, window: '2026-11-05T17:00:00Z', first: '2026-11-05T17:01:29Z', last: '2026-11-05T17:12:43Z', id: '210', rule: amountRule, signal: 'reviewed' }),
    problem({ server: servers.helpdesk, tool: 'close_ticket', agent: agents.support, reason: condition, subject: people.pedro, resource: null, count: 1, principal_count: 1, window: '2026-11-05T17:00:00Z', first: '2026-11-05T17:07:13Z', last: '2026-11-05T17:07:13Z', id: '204', rule: queueRule, signal: 'resolved' }),
    problem({ server: servers.analytics, tool: 'run_report', agent: agents.analytics, reason: condition, subject: people.camila, resource: null, count: 1, principal_count: 1, window: '2026-11-05T17:00:00Z', first: '2026-11-05T17:04:43Z', last: '2026-11-05T17:04:43Z', id: '199', rule: datasetRule, signal: 'resolved' }),
  ],
};

type DecisionInput = Pick<Decision, 'id' | 'tool' | 'agent' | 'subject' | 'resource' | 'outcome' | 'reason' | 'enforcement'> &
  { server: { server_id: string; server_name: string }; at: string; reference?: string; rule?: string };
const decision = (d: DecisionInput): Decision => ({
  ...d.server, id: d.id, tool: d.tool, agent: d.agent, subject: d.subject, resource: d.resource, outcome: d.outcome,
  reason: d.reason, enforcement: d.enforcement, decided_at: d.at, group_id: null, policy_id: null, condition: d.rule ?? null,
  evidence: { version: 1, steps: [], policies: [], grants: [], relations: [] },
  effective_revision: 12, published_revision: 12, presence: 'headless', grant_id: null, reference: d.reference ?? null,
} as Decision);

export const decisions: Page<Decision> = {
  total: 240, page: 1, page_size: 6,
  items: [
    decision({ id: '240', server: servers.analytics, tool: 'run_report', agent: agents.analytics, subject: people.camila, resource: null, outcome: 'deny', reason: condition, enforcement: 'enforce', at: '2026-11-06T01:42:28Z', reference: 'cag5-spao', rule: datasetRule }),
    decision({ id: '239', server: servers.analytics, tool: 'run_report', agent: agents.analytics, subject: people.camila, resource: null, outcome: 'permit', reason: null, enforcement: 'enforce', at: '2026-11-06T01:42:28Z' }),
    decision({ id: '238', server: servers.issues, tool: 'create_issue', agent: agents.issues, subject: people.lucas, resource: null, outcome: 'permit', reason: null, enforcement: 'report_only', at: '2026-11-06T01:42:28Z' }),
    decision({ id: '237', server: servers.issues, tool: 'merge_pull_request', agent: agents.issues, subject: people.julia, resource: null, outcome: 'would_deny', reason: { label: 'no_grant', description: 'No grant allows this call.' }, enforcement: 'report_only', at: '2026-11-06T01:42:28Z' }),
    decision({ id: '236', server: servers.issues, tool: 'move_issue', agent: agents.issues, subject: people.julia, resource: null, outcome: 'permit', reason: null, enforcement: 'report_only', at: '2026-11-06T01:42:28Z' }),
    decision({ id: '235', server: servers.issues, tool: 'list_issues', agent: agents.issues, subject: people.julia, resource: null, outcome: 'permit', reason: null, enforcement: 'report_only', at: '2026-11-06T01:42:28Z' }),
  ],
};

const exchange = (id: string, agent: AgentRef, subject: SubjectRef, permit: boolean, at: string, reference: string | null = null): Exchange => ({
  id, agent, subject, permit, occurred_at: at, presence: 'headless', grant_id: null, client_id: null, reference, cause: null,
  reason: permit ? null : { label: 'no_delegation', description: 'The subject does not delegate to the agent.' },
} as Exchange);

export const exchanges: Page<Exchange> = {
  total: 299, page: 1, page_size: 6,
  items: [
    exchange('299', agents.refunds, { ...people.pedro, kind: null }, false, '2026-11-06T01:42:28Z', 'n6sw-ocgw'),
    exchange('298', agents.analytics, people.camila, true, '2026-11-06T01:42:28Z'),
    exchange('297', agents.analytics, people.camila, true, '2026-11-06T01:42:28Z'),
    exchange('296', agents.issues, people.lucas, true, '2026-11-06T01:42:28Z'),
    exchange('295', agents.issues, people.julia, true, '2026-11-06T01:42:28Z'),
    exchange('294', agents.issues, people.julia, true, '2026-11-06T01:42:28Z'),
  ],
};

export const agentItems = Object.values(agents).map(agent => ({ agent }));

// The rule of each condition, as the agent editor names it.
const ruleName: Record<string, string> = {
  [amountRule]: 'Refund up to 500',
  [queueRule]: 'Tier-1 queue only',
  [datasetRule]: 'Sales and inventory only',
};

type Step = Evidence['steps'][number];
const steps = (failed?: 'capability' | 'condition'): Step[] => [
  { key: 'identity', order: 1, state: 'passed' },
  { key: 'tool_review', order: 2, state: 'passed' },
  { key: 'delegation', order: 3, state: 'passed' },
  { key: 'capability', order: 4, state: failed === 'capability' ? 'failed' : 'passed' },
  { key: 'condition', order: 6, state: failed === 'condition' ? 'failed' : failed ? 'not_evaluated' : 'not_applicable' },
];

// The decision of a row: from All decisions, or the latest decision of a problem.
function decisionOf(id: string): Decision | undefined {
  const listed = decisions.items.find(d => d.id === id);
  if (listed) return listed;
  const p = problems.items.find(x => x.latest_decision_id === id);
  return p && decision({ id, server: { server_id: p.server_id, server_name: p.server_name ?? p.server_id }, tool: p.tool, agent: p.agent, subject: p.subject, resource: null, outcome: 'deny', reason: p.reason, enforcement: 'enforce', at: p.last_at, rule: p.condition ?? undefined, reference: referenceOf(id) });
}

export function detailOf(id: string): DecisionDetail | undefined {
  const [base, n] = id.split('-');
  const latest = decisionOf(base);
  const p = problems.items.find(x => x.latest_decision_id === base);
  const d = latest && n && p ? problemDecisions(p).find(x => x.id === id) : latest;
  if (!d) return undefined;
  const failed = d.reason?.label === 'condition' ? 'condition' : d.reason?.label === 'no_grant' ? 'capability' : undefined;
  const subject = d.subject.name ?? d.subject.subject;
  const agent = d.agent.name ?? d.agent.id;
  const evidence: Evidence = {
    version: 1,
    steps: steps(failed),
    grants: failed === 'capability' ? [] : [{ group_id: '', revision: 12, server_id: d.server_id, tool: d.tool }],
    relations: [
      { key: 'delegation', state: 'passed', display: `${subject} → ${agent}` },
      { key: 'capability', state: failed === 'capability' ? 'failed' : 'passed', display: `${agent} → ${d.server_name} › ${d.tool}` },
    ],
    policies: d.condition ? [{ group_id: '', revision: 12, policy_id: `rule-${d.tool}`, name: ruleName[d.condition] ?? 'Rule', expression: d.condition, required_bindings: [], permit: false, server_id: d.server_id, tool: d.tool }] : [],
  };
  const problem = problems.items.find(x => x.latest_decision_id === base) ?? null;
  const window = problem ?? { window_start: '2026-11-06T01:00:00Z', window_end: '2026-11-06T02:00:00Z', first_at: d.decided_at, last_at: d.decided_at, count: 1 };
  return {
    decision: { ...d, evidence },
    problem,
    repeat: { count: window.count, first_at: window.first_at, last_at: window.last_at, window_start: window.window_start, window_end: window.window_end },
    actions: [],
    approximate: true,
    retention_days: 30,
  };
}

// A reference code in the shape the caller receives (four letters or digits, a dash, four more).
function referenceOf(id: string) {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const code = Array.from({ length: 8 }, (_, i) => alphabet[(h >>> (i * 3)) % alphabet.length]).join('');
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

// The decisions grouped in a problem (Decisions in this problem): one per counted call, in its window.
export function problemDecisions(p: Problem): Decision[] {
  const latest = decisionOf(p.latest_decision_id);
  if (!latest) return [];
  const first = new Date(p.first_at).getTime(), last = new Date(p.last_at).getTime();
  return Array.from({ length: p.count }, (_, i) => i === 0 ? latest : {
    ...latest,
    id: `${p.latest_decision_id}-${i}`,
    reference: referenceOf(`${p.latest_decision_id}-${i}`),
    decided_at: new Date(last - ((last - first) * i) / Math.max(1, p.count - 1)).toISOString().replace('.000', ''),
  });
}
