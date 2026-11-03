import type { AgentRef, ExchangeReasonLabel, ReasonLabel, SubjectRef } from './types';

// Deny reasons in short words (Admin 030 section 2).
export const denyText: Record<ReasonLabel, string> = {
  no_delegation: 'The subject did not delegate to this agent.',
  no_grant: 'The agent can not call this tool.',
  no_resource: 'The agent can not act on this resource.',
  condition: 'A rule of this agent · server · tool was not met.',
  tool_not_reviewed: 'The tool has not been reviewed (blocked before the PDP).',
};

// Token exchange reasons (Admin 030 section 4).
export const exchangeShort: Record<ExchangeReasonLabel, string> = {
  invalid_client: 'Agent key did not match',
  subject_token_expired: 'Subject token expired',
  subject_token_invalid: 'Subject token not valid',
  subject_connection_disabled: 'Identity provider disabled',
  no_delegation: 'Subject did not delegate',
  invalid_authorization_details: 'Instance limits not valid',
};
export const exchangeText: Record<ExchangeReasonLabel, string> = {
  invalid_client: 'The agent key did not match. The file may be old or exposed.',
  subject_token_expired: 'The provider may have disabled the user, or the agent did not renew the token.',
  subject_token_invalid: 'Signature, issuer or audience.',
  subject_connection_disabled: 'The connection of this identity provider is disabled.',
  no_delegation: 'The subject did not delegate to this agent.',
  invalid_authorization_details: 'The instance asked for limits that are not valid, or for a tool that the agent can not call (RFC 9396).',
};

export const stepLabel: Record<string, string> = {
  identity: 'Identity',
  tool_review: 'Tool review',
  delegation: 'Delegation',
  capability: 'Tool',
  resource: 'Resource',
  condition: 'Rules',
  // Steps of records written before Backend 034.
  relation: 'Relation',
  context: 'Context',
};
export const stateText = { passed: 'Passed', failed: 'Failed', not_evaluated: 'Not evaluated', not_applicable: 'Not applicable' } as const;

export const subjectName = (s: SubjectRef) => s.name || s.subject;
export const kindText = (s: SubjectRef) => (s.kind === 'service' ? 'Service' : s.kind === 'person' ? 'Person' : undefined);

// agentText names an agent and marks a deleted one, which keeps its name (Backend 038).
export function agentText(agent: AgentRef): string {
  return (agent.name || agent.id) + (agent.status === 'deleted' ? ' (deleted)' : '');
}
