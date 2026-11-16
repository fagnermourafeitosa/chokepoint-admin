// Admin 062 prototype: fixed Barricade settings of the Acme workspace, with the defaults of Backend 099.
export const heuristics = [
  { key: 'learning', label: 'Learning period', value: 7, unit: 'days', help: 'No drift signal until an agent has this much history.' },
  { key: 'pattern', label: 'Pattern period', value: 30, unit: 'days', help: 'The calls that each hour is compared with. At most the trace retention, 30 days.' },
  { key: 'known', label: 'Known after', value: 2, unit: 'distinct days', help: 'A tool or an order of calls joins the pattern after it appears on this many days.' },
  { key: 'factor', label: 'Spike factor', value: 5, unit: '× the busiest hour', help: 'The calls of a tool in one hour above this multiple of its busiest hour in the pattern.' },
  { key: 'floor', label: 'Spike floor', value: 20, unit: 'calls in an hour', help: 'Fewer calls than this in an hour never count as a spike.' },
];

export const departures = [
  { key: 'spike', label: 'Spike', detail: 'Far more calls of a tool than usual in one hour.' },
  { key: 'new-tool', label: 'New tool', detail: 'A granted tool that the agent never called in the period.' },
  { key: 'new-sequence', label: 'New sequence', detail: 'Two consecutive calls in an order never seen for the agent.' },
];

export const responses = [
  { value: 'alert', label: 'Alert · Inbox and Slack' },
  { value: 'suspend-tool', label: 'Suspend the tool for the agent · until an administrator restores it' },
  { value: 'disable-agent', label: 'Disable the agent · the kill switch' },
];

// The workspaces where the signed-in person is Admin.
export const workspaces = [{ value: 'acme', label: 'Acme · Sandbox and Production' }];
