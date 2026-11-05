import './report-only-banner.css';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { ArrowRight, Eye, X } from 'lucide-react';
import { overviewApi } from '../../features/overview/api';
import type { EnvironmentScope } from '../../features/access/environment-scope';

// The query key of the banner summary; a mode change invalidates it.
export const reportOnlyKey = (s: EnvironmentScope) => ['report-only-summary', s.userId, s.tenantId, s.environmentId] as const;

// The dismissal lasts for this browser session only (Admin 041 section 3).
const storageKey = (s: EnvironmentScope) => `report-only-banner:${s.userId}:${s.tenantId}:${s.environmentId}`;
function dismissed(s: EnvironmentScope) {
  try { return sessionStorage.getItem(storageKey(s)) === 'hidden'; } catch { return false; }
}

type Props = { scope: EnvironmentScope; production: boolean };

// ReportOnlyBanner shows on every screen while the environment has an agent in
// Report-only: their would-deny calls of the last 24 hours, or that none would be
// denied in 7 days. It informs and never blocks.
export function ReportOnlyBanner({ scope, production }: Props) {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(() => dismissed(scope));
  const summary = useQuery({ queryKey: reportOnlyKey(scope), queryFn: ({ signal }) => overviewApi.reportOnly(scope, signal), staleTime: 60_000, refetchInterval: 5 * 60_000 });
  const data = summary.data;
  if (hidden || !data || data.agents.length === 0) return null;
  const n = data.agents.length;
  const agentsText = `${n} ${n === 1 ? 'agent' : 'agents'} in Report-only`;
  const single = n === 1 ? data.agents[0] : undefined;
  const quiet = data.would_deny_last_7d === 0;
  function hide() {
    try { sessionStorage.setItem(storageKey(scope), 'hidden'); } catch { /* the banner stays hidden for this page only */ }
    setHidden(true);
  }
  function open() {
    if (quiet) navigate(single ? `/access?${new URLSearchParams({ agent_id: single.id })}` : '/access');
    else navigate(`/investigate?${new URLSearchParams({ view: 'decisions', result: 'would_deny', ...(single ? { agent: single.id } : {}) })}`);
  }
  return <div className="report-only-banner-slot"><div className="report-only-banner" data-environment={production ? 'production' : 'sandbox'} data-state={quiet ? 'quiet' : 'active'} role="status">
    <Eye size={18} aria-hidden="true" />
    <div className="report-only-banner-copy">
      <strong>{production ? `Production: ${agentsText}` : agentsText}{data.review_overdue ? <span className="report-only-overdue">{data.review_overdue} review overdue</span> : null}</strong>
      {quiet
        ? <span>No call would be denied in 7 days. {single ? `${single.name} is ready to enforce.` : 'These agents are ready to enforce.'}</span>
        : <span>{data.would_deny_last_24h} {data.would_deny_last_24h === 1 ? 'call' : 'calls'} would be denied in the last 24 hours. {n === 1 ? 'This agent runs' : 'These agents run'} every call: tool grants, resources and call rules do not block yet.</span>}
    </div>
    <button type="button" className="cp-admin-button cp-admin-button--small" onClick={open}>{quiet ? (single ? 'Open agent' : 'Open agents') : 'View report'}<ArrowRight size={14} aria-hidden="true" /></button>
    <button type="button" className="report-only-banner-close" aria-label="Hide for this session" title="Hide for this session" onClick={hide}><X size={16} aria-hidden="true" /></button>
  </div></div>;
}
