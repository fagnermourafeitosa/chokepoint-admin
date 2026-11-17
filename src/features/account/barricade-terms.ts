import type { Anomaly, BarricadeResponse, BarricadeSetting, Heuristic } from './barricade-api';

// The detection window of Backend 099 (hotfix 2026-11-16): the period that each check compares with the pattern.
export const detectionWindow = { label: 'Detection window', unit: 'hours', help: 'Each check reads this many hours of calls and compares them with periods of the same length in the pattern. From 1 to 24.' };
export const windowHours = (hours: number) => `${hours} ${hours === 1 ? 'hour' : 'hours'}`;

// Admin 062: the names of the Barricade setting in security terms, shared by the editor and the history.
export const heuristics: { key: Heuristic; label: string; unit: string; help: string }[] = [
  { key: 'learning_days', label: 'Learning period', unit: 'days', help: 'No drift signal until an agent has this much history.' },
  { key: 'pattern_days', label: 'Pattern period', unit: 'days', help: 'The calls that each detection window is compared with. At most the trace retention.' },
  { key: 'known_days', label: 'Known after', unit: 'distinct days', help: 'A tool or an order of calls joins the pattern after it appears on this many days.' },
  { key: 'spike_factor', label: 'Spike factor', unit: '× the busiest window', help: 'The calls of a tool in one detection window above this multiple of its busiest window in the pattern.' },
  { key: 'spike_floor', label: 'Spike floor', unit: 'calls in a window', help: 'Fewer calls than this in one detection window never count as a spike.' },
];

export const anomalies: { key: Anomaly; label: string; detail: string }[] = [
  { key: 'spike', label: 'Usage spike', detail: 'Far more calls of a tool than usual in one detection window.' },
  { key: 'new_tool', label: 'First use of a tool', detail: 'A granted tool that the agent never called in the period.' },
  { key: 'new_sequence', label: 'Unusual call sequence', detail: 'Two consecutive calls in an order never seen for the agent.' },
];

// Alert puts a signal in the Inbox; the external apps that the workspace configured deliver it.
export const responses: { value: BarricadeResponse; label: string; short: string }[] = [
  { value: 'alert', label: 'Alert · signal in the Inbox', short: 'Alert' },
  { value: 'suspend_tool', label: 'Suspend the tool for this agent · until an administrator restores it', short: 'Suspend the tool' },
  { value: 'disable_agent', label: 'Disable the agent · kill switch', short: 'Disable the agent' },
];

// fieldLabel names a field that the backend refused (Backend 101, Implementation Decision 5).
export function fieldLabel(field: string | undefined) {
  if (field?.includes('detection_window')) return detectionWindow.label;
  const key = field?.split('.').pop();
  return heuristics.find(h => h.key === key)?.label ?? anomalies.find(a => a.key === key)?.label;
}

// utc shows an RFC 3339 instant as "2026-11-16 14:02 UTC".
export const utc = (value: string) => `${value.slice(0, 10)} ${value.slice(11, 16)} UTC`;

// describeChange lists what a change altered, as "Spike floor 20 → 30".
export function describeChange(before: BarricadeSetting | null, after: BarricadeSetting): string[] {
  if (!before) return ['Created with the market defaults'];
  const was = before.behavior_drift;
  const now = after.behavior_drift;
  const short = (value: BarricadeResponse) => responses.find(r => r.value === value)?.short ?? value;
  const lines: string[] = [];
  // An entry saved before the window existed has none: it reads as unchanged.
  if (was.detection_window && now.detection_window && was.detection_window.length !== now.detection_window.length) {
    lines.push(`${detectionWindow.label} ${windowHours(was.detection_window.length)} → ${windowHours(now.detection_window.length)}`);
  }
  lines.push(...heuristics.filter(h => was[h.key] !== now[h.key]).map(h => `${h.label} ${was[h.key]} → ${now[h.key]}`));
  for (const a of anomalies) {
    if (was.responses[a.key] !== now.responses[a.key]) lines.push(`${a.label}: ${short(was.responses[a.key])} → ${short(now.responses[a.key])}`);
  }
  return lines.length ? lines : ['Saved with no change'];
}
