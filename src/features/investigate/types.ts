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
  | 'invalid_authorization_details';
export type ExchangeReason = { label: ExchangeReasonLabel; description: string };
export type SignalRef = { id: string; status: 'open' | 'reviewed' | 'resolved' };
// The verified agent of a decision or an exchange (act.sub).
export type AgentRef = { id: string; name?: string | null };
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
export type Decision = {
  id: string;
  server_id: string;
  server_name?: string | null;
  tool: string;
  agent: AgentRef;
  subject: SubjectRef;
  resource?: ResourceRef | null;
  permit: boolean;
  reason?: Reason | null;
  group_id?: string | null;
  policy_id?: string | null;
  decided_at: string;
  condition?: string | null;
  evidence?: Evidence | null;
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
// One request of an agent to the Chokepoint authorization server (Backend 034).
export type Exchange = {
  id: string;
  agent?: AgentRef | null;
  subject?: SubjectRef | null;
  permit: boolean;
  reason?: ExchangeReason | null;
  occurred_at: string;
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
