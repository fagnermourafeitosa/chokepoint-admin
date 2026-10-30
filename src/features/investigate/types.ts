export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  // Directory name matching stopped at its bound; results may miss some people.
  search_truncated?: boolean;
};
export type Reason = {
  label: 'no_grant' | 'condition' | 'tool_not_reviewed' | 'user_disabled';
  description: string;
};
export type SignalRef = { id: string; status: 'open' | 'reviewed' | 'resolved' };
export type Principal = { issuer: string; subject: string; name?: string | null };
export type Evidence = {
  version: number;
  steps: {
    key: string;
    order: number;
    state: 'passed' | 'failed' | 'not_evaluated' | 'not_applicable';
    detail?: string;
  }[];
  policies: {
    group_id: string;
    revision: number;
    policy_id: string;
    name: string;
    expression: string;
    required_bindings: string[];
    permit: boolean;
    server_id: string;
    tool?: string;
  }[];
  grants: { group_id: string; revision: number; server_id: string; tool: string }[];
};
export type Decision = {
  id: string;
  server_id: string;
  server_name?: string | null;
  tool: string;
  agent: string;
  agent_name?: string | null;
  issuer: string;
  subject: string;
  principal_name?: string | null;
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
export type Problem = Omit<ProblemKey, 'reason'> & {
  server_name?: string | null;
  agent_name?: string | null;
  reason: Reason;
  window_end: string;
  count: number;
  first_at: string;
  last_at: string;
  latest_decision_id: string;
  principal: Principal;
  principal_count: number;
  condition?: string | null;
  signal?: SignalRef | null;
};
export type Action = {
  label: string;
  route: 'permissions' | 'tool-catalog' | 'person-detail';
  params: Record<string, string>;
  available: boolean;
  unavailable_reason?: string;
};
export type DecisionDetail = {
  decision: Decision;
  problem?: Problem | null;
  repeat: {
    count: number;
    first_at: string;
    last_at: string;
    window_start: string;
    window_end: string;
  };
  actions: Action[];
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
  agent: p.agent,
  reason: p.reason.label,
  window_start: p.window_start,
});
