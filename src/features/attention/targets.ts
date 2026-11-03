import type { Signal } from './api';
import { exchangeText } from '../investigate/labels';
import type { ExchangeReasonLabel } from '../investigate/types';
import { actionPath } from '../access/target-context';
export function targetPath(signal: Signal): string | undefined {
  if (signal.target_route === 'decision-detail') {
    const p = signal.target_params;
    if (!p.server_id || !p.tool || !p.agent || !p.reason || !p.window_start) return `/investigate?${new URLSearchParams({ signal_id: signal.id, return_to: '/' })}`;
    return `/investigate?${new URLSearchParams({ server_id: p.server_id, tool: p.tool, agent: p.agent, reason: p.reason, window_start: p.window_start, signal_id: signal.id, return_to: '/' })}`;
  }
  // A denied token exchange opens the Token exchanges view with its filters
  // (Backend 034 Admin contract item 3). The subject is searched as text: the
  // signal names the subject without its issuer.
  if (signal.target_route === 'token-exchanges') {
    const p = signal.target_params;
    const query = new URLSearchParams({ view: 'exchanges', signal_id: signal.id, return_to: '/' });
    for (const key of ['agent_id', 'reason', 'from', 'to'] as const) if (p[key]) query.set(key, p[key]);
    if (p.subject) query.set('q', p.subject);
    return `/investigate?${query}`;
  }
  if (signal.target_route === 'tool-catalog') {
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
    // The count and the detail text of the reason, then the agent and, for an
    // expired or invalid subject token, the subject (Admin 030 section 5). The
    // agent name comes from Backend 041; the ID stays for a deleted agent (Admin 033).
    // The subject name comes from Backend 043; the raw subject stays without it (Admin 035).
    case 'token_exchange_denied': return [[c.count ? `${c.count} refused` : '', exchangeText[c.reason as ExchangeReasonLabel] || c.reason || ''].filter(Boolean).join(' · '), [c.agent_name || c.agent, c.subject ? `for ${c.subject_name || c.subject}` : ''].filter(Boolean).join(' ')];
    default: return ['', ''];
  }
}
