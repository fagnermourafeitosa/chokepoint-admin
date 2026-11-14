// Admin 054 prototype: fixed data, invented for the layout (specs/prototypes/README.md).
// refunds-assistant · Acme Billing · refund_order. The demo refund_order has no customer_id and a
// decimal amount; this data adds customer_id and an integer amount (cents) so that sum applies.

export type Param = { name: string; type: 'integer' | 'number' | 'string' };

export const tool = 'refund_order';
export const params: Param[] = [
  { name: 'order_id', type: 'string' },
  { name: 'customer_id', type: 'string' },
  { name: 'amount', type: 'integer' },
  { name: 'reason', type: 'string' },
];

// The other tools of Acme Billing, for formerly_within and since_within.
export const serverTools: Record<string, Param[]> = {
  get_order: [{ name: 'order_id', type: 'string' }],
  list_refunds: [{ name: 'order_id', type: 'string' }],
};

export type Operator = 'sum' | 'count_calls' | 'count_distinct' | 'formerly_within' | 'since_within';

// What each operator reads, in the words of the editor.
export const operators: { id: Operator; help: string }[] = [
  { id: 'sum', help: 'The total of an integer parameter, including this call.' },
  { id: 'count_calls', help: 'The number of allowed calls of this tool that did not fail, including this call.' },
  { id: 'count_distinct', help: 'The number of different arguments of a parameter, including this call.' },
  { id: 'formerly_within', help: 'True when another tool of this server was called with the same argument and did not fail.' },
  { id: 'since_within', help: 'True when a watched tool was called after the latest call of an anchor tool with the same argument.' },
];

export type Usage = {
  id: string;
  operator: Operator;
  argument?: string;
  key?: string;
  windowValue: number;
  windowUnit: 'minutes' | 'hours';
  tool?: string;
  anchorTool?: string;
  match?: { argument: string; toolArgument: string };
  compare?: 'le' | 'lt';
  limit?: string;
};

export const saved: { id: string; name: string; sentence: string; draft?: boolean }[] = [
  { id: 'r1', name: 'Refund up to $500', sentence: 'amount is at most 50000' },
  { id: 'r2', name: 'Daily refunds per customer', sentence: 'sum of amount per customer_id in the last 24 hours is at most 100000', draft: true },
  { id: 'r3', name: 'Look at the order first', sentence: 'formerly_within get_order in the last 1 hour with the same order_id', draft: true },
];

export const newRule: Usage[] = [
  { id: 'u1', operator: 'count_calls', key: 'customer_id', windowValue: 1, windowUnit: 'hours', compare: 'le', limit: '10' },
];

export const keyHelp = 'Per separates one total from another. Per customer_id: each customer has their own total, for example at most 100000 per customer per day, so customer A and customer B each get 100000. All calls: one total for every call of this agent to this tool, for example at most 500000 in refunds per day, across all customers.';
export const windowHelp = 'A rolling window of at most 24 hours: a call counts until it is older than the window. Nothing resets at midnight.';
export const formerlyRisk = 'formerly_within checks only that get_order was called with the same order_id and did not fail. It does not read what get_order returned.';
