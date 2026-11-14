import type { UsageOperator, UsageRecord } from './api';

// Admin 054: the limit lines of a rule. A limit is a usage definition of Backend 087: it reads the
// earlier calls of the agent to this tool in a rolling window, and the rule compares its value.
// The operator names are the Dogwood names written with _ (Backend 087 Implementation Decision 1).

export type WindowUnit = 'minutes' | 'hours';
// compare and limit belong to the CEL of the rule, not to the usage definition: they are kept here
// so that one limit line edits both.
export type Usage = {
  id: string;
  operator: UsageOperator;
  argument?: string;
  key?: string;
  windowValue: number;
  windowUnit: WindowUnit;
  tool?: string;
  anchorTool?: string;
  match?: { argument: string; toolArgument: string };
  compare?: 'le' | 'lt';
  limit?: string;
};

// What each operator reads, in the words of the editor (Admin 054 item 2).
export const operators: { id: UsageOperator; help: string }[] = [
  { id: 'sum', help: 'The total of an integer parameter, including this call.' },
  { id: 'count_calls', help: 'The number of allowed calls of this tool that did not fail, including this call.' },
  { id: 'count_distinct', help: 'The number of different arguments of a parameter, including this call.' },
  { id: 'formerly_within', help: 'True when another tool of this server was called with the same argument and did not fail.' },
  { id: 'since_within', help: 'True when a watched tool was called after the latest call of an anchor tool with the same argument.' },
];

// Help texts (Admin 054 items 4, 5 and 12).
export const limitHelp = 'A limit reads the earlier calls of this agent to this tool in a rolling window, and allows the call only while the total stays within the value you set.';
export const keyHelp = 'Per separates one total from another. Per customer_id: each customer has their own total, for example at most 100000 per customer per day, so customer A and customer B each get 100000. All calls: one total for every call of this agent to this tool, for example at most 500000 in refunds per day, across all customers.';
export const windowHelp = 'A rolling window: a call counts until it is older than the window. Nothing resets at midnight.';
export const ofHelp = 'Only integer parameters, for example an amount in cents. A call without this argument, or with zero or a negative number, is denied as a rule that is not met, not as a reached limit.';
export const howLimitsCount = [
  'A call counts from the moment it is allowed, so calls at the same time see each other.',
  'A call that fails does not count. A call without an answer keeps counting until it leaves the window.',
  'A call over the limit is denied with the reason reach_limit. For an agent in Report-only, the call runs, counts and is recorded as would deny.',
  'Each agent has its own totals: two agents together can go over the same limit.',
  'Saving a change to this rule starts its totals from zero.',
];
export const formerlyRisk = (tool: string, argument: string) => `formerly_within checks only that ${tool} was called with the same ${argument} and did not fail. It does not read what ${tool} returned. A call that returned a refusal still counts.`;

export const numericOperator = (op: UsageOperator) => op === 'sum' || op === 'count_calls' || op === 'count_distinct';

// The window is at most 24 hours (Backend 087 Implementation Decision 7): the field keeps it within.
export const windowMax = (unit: WindowUnit) => (unit === 'hours' ? 24 : 1440);
export const clampWindow = (value: number, unit: WindowUnit) => (Number.isFinite(value) && value > 0 ? Math.min(Math.round(value), windowMax(unit)) : 0);
const windowSeconds = (u: Usage) => u.windowValue * (u.windowUnit === 'hours' ? 3600 : 60);

// A limit line is complete when the backend can accept it and the CEL has a value.
export function limitComplete(u: Usage) {
  if (u.windowValue < 1 || u.windowValue > windowMax(u.windowUnit)) return false;
  if ((u.operator === 'sum' || u.operator === 'count_distinct') && !u.argument) return false;
  if (numericOperator(u.operator)) return /^[1-9]\d*$/.test(u.limit ?? '');
  if (!u.tool || !u.match?.argument || !u.match.toolArgument) return false;
  return u.operator !== 'since_within' || !!u.anchorTool;
}

export function usageToRecord(u: Usage): UsageRecord {
  const record: UsageRecord = { id: u.id, operator: u.operator, window_seconds: windowSeconds(u) };
  if (u.operator === 'sum' || u.operator === 'count_distinct') record.argument = u.argument;
  if ((u.operator === 'sum' || u.operator === 'count_calls') && u.key) record.key = u.key;
  if (u.operator === 'formerly_within' || u.operator === 'since_within') {
    record.tool = u.tool;
    if (u.match) record.match = { argument: u.match.argument, tool_argument: u.match.toolArgument };
  }
  if (u.operator === 'since_within') record.anchor_tool = u.anchorTool;
  return record;
}

export function usageFromRecord(r: UsageRecord): Usage {
  const hours = r.window_seconds % 3600 === 0;
  return {
    id: r.id, operator: r.operator, argument: r.argument, key: r.key, tool: r.tool, anchorTool: r.anchor_tool,
    windowValue: hours ? r.window_seconds / 3600 : Math.round(r.window_seconds / 60), windowUnit: hours ? 'hours' : 'minutes',
    match: r.match ? { argument: r.match.argument, toolArgument: r.match.tool_argument } : undefined,
  };
}

const usageCel = (id: string) => `context.chokepoint.usage[${JSON.stringify(id)}].value`;

// The CEL of one limit line. A number compares with the limit; formerly_within must be true;
// since_within must be false (no watched call since the anchor). The usage value is dynamic in CEL and
// the backend accepts only a boolean expression, so formerly_within compares with true.
export function limitCel(u: Usage) {
  if (numericOperator(u.operator)) return `${usageCel(u.id)} ${u.compare === 'lt' ? '<' : '<='} ${u.limit || '0'}`;
  return u.operator === 'since_within' ? `!${usageCel(u.id)}` : `${usageCel(u.id)} == true`;
}

const unitLabel = (u: Usage) => (u.windowValue === 1 ? u.windowUnit.slice(0, -1) : u.windowUnit);

// The "Reads as" part of one limit line (Admin 054 item 7).
export function limitSentence(u: Usage, tool: string) {
  const window = `in the last ${u.windowValue || '…'} ${unitLabel(u)}`;
  const per = u.key ? ` per ${u.key}` : '';
  const same = u.match?.argument ? ` with the same ${u.match.argument}` : '';
  const is = `is ${u.compare === 'lt' ? 'less than' : 'at most'} ${u.limit || '…'}`;
  switch (u.operator) {
    case 'sum': return `sum of ${u.argument ?? '…'}${per} ${window} ${is}`;
    case 'count_calls': return `count_calls of ${tool}${per} ${window} ${is}`;
    case 'count_distinct': return `count_distinct of ${u.argument ?? '…'} ${window} ${is}`;
    case 'formerly_within': return `formerly_within ${u.tool ?? '…'} ${window}${same}`;
    case 'since_within': return `no ${u.tool ?? '…'} since ${u.anchorTool ?? '…'} ${window}${same}`;
  }
}

const usageClause = /^(!?)context\.chokepoint\.usage\["([^"\\]+)"\]\.value(?: (<=|<) ([1-9]\d*)| (== true))?$/;

// The inverse of limitCel for a saved rule (Admin 049 item 14): the limit line of one CEL clause,
// or undefined when the clause is not a limit that this rule declares.
export function celLimit(text: string, usage: Usage[]): Usage | undefined {
  const m = usageClause.exec(text);
  const u = m && usage.find(x => x.id === m[2]);
  if (!m || !u) return undefined;
  const negated = m[1] === '!', compared = !!m[3], isTrue = !!m[5];
  if (numericOperator(u.operator)) return !negated && compared ? { ...u, compare: m[3] === '<' ? 'lt' : 'le', limit: m[4] } : undefined;
  if (compared) return undefined;
  if (u.operator === 'since_within') return negated && !isTrue ? u : undefined;
  return !negated && isTrue ? u : undefined;
}
