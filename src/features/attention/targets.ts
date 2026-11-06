import type { Signal } from './api';
import { denyText, exchangeText } from '../investigate/labels';
import type { ReasonLabel } from '../investigate/types';
import { reviewDay } from '../../components/report-only/ReportOnlyChip';
import type { ExchangeReasonLabel } from '../investigate/types';
import { actionPath } from '../access/target-context';
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
    default: return ['', ''];
  }
}

// subjectLine and noteLine say what a Report-only signal means in words (Admin
// 041 section 5); other types keep the stored subject and the enriched note.
export function subjectLine(signal: Signal): string {
  const agent = signal.context.agent_name || signal.context.agent || 'An agent';
  if (signal.type === 'report-only-would-deny') return `${agent} would be denied on ${signal.context.tool || 'a tool'}`;
  if (signal.type === 'report-only-review-due') return `${agent} is still in Report-only`;
  return signal.subject;
}
export function noteLine(signal: Signal): string | undefined {
  const c = signal.context;
  if (signal.type === 'report-only-would-deny') return `Report-only agent: ${c.count || 'some'} ${c.count === '1' ? 'call' : 'calls'} ran that its policy denies, in this hour.`;
  if (signal.type === 'report-only-review-due') return `Its review date was ${c.review_by ? reviewDay(c.review_by) : 'set'}. Enforce access, or set a new date.`;
  return signal.note ?? undefined;
}
