export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  // Directory name matching stopped at its bound; results may miss some people.
  search_truncated?: boolean;
};
// Deny reasons of a decision (Backend 031, 034).
export type ReasonLabel = 'no_delegation' | 'no_grant' | 'no_resource' | 'condition' | 'tool_not_reviewed';
export type Reason = { label: ReasonLabel; description: string };
// Reasons of a refused token exchange (Backend 034 Solution 6).
export type ExchangeReasonLabel =
  | 'invalid_client'
  | 'subject_token_expired'
  | 'subject_token_invalid'
  | 'subject_connection_disabled'
  | 'no_delegation'
  | 'invalid_authorization_details'
  // Denials of a harness login or its tokens (Backend 045).
  | 'no_group'
  | 'blocked'
  | 'not_allowed_client'
  | 'code_reuse'
  | 'refresh_reuse'
  | 'dpop_invalid'
  // A harness login that ended on the generic error page (Backend 053).
  | 'login_error';
// The closed cause of a login_error (Backend 053). Only the Admin shows it.
export type LoginErrorCause =
  | 'invalid_request'
  | 'invalid_client_id'
  | 'client_metadata_invalid'
  | 'redirect_uri_invalid'
  | 'transaction_expired'
  | 'provider_not_available'
  | 'server_error';
export type ExchangeReason = { label: ExchangeReasonLabel; description: string };
export type SignalRef = { id: string; status: 'open' | 'reviewed' | 'resolved' };
// The verified agent of a decision or an exchange (act.sub). Status is null when
// no agent of the environment has the ID; a deleted agent keeps its name (Backend 038).
export type AgentRef = { id: string; name?: string | null; status?: 'active' | 'disabled' | 'deleted' | null };
// The person or service on whose behalf the agent acts. Records written before
// Backend 034 have no connection and no kind.
export type SubjectRef = {
  identity_connection_id?: string | null;
  issuer: string;
  subject: string;
  kind?: 'person' | 'service' | null;
  name?: string | null;
};
export type StepState = 'passed' | 'failed' | 'not_evaluated' | 'not_applicable';
export type Evidence = {
  version: number;
  steps: { key: string; order: number; state: StepState }[];
  policies: {
    group_id: string;
    revision: number;
    policy_id: string;
    name: string;
    expression: string;
    required_bindings: string[];
    required_limits?: string[];
    limits_present?: boolean;
    permit: boolean;
    server_id: string;
    tool?: string;
  }[];
  grants: { group_id: string; revision: number; server_id: string; tool: string }[];
  relations?: { key: 'delegation' | 'capability' | 'resource'; state: StepState; display?: string }[];
};
export type ResourceRef = { type: string; id: string };
export type Outcome = 'permit' | 'deny' | 'would_deny';
export type Decision = {
  id: string;
  server_id: string;
  server_name?: string | null;
  tool: string;
  agent: AgentRef;
  subject: SubjectRef;
  resource?: ResourceRef | null;
  // Backend 057: a would_deny is a deny of the policy of an agent in Report-only; the call ran.
  outcome: Outcome;
  // The mode of the agent at decision time; null for a block before the PDP and before Backend 057.
  enforcement?: 'enforce' | 'report_only' | null;
  reason?: Reason | null;
  group_id?: string | null;
  policy_id?: string | null;
  decided_at: string;
  condition?: string | null;
  evidence?: Evidence | null;
  // The permission revisions of the agent when the PDP decided; null when not
  // recorded. They differ only while a publication was applying (Backend 038).
  effective_revision?: number | null;
  published_revision?: number | null;
  // The incident code of a deny, as the agent got it in its error (Backend 053).
  reference?: string | null;
};
export type ProblemKey = {
  server_id: string;
  tool: string;
  agent: string;
  reason: string;
  window_start: string;
};
export type Problem = {
  server_id: string;
  tool: string;
  window_start: string;
  server_name?: string | null;
  agent: AgentRef;
  reason: Reason;
  window_end: string;
  count: number;
  first_at: string;
  last_at: string;
  latest_decision_id: string;
  subject: SubjectRef;
  // The resource of the latest decision of the problem (Backend 039).
  resource?: ResourceRef | null;
  principal_count: number;
  condition?: string | null;
  signal?: SignalRef | null;
};
export type Action = {
  label: string;
  route: 'permissions' | 'tool-catalog';
  params: Record<string, string>;
  available: boolean;
  unavailable_reason?: string;
};
export type Repeat = {
  count: number;
  first_at: string;
  last_at: string;
  window_start: string;
  window_end: string;
};
export type DecisionDetail = {
  decision: Decision;
  problem?: Problem | null;
  repeat: Repeat;
  actions: Action[];
  approximate: boolean;
  retention_days: number;
};
// One request of an agent to the Xokepoint authorization server (Backend 034).
export type Exchange = {
  id: string;
  agent?: AgentRef | null;
  subject?: SubjectRef | null;
  permit: boolean;
  reason?: ExchangeReason | null;
  occurred_at: string;
  // The harness of a login (Backend 045), and the incident code of a refusal (Backend 053).
  client_id?: string | null;
  reference?: string | null;
  cause?: LoginErrorCause | null;
};
export type ExchangeProblem = {
  agent?: AgentRef | null;
  reason: ExchangeReason;
  subject?: SubjectRef | null;
  window_start: string;
  window_end: string;
  count: number;
  first_at: string;
  last_at: string;
  latest_exchange_id: string;
  signal?: SignalRef | null;
};
export type ExchangeDetail = {
  exchange: Exchange;
  problem?: ExchangeProblem | null;
  repeat: Repeat;
  occurrences: Page<Exchange>;
  approximate: boolean;
  retention_days: number;
};
export type TraceFilters = {
  agent?: string;
  from?: string;
  to?: string;
  q?: string;
  server_id?: string;
  tool?: string;
  issuer?: string;
  subject?: string;
  reason?: string;
  result?: string;
  page?: string;
  page_size?: string;
};
export const problemKey = (p: Problem): ProblemKey => ({
  server_id: p.server_id,
  tool: p.tool,
  agent: p.agent.id,
  reason: p.reason.label,
  window_start: p.window_start,
});
