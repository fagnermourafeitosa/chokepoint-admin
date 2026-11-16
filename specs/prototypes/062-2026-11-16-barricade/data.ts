// Admin 062 prototype: fixed Barricade settings of the Acme workspace. Each environment has its own
// setting (Backend 101), created with the market defaults of Backend 099; Production was tuned once.
export type Key = 'learning_days' | 'pattern_days' | 'known_days' | 'spike_factor' | 'spike_floor';

export const heuristics: { key: Key; label: string; unit: string; help: string }[] = [
  { key: 'learning_days', label: 'Learning period', unit: 'days', help: 'No drift signal until an agent has this much history.' },
  { key: 'pattern_days', label: 'Pattern period', unit: 'days', help: 'The calls that each hour is compared with. At most the trace retention, 30 days.' },
  { key: 'known_days', label: 'Known after', unit: 'distinct days', help: 'A tool or an order of calls joins the pattern after it appears on this many days.' },
  { key: 'spike_factor', label: 'Spike factor', unit: '× the busiest hour', help: 'The calls of a tool in one hour above this multiple of its busiest hour in the pattern.' },
  { key: 'spike_floor', label: 'Spike floor', unit: 'calls in an hour', help: 'Fewer calls than this in an hour never count as a spike.' },
];

export const workspaces = [{ value: 'acme', label: 'Acme' }];
export const environments = [{ value: 'production', label: 'Production' }, { value: 'sandbox', label: 'Sandbox' }];

export const settings: Record<string, { values: Record<Key, number>; updated: string }> = {
  production: { values: { learning_days: 7, pattern_days: 30, known_days: 2, spike_factor: 5, spike_floor: 30 }, updated: 'Changed by Beatriz Nunes (beatriz@acme.test) on 2026-11-16 14:02 UTC' },
  sandbox: { values: { learning_days: 7, pattern_days: 30, known_days: 2, spike_factor: 5, spike_floor: 20 }, updated: 'Market defaults since the environment was created on 2026-11-10' },
};

export const history: Record<string, { when: string; who: string; change: string }[]> = {
  production: [
    { when: '2026-11-16 14:02 UTC', who: 'Beatriz Nunes', change: 'Spike floor 20 → 30' },
    { when: '2026-11-10 09:15 UTC', who: 'Platform', change: 'Created with the market defaults' },
  ],
  sandbox: [
    { when: '2026-11-10 09:15 UTC', who: 'Platform', change: 'Created with the market defaults' },
  ],
};

// The security modules of Barricade. Behavior drift is the first; the rail grows with each new module.
export const modules = [
  { key: 'behavior-drift', label: 'Behavior drift', detail: 'Agents that leave their usage pattern' },
];

// The anomalies that behavior drift detects (Backend 099), in security terms.
export const anomalies = [
  { key: 'spike', label: 'Usage spike', detail: 'Far more calls of a tool than usual in one hour.' },
  { key: 'new-tool', label: 'First use of a tool', detail: 'A granted tool that the agent never called in the period.' },
  { key: 'new-sequence', label: 'Unusual call sequence', detail: 'Two consecutive calls in an order never seen for the agent.' },
];

// Alert puts a signal in the Inbox; the external apps that the workspace configured deliver it.
export const actions = [
  { value: 'alert', label: 'Alert · signal in the Inbox' },
  { value: 'suspend-tool', label: 'Suspend the tool for this agent · until an administrator restores it' },
  { value: 'disable-agent', label: 'Disable the agent · kill switch' },
];
