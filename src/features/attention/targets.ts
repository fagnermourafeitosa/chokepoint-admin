import type { Signal } from './api';
import { denyText, exchangeText } from '../investigate/labels';
import type { ReasonLabel } from '../investigate/types';
import { reviewDay } from '../../components/report-only/ReportOnlyChip';
import type { ExchangeReasonLabel } from '../investigate/types';
import { actionPath } from '../access/target-context';
import { legs } from '../mcp/trifecta';
export function targetPath(signal: Signal): string | undefined {
  // Backend 057: would-deny calls are decisions, not a problem: open them in
  // All decisions, filtered on the agent, the tool and the closed hour.
  if (signal.type === 'report-only-would-deny') {
    const p = signal.target_params;
    const query = new URLSearchParams({ view: 'decisions', result: 'would_deny', return_to: '/' });
    if (p.agent) query.set('agent', p.agent);
    if (p.server_id && p.tool) { query.set('server_id', p.server_id); query.set('tool', p.tool); }
    if (p.window_start) {
      const from = new Date(p.window_start);
      query.set('from', from.toISOString());
      query.set('to', new Date(from.getTime() + 3600000).toISOString());
    }
    return `/investigate?${query}`;
  }
  // Backend 099: a Behavior drift opens the calls of the agent and tool in its hour (Admin 060 decision 6), or the
  // agent in Access when a response suspended the tool or disabled the agent (decision 9).
  if (signal.type === 'behavior-drift') {
    const p = signal.target_params;
    if (signal.target_route === 'permissions') return p.agent_id ? `/access?${new URLSearchParams({ agent_id: p.agent_id, return_to: '/' })}` : undefined;
    if (!p.agent || !p.server_id || !p.tool || !p.window_start) return undefined;
    // The detection window is configured per environment (hotfix of Backend 099); its end comes with the signal.
    const from = new Date(p.window_start);
    const to = p.window_end ? new Date(p.window_end) : new Date(from.getTime() + 3600000);
    return `/investigate?${new URLSearchParams({ view: 'decisions', agent: p.agent, server_id: p.server_id, tool: p.tool,
      from: from.toISOString(), to: to.toISOString(), return_to: '/' })}`;
  }
  // Backend 097: a closed lethal trifecta opens the agent in Access, where its servers and tools are
  // granted; the calls were allowed, so there is nothing to investigate as a deny (user, 2026-11-16).
  if (signal.type === 'lethal-trifecta' && signal.target_params.agent_id) {
    return `/access?${new URLSearchParams({ agent_id: signal.target_params.agent_id, return_to: '/' })}`;
  }
  // The review date of the mode passed: open the agent (Backend 057).
  if (signal.type === 'report-only-review-due' && signal.target_params.agent_id) {
    return `/access?${new URLSearchParams({ agent_id: signal.target_params.agent_id, return_to: '/' })}`;
  }
  if (signal.target_route === 'decision-detail') {
    const p = signal.target_params;
    // A historical item without a reason-qualified problem has no target (Backend 024 decision 7).
    if (!p.server_id || !p.tool || !p.agent || !p.reason || !p.window_start) return undefined;
    return `/investigate?${new URLSearchParams({ server_id: p.server_id, tool: p.tool, agent: p.agent, reason: p.reason, window_start: p.window_start, return_to: '/' })}`;
  }
  // A denied token exchange opens the Token exchanges view with its filters
  // (Backend 034 Admin contract item 3). The subject is searched as text: the
  // signal names the subject without its issuer.
  if (signal.target_route === 'token-exchanges') {
    const p = signal.target_params;
    const query = new URLSearchParams({ view: 'exchanges', return_to: '/' });
    for (const key of ['agent_id', 'reason', 'from', 'to'] as const) if (p[key]) query.set(key, p[key]);
    if (p.subject) query.set('q', p.subject);
    return `/investigate?${query}`;
  }
  if (signal.target_route === 'tool-catalog') {
    const path = actionPath({ label: signal.target_label, route: signal.target_route, params: signal.target_params, available: true }, '/');
    // A tool discovery opens the review page of its server, at the first tool that needs a decision
    // (Admin 055, decision 5); every server target opens its review page (Admin 057, decision 8).
    return path;
  }
  return undefined;
}
const disconnectedText: Record<string, string> = {
  unreachable: 'No answer from the server',
  authentication: 'The server refused the credentials',
};
function discoveryCounts(c: Record<string, string>): string {
  return [Number(c.changed) > 0 ? `${c.changed} changed` : '', Number(c.removed) > 0 ? `${c.removed} removed` : ''].filter(Boolean).join(' · ');
}
export function contextLines(signal: Signal): [string, string] {
  const c = signal.context;
  switch (signal.type) {
    case 'tool-discovery': return [c.tool || c.server || '', c.tool ? c.server || '' : discoveryCounts(c)];
    case 'requests-denied': return [c.tool || '', (c.agent_name || c.agent || '') + (c.agent_status === 'deleted' ? ' (deleted)' : '')];
    // The count and the detail text of the reason, then the agent and, for an
    // expired or invalid subject token, the subject (Admin 030 section 5). The
    // agent name comes from Backend 041; the ID stays for a deleted agent (Admin 033).
    // The subject name comes from Backend 043; the raw subject stays without it (Admin 035).
    // A deleted agent keeps its signal: something still uses its key (Backend 038, Admin 032 section 7).
    case 'token_exchange_denied': return c.agent_status === 'deleted'
      ? [[c.count ? `${c.count} refused` : '', 'This agent was deleted, but something still uses its key. Find and stop the deployment that uses it.'].filter(Boolean).join(' · '), `${c.agent_name || c.agent} (deleted)`]
      : [[c.count ? `${c.count} refused` : '', exchangeText[c.reason as ExchangeReasonLabel] || c.reason || ''].filter(Boolean).join(' · '), [c.agent_name || c.agent, c.subject ? `for ${c.subject_name || c.subject}` : ''].filter(Boolean).join(' ')];
    // Admin 041: the context of the Report-only signals.
    case 'report-only-would-deny': return [c.tool || '', [denyText[c.reason as ReasonLabel] || c.reason || '', c.people ? `${c.people} ${c.people === '1' ? 'person' : 'people'}` : ''].filter(Boolean).join(' · ')];
    case 'report-only-review-due': return [c.agent_name || c.agent || '', c.review_by ? `Review date ${reviewDay(c.review_by)}` : ''];
    // Admin 058 item 13: the tool, then the agent and how many calls and people closed the trifecta.
    case 'lethal-trifecta': return [c.tool || '', [
      (c.agent_name || c.agent || '') + (c.agent_status === 'deleted' ? ' (deleted)' : ''),
      c.count ? `${c.count} ${c.count === '1' ? 'call' : 'calls'}` : '',
      c.people ? `${c.people} ${c.people === '1' ? 'person' : 'people'}` : '',
    ].filter(Boolean).join(' · ')];
    // Admin 060 decision 4: the tool (the pair of a new sequence), then the agent, the calls and the people.
    case 'behavior-drift': return [c.tool || '', [
      (c.agent_name || c.agent || '') + (c.agent_status === 'deleted' ? ' (deleted)' : ''),
      c.count ? `${c.count} ${c.count === '1' ? 'call' : 'calls'}` : '',
      c.people ? `${c.people} ${c.people === '1' ? 'person' : 'people'}` : '',
    ].filter(Boolean).join(' · ')];
    // Backend 088: the server and why the rediscovery failed.
    case 'mcpserver_disconnected': return [c.server || '', c.reason ? disconnectedText[c.reason] ?? c.reason : ''];
    default: return ['', ''];
  }
}

// subjectLine and noteLine say what a Report-only signal means in words (Admin
// 041 section 5); other types keep the stored subject and the enriched note.
export function subjectLine(signal: Signal): string {
  const agent = signal.context.agent_name || signal.context.agent || 'An agent';
  if (signal.type === 'report-only-would-deny') return `${agent} would be denied on ${signal.context.tool || 'a tool'}`;
  if (signal.type === 'report-only-review-due') return `${agent} is still in Report-only`;
  if (signal.type === 'behavior-drift') return driftSubject(signal, agent);
  return signal.subject;
}
export function noteLine(signal: Signal): string | undefined {
  const c = signal.context;
  if (signal.type === 'report-only-would-deny') return `Report-only agent: ${c.count || 'some'} ${c.count === '1' ? 'call' : 'calls'} ran that its policy denies, in this hour.`;
  if (signal.type === 'report-only-review-due') return `Its review date was ${c.review_by ? reviewDay(c.review_by) : 'set'}. Enforce access, or set a new date.`;
  if (signal.type === 'behavior-drift') return driftNote(c);
  return signal.note ?? undefined;
}

// The departures of one Behavior drift signal: one agent, tool and hour (Backend 099 Implementation Decision 12).
const driftDepartures = (c: Record<string, string>) => new Set((c.departures || '').split(',').filter(Boolean));
const listOf = (items: string[]) => items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0] ?? '';

// Admin 060 decision 2: the subject names the strongest departure of the signal.
function driftSubject(signal: Signal, agent: string): string {
  const c = signal.context;
  const kinds = driftDepartures(c);
  const tool = c.tool || 'a tool';
  if (kinds.has('new-tool')) return `${agent} called ${tool} for the first time`;
  if (kinds.has('spike')) return `${agent} called ${tool} far more than usual`;
  if (kinds.has('new-sequence')) return `${agent} chained ${listOf((c.previous_tools || '').split(',').filter(Boolean)) || 'a tool'} → ${tool} for the first time`;
  return signal.subject;
}

const legNames = new Map<string, string>(legs.map(l => [l.key, l.label]));

// Admin 060 decisions 3 and 9: one sentence for each departure, in the order new tool, spike, new sequence, then
// the conditions of other agents and the response that ran. A missing context key leaves its sentence out.
function driftNote(c: Record<string, string>): string | undefined {
  const kinds = driftDepartures(c);
  const parts: string[] = [];
  if (kinds.has('new-tool')) {
    parts.push(c.first_in_workspace === 'true' ? 'No agent in this environment called this tool in the period.' : 'The tool was granted, but this agent never called it in the period.');
    if (c.sensitive_leg) parts.push(`The tool is high in ${listOf(c.sensitive_leg.split(',').map(leg => legNames.get(leg) ?? leg))}.`);
  }
  if (kinds.has('spike') && c.count) {
    // The detection window of the environment (hotfix of Backend 099): one hour unless configured otherwise.
    const hours = Number(c.detection_window_hours) || 1;
    const period = hours === 1 ? 'this hour' : `these ${hours} hours`;
    const same = hours === 1 ? 'an hour' : `${hours} hours`;
    if (c.baseline === 'agent' && c.pattern_max) parts.push(`${c.count} calls in ${period}; its pattern never passed ${c.pattern_max} in ${same}.`);
    else if (c.baseline === 'peers' && c.pattern_max) parts.push(`${c.count} calls in ${period}; no other agent passed ${c.pattern_max} in ${same}.`);
    else if (c.baseline === 'none') parts.push(`${c.count} calls in ${period}, and nobody called this tool before.`);
  }
  if (kinds.has('new-sequence') && c.previous_tools) parts.push(`This agent never called ${c.tool || 'this tool'} after ${listOf(c.previous_tools.split(','))}.`);
  if (c.conditions_elsewhere === 'true') parts.push('Other agents have call conditions on this tool; this one has none.');
  if (c.response === 'suspend_tool') parts.push('The tool was suspended for this agent.');
  if (c.response === 'disable_agent') parts.push('The agent was disabled.');
  return parts.length ? parts.join(' ') : undefined;
}
