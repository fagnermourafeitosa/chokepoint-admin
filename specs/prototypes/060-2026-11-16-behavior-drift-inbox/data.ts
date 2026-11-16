// Admin 060 prototype: fixed data of the Acme Production Inbox on 2026-11-16, with the four
// Behavior drift cases of Backend 099 next to two existing signal types for comparison.
export type Departure = 'spike' | 'new-tool' | 'new-sequence';
export type Item = {
  id: string; severity: 'high' | 'medium' | 'low'; type: string; label: string; drift?: Departure;
  subject: string; note: string; primary: string; secondary: string; when: string; status: string; action: string;
};

export const items: Item[] = [
  { id: 'd1', severity: 'high', type: 'behavior-drift', label: 'Behavior drift', drift: 'new-tool',
    subject: 'support-triage called export_customers for the first time',
    note: 'No agent in this environment called this tool in the period.',
    primary: 'export_customers', secondary: 'support-triage · 3 calls · 1 person', when: '2026-11-16 14:00 UTC', status: 'Open', action: 'Investigate' },
  { id: 'd2', severity: 'high', type: 'behavior-drift', label: 'Behavior drift', drift: 'new-tool',
    subject: 'refunds-assistant called send_receipt for the first time',
    note: 'The tool was granted, but this agent never called it in the period. The tool is high in Sends data out. Other agents have call conditions on this tool; this one has none.',
    primary: 'send_receipt', secondary: 'refunds-assistant · 1 call · 1 person', when: '2026-11-16 13:00 UTC', status: 'Open', action: 'Investigate' },
  { id: 't1', severity: 'high', type: 'lethal-trifecta', label: 'Lethal trifecta',
    subject: 'Lethal trifecta closed', note: 'A session read private data, took in untrusted content and sent data out.',
    primary: 'reply_ticket', secondary: 'support-triage · 2 calls · 1 person', when: '2026-11-16 12:00 UTC', status: 'Reviewed', action: 'Open agent' },
  { id: 'd3', severity: 'medium', type: 'behavior-drift', label: 'Behavior drift', drift: 'spike',
    subject: 'support-triage called get_order far more than usual',
    note: '240 calls in this hour; its pattern never passed 15 in an hour.',
    primary: 'get_order', secondary: 'support-triage · 240 calls · 2 people', when: '2026-11-16 14:00 UTC', status: 'Open', action: 'Investigate' },
  { id: 'd4', severity: 'medium', type: 'behavior-drift', label: 'Behavior drift', drift: 'new-sequence',
    subject: 'support-triage chained get_order → export_customers for the first time',
    note: 'This order of calls was never seen for this agent.',
    primary: 'get_order → export_customers', secondary: 'support-triage · 1 person', when: '2026-11-16 14:00 UTC', status: 'Open', action: 'Investigate' },
  { id: 'r1', severity: 'low', type: 'requests-denied', label: 'Requests denied',
    subject: 'Requests denied', note: 'Calls of this agent were denied.',
    primary: 'refund_order', secondary: 'refunds-assistant', when: '2026-11-16 11:00 UTC', status: 'Open', action: 'Investigate' },
];

// The Slack signal types of Admin 059, with Behavior drift added off by default (Backend 099).
export const slackChoices = [
  { type: 'requests-denied', label: 'Requests denied', description: 'Calls were denied, grouped by server, tool and agent for each hour.', on: true },
  { type: 'tool-discovery', label: 'Tool discovery', description: 'A discovery found new or changed tools that wait for review.', on: true },
  { type: 'mcpserver_disconnected', label: 'Server disconnected', description: 'An automatic rediscovery could not reach an MCP server.', on: true },
  { type: 'token_exchange_denied', label: 'Token exchange denied', description: 'A token exchange for an agent was denied.', on: false },
  { type: 'report-only-would-deny', label: 'Would deny', description: 'An agent in Report-only made calls that would be denied.', on: false },
  { type: 'report-only-review-due', label: 'Review due', description: 'The review date of an agent in Report-only has passed.', on: false },
  { type: 'lethal-trifecta', label: 'Lethal trifecta', description: 'A session of an agent read private data, took in untrusted content and sent data out.', on: false },
  { type: 'behavior-drift', label: 'Behavior drift', description: 'An agent left its usage pattern: a tool it never called, an order of calls never seen, or far more calls than usual.', on: false, isNew: true },
];
