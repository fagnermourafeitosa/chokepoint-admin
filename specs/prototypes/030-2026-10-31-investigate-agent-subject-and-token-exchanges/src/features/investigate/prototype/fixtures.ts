// Layout prototype (Admin A3): decisions and token exchanges as Backend 034 records them. Fixed data only.
export type DenyReason = 'no_delegation' | 'no_grant' | 'no_resource' | 'condition' | 'tool_not_reviewed';
export type ExchangeReason = 'invalid_client' | 'subject_token_expired' | 'subject_token_invalid' | 'subject_connection_disabled' | 'no_delegation';
export type StepKey = 'delegation' | 'capability' | 'resource' | 'condition';
export type StepState = 'passed' | 'failed' | 'not_applicable' | 'not_evaluated';
export type Subject = { name: string; subject: string; kind: 'person' | 'service'; issuer: string };
export type Step = { key: StepKey; state: StepState; relation: string };
export type Rule = { name: string; expression: string; bindings: string[]; result?: boolean };
export type Decision = {
  id: string; at: string; permit: boolean; reason?: DenyReason; agent: string; agentId: string; subject: Subject;
  server: string; tool: string; resource?: { type: string; value: string }; steps: Step[]; rules: Rule[];
  count: number; first: string;
};
export type Exchange = { id: string; at: string; issued: boolean; reason?: ExchangeReason; agent: string; subject?: Subject; count: number; first: string };

export const denyText: Record<DenyReason, string> = {
  no_delegation: 'The subject did not delegate to this agent.',
  no_grant: 'The agent can not call this tool.',
  no_resource: 'The agent can not act on this resource.',
  condition: 'A rule of this agent · server · tool was not met.',
  tool_not_reviewed: 'The tool has not been reviewed.',
};
export const exchangeText: Record<ExchangeReason, string> = {
  invalid_client: 'The agent key did not match. The file may be old or exposed.',
  subject_token_expired: 'The token of the person or service had expired. The provider may have disabled the user, or the agent did not renew the token.',
  subject_token_invalid: 'The token of the person or service was not valid: signature, issuer or audience.',
  subject_connection_disabled: 'The connection of this identity provider is disabled.',
  no_delegation: 'The subject did not delegate to this agent.',
};
// Short labels for the list rows; the full text is in the detail.
export const exchangeShort: Record<ExchangeReason, string> = {
  invalid_client: 'Agent key did not match',
  subject_token_expired: 'Subject token expired',
  subject_token_invalid: 'Subject token not valid',
  subject_connection_disabled: 'Identity provider disabled',
  no_delegation: 'Subject did not delegate',
};
export const stepLabel: Record<StepKey, string> = { delegation: 'Delegation', capability: 'Tool', resource: 'Resource', condition: 'Rules' };

const alice: Subject = { name: 'Alice Martins', subject: 'alice', kind: 'person', issuer: 'Keycloak customer' };
const bruno: Subject = { name: 'Bruno Costa', subject: 'bruno', kind: 'person', issuer: 'Keycloak customer' };
const diego: Subject = { name: 'Diego Alves', subject: 'diego', kind: 'person', issuer: 'Keycloak customer' };
const pipeline: Subject = { name: 'release-pipeline', subject: 'release-pipeline', kind: 'service', issuer: 'Keycloak customer' };
const erica: Subject = { name: 'Erica Lima', subject: '1029384756', kind: 'person', issuer: 'Google Workspace' };
const agent = 'issues-manager', agentId = 'c61e0a96-18ad-4a42-8aea-882c4a8847d7';
const approvals = { name: 'At least 2 approvals, no changes requested', expression: 'resource.properties.chokepoint["pr-reviews"].values["approvals"] >= 2 && !resource.properties.chokepoint["pr-reviews"].values["changes_requested"]', bindings: ['pr-reviews'] };
const deleg = (s: Subject, state: StepState = 'passed'): Step => ({ key: 'delegation', state, relation: `${s.issuer} · ${s.name} → ${agent}` });
const cap = (tool: string, state: StepState = 'passed', server = 'GitHub'): Step => ({ key: 'capability', state, relation: `${agent} → ${server} · ${tool}` });
const res = (type: string, value: string, state: StepState = 'passed'): Step => ({ key: 'resource', state, relation: `${agent} → ${type} › ${value}` });
const rules = (state: StepState, text = 'agent · server · tool'): Step => ({ key: 'condition', state, relation: text });

export const decisions: Decision[] = [
  { id: '90412', at: '2026-10-31 14:22', permit: false, reason: 'condition', agent, agentId, subject: alice, server: 'GitHub', tool: 'merge_pull_request', resource: { type: 'merge_pull_request_repository', value: 'acme/payments-api' },
    steps: [deleg(alice), cap('merge_pull_request'), res('merge_pull_request_repository', 'acme/payments-api'), rules('failed', '1 rule: At least 2 approvals')], rules: [{ ...approvals, result: false }], count: 4, first: '2026-10-31 14:02' },
  { id: '90398', at: '2026-10-31 14:10', permit: false, reason: 'no_resource', agent, agentId, subject: bruno, server: 'GitHub', tool: 'merge_pull_request', resource: { type: 'merge_pull_request_repository', value: 'acme/infra' },
    steps: [deleg(bruno), cap('merge_pull_request'), res('merge_pull_request_repository', 'acme/infra', 'failed'), rules('not_evaluated')], rules: [{ ...approvals }], count: 2, first: '2026-10-31 14:02' },
  { id: '90377', at: '2026-10-31 13:58', permit: false, reason: 'no_delegation', agent, agentId, subject: diego, server: 'GitHub', tool: 'list_issues', resource: { type: 'list_issues_repository', value: 'acme/web' },
    steps: [deleg(diego, 'failed'), cap('list_issues', 'not_evaluated'), res('list_issues_repository', 'acme/web', 'not_evaluated'), rules('not_evaluated')], rules: [], count: 7, first: '2026-10-31 13:10' },
  { id: '90360', at: '2026-10-31 13:41', permit: false, reason: 'no_grant', agent, agentId, subject: pipeline, server: 'GitHub', tool: 'create_branch', resource: { type: 'create_branch_repository', value: 'acme/web' },
    steps: [deleg(pipeline), cap('create_branch', 'failed'), res('create_branch_repository', 'acme/web', 'not_evaluated'), rules('not_evaluated')], rules: [], count: 3, first: '2026-10-31 13:02' },
  { id: '90344', at: '2026-10-31 13:30', permit: true, agent, agentId, subject: alice, server: 'GitHub', tool: 'list_issues', resource: { type: 'list_issues_repository', value: 'acme/payments-api' },
    steps: [deleg(alice), cap('list_issues'), res('list_issues_repository', 'acme/payments-api'), rules('not_applicable', 'No rule on this tool')], rules: [], count: 1, first: '2026-10-31 13:30' },
  { id: '90321', at: '2026-10-31 13:12', permit: true, agent, agentId, subject: erica, server: 'Payments API', tool: 'issue_refund',
    steps: [deleg(erica), cap('issue_refund', 'passed', 'Payments API'), { key: 'resource', state: 'not_applicable', relation: 'issue_refund has no resource mapping' }, rules('passed', '1 rule: Refund up to 500')], rules: [{ name: 'Refund up to 500', expression: 'context.chokepoint.arguments["amount"] <= 500', bindings: [], result: true }], count: 1, first: '2026-10-31 13:12' },
];

export const exchanges: Exchange[] = [
  { id: 'x-551', at: '2026-10-31 14:20', issued: false, reason: 'subject_token_expired', agent, subject: bruno, count: 12, first: '2026-10-31 14:01' },
  { id: 'x-548', at: '2026-10-31 14:05', issued: false, reason: 'invalid_client', agent, count: 5, first: '2026-10-31 14:01' },
  { id: 'x-540', at: '2026-10-31 13:57', issued: false, reason: 'no_delegation', agent, subject: diego, count: 7, first: '2026-10-31 13:05' },
  { id: 'x-532', at: '2026-10-31 13:20', issued: false, reason: 'subject_token_invalid', agent, count: 2, first: '2026-10-31 13:18' },
  { id: 'x-529', at: '2026-10-31 13:10', issued: true, agent, subject: erica, count: 1, first: '2026-10-31 13:10' },
  { id: 'x-517', at: '2026-10-31 12:44', issued: false, reason: 'subject_connection_disabled', agent, count: 1, first: '2026-10-31 12:44' },
];
