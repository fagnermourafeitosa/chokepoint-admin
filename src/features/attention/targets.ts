import type { Signal } from './api';
import { actionPath } from '../access/target-context';
export function targetPath(signal: Signal): string | undefined {
  if (signal.target_route === 'decision-detail') {
    const p = signal.target_params;
    if (!p.server_id || !p.tool || !p.agent || !p.reason || !p.window_start) return `/investigate?${new URLSearchParams({ signal_id: signal.id, return_to: '/' })}`;
    return `/investigate?${new URLSearchParams({ server_id: p.server_id, tool: p.tool, agent: p.agent, reason: p.reason, window_start: p.window_start, signal_id: signal.id, return_to: '/' })}`;
  }
  if (signal.target_route === 'tool-catalog' || signal.target_route === 'person-detail') {
    const path = actionPath({ label: signal.target_label, route: signal.target_route, params: signal.target_params, available: true }, signal.id, '/');
    return path;
  }
  return undefined;
}
function discoveryCounts(c: Record<string, string>): string {
  return [Number(c.changed) > 0 ? `${c.changed} changed` : '', Number(c.removed) > 0 ? `${c.removed} removed` : ''].filter(Boolean).join(' · ');
}
export function contextLines(signal: Signal): [string, string] {
  const c = signal.context;
  switch (signal.type) {
    case 'tool-discovery': return [c.tool || c.server || '', c.tool ? c.server || '' : discoveryCounts(c)];
    case 'requests-denied': return [c.tool || '', c.agent_name || c.agent || ''];
    case 'idp-user-disable': return [signal.principal?.name || signal.principal?.subject || c.subject || '', c.groups || c.agent || ''];
    default: return ['', ''];
  }
}
