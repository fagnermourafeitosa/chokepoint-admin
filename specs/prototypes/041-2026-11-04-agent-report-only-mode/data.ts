// Fixed data of the Report-only prototype (Admin 041). Acme, Production, as in the demo instance.
// Nothing here comes from the backend.
export type Mode = 'enforce' | 'report_only';
export type Outcome = 'allow' | 'deny' | 'would_deny';

export const BACKEND_SPEC = '057';

// reviewBy: an optional date that the administrator sets for the review of the mode. It only reminds: the mode never changes by itself.
export type ProtoAgent = { id: string; name: string; description: string; mode: Mode; since?: string; by?: string; reviewBy?: string; wouldDeny24h: number; lastWouldDeny?: string };

export const TODAY = '2026-11-04';

export const agents: ProtoAgent[] = [
  { id: 'refunds', name: 'refunds-assistant', description: 'Looks up orders and refunds customers', mode: 'report_only', since: '2026-11-02T14:10:00Z', by: 'Beatriz Nunes', reviewBy: '2026-11-09', wouldDeny24h: 9, lastWouldDeny: '2026-11-04T17:42:00Z' },
  { id: 'issues', name: 'issues-manager', description: 'Triages and moves issues for the product team', mode: 'report_only', since: '2026-11-03T09:25:00Z', by: 'Beatriz Nunes', reviewBy: '2026-11-03', wouldDeny24h: 28, lastWouldDeny: '2026-11-04T18:05:00Z' },
  { id: 'support', name: 'support-assistant', description: 'Replies to and closes tier-1 tickets', mode: 'enforce', wouldDeny24h: 0 },
  { id: 'analytics', name: 'analytics-assistant', description: 'Runs reports on approved datasets', mode: 'enforce', wouldDeny24h: 0 },
];

export const reportOnly = agents.filter(a => a.mode === 'report_only');
export const wouldDenyTotal = reportOnly.reduce((n, a) => n + a.wouldDeny24h, 0);

export type ProtoDecision = { id: string; outcome: Outcome; reason?: string; agent: string; mode: Mode; subject: string; group: string; server: string; tool: string; resource?: { type: string; id: string }; at: string };

const issuer = 'http://id.acme.localhost:8180/realms/acme';
export const subjectIssuer = issuer;

export const decisions: ProtoDecision[] = [
  { id: 'd1', outcome: 'would_deny', reason: 'No grant for this tool', agent: 'issues-manager', mode: 'report_only', subject: 'Júlia Mendes', group: 'Developer', server: 'Acme Issues', tool: 'merge_pull_request', at: '2026-11-04T18:05:00Z' },
  { id: 'd2', outcome: 'allow', agent: 'issues-manager', mode: 'report_only', subject: 'Lucas Ferreira', group: 'Product Manager', server: 'Acme Issues', tool: 'move_issue', at: '2026-11-04T18:01:00Z' },
  { id: 'd3', outcome: 'would_deny', reason: 'A call rule is false', agent: 'refunds-assistant', mode: 'report_only', subject: 'Rafael Souza', group: 'Finance', server: 'Acme Billing', tool: 'refund_order', resource: { type: 'refund_order_order_id', id: 'ORD-88213' }, at: '2026-11-04T17:42:00Z' },
  { id: 'd4', outcome: 'deny', reason: 'Resource not granted', agent: 'support-assistant', mode: 'enforce', subject: 'Pedro Lima', group: 'Support', server: 'Acme Helpdesk', tool: 'close_ticket', resource: { type: 'ticket_queue', id: 'tier-2' }, at: '2026-11-04T17:38:00Z' },
  { id: 'd5', outcome: 'allow', agent: 'refunds-assistant', mode: 'report_only', subject: 'Marina Alves', group: 'Support Lead', server: 'Acme Billing', tool: 'get_order', resource: { type: 'refund_order_order_id', id: 'ORD-88190' }, at: '2026-11-04T17:31:00Z' },
  { id: 'd6', outcome: 'would_deny', reason: 'No grant for this tool', agent: 'issues-manager', mode: 'report_only', subject: 'Lucas Ferreira', group: 'Product Manager', server: 'Acme Issues', tool: 'merge_pull_request', at: '2026-11-04T17:12:00Z' },
];

export type ProtoInboxItem = { id: string; kind: 'report-only' | 'review-due' | 'requests-denied' | 'tool-discovery'; subject: string; note: string; context: string; secondary?: string; at: string; target: string };

export const inbox: ProtoInboxItem[] = [
  { id: 'i0', kind: 'review-due', subject: 'issues-manager is still in Report-only', note: 'Its review date was Nov 3. Enforce access, or set a new date.', context: 'issues-manager · Report-only since Nov 3', secondary: '28 calls would be denied in the last 24 hours', at: '2026-11-04T00:00:00Z', target: 'Review' },
  { id: 'i1', kind: 'report-only', subject: 'issues-manager would be denied on merge_pull_request', note: 'Report-only agent: 14 calls ran that its policy denies, in this hour.', context: 'Acme Issues · merge_pull_request', secondary: 'No grant for this tool · 2 people', at: '2026-11-04T18:05:00Z', target: 'Investigate' },
  { id: 'i2', kind: 'requests-denied', subject: 'support-assistant denied on close_ticket', note: '3 denied calls in this hour.', context: 'Acme Helpdesk · close_ticket', secondary: 'Resource not granted', at: '2026-11-04T17:38:00Z', target: 'Investigate' },
  { id: 'i3', kind: 'report-only', subject: 'refunds-assistant would be denied on refund_order', note: 'Report-only agent: 9 calls ran that its policy denies, in this hour.', context: 'Acme Billing · refund_order', secondary: 'A call rule is false · amount <= 500', at: '2026-11-04T17:42:00Z', target: 'Investigate' },
];

export const overview = { callsToday: 1284, deniedToday: 41, deniedYesterday: 38, wouldDenyToday: 37 };

// A mode change is an event, not a revision: its revision is 0 and is never shown.
export type ProtoRevision = { revision: number; kind: 'publish' | 'mode'; mode?: Mode; reviewBy?: string; by: string; at: string; note?: string; effective?: boolean };

export const revisions: ProtoRevision[] = [
  { revision: 0, kind: 'mode', mode: 'report_only', reviewBy: '2026-11-09', by: 'Beatriz Nunes', at: '2026-11-02T14:10:00Z', note: 'Pilot with the Finance team before we block refunds.' },
  { revision: 12, kind: 'publish', by: 'Beatriz Nunes', at: '2026-11-02T13:58:00Z', note: 'Refunds up to 500 without approval.', effective: true },
  { revision: 9, kind: 'publish', by: 'Beatriz Nunes', at: '2026-10-31T10:20:00Z', note: 'First publication.' },
];

export const overdue = (a: ProtoAgent) => a.mode === 'report_only' && !!a.reviewBy && a.reviewBy < TODAY;
export const day = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en', { timeZone: 'UTC', month: 'short', day: 'numeric' });

export const utc = (at: string) => new Date(at).toLocaleString('en', { timeZone: 'UTC', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' UTC';
