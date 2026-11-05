import { ArrowRight, Eye, X } from 'lucide-react';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import { BACKEND_SPEC, overdue, reportOnly, wouldDenyTotal } from './data';

export type BannerState = 'active' | 'quiet';
type Props = { environment: 'production' | 'sandbox'; state: BannerState; onView: () => void; onDismiss: () => void };

// Shown on every Admin screen while the current environment has an agent in Report-only.
// Dismiss hides it for this browser session only; it returns at the next sign-in.
export function ReportOnlyBanner({ environment, state, onView, onDismiss }: Props) {
  const n = reportOnly.length;
  const agentsText = `${n} ${n === 1 ? 'agent' : 'agents'} in Report-only`;
  const single = n === 1 ? reportOnly[0] : undefined;
  const late = reportOnly.filter(overdue).length;
  return <div className="report-only-banner" data-environment={environment} data-state={state} role="status">
    <Eye size={18} aria-hidden="true" />
    <div className="report-only-banner-copy">
      <strong>{environment === 'production' ? `Production: ${agentsText}` : agentsText}{late ? <span className="report-only-overdue">{late} review overdue</span> : null}</strong>
      {state === 'active'
        ? <span>{wouldDenyTotal} calls would be denied in the last 24 hours. These agents run every call: their tool grants, resources and call rules do not block yet.</span>
        : <span>No call would be denied in 7 days. {single ? `${single.name} is ready to enforce.` : 'These agents are ready to enforce.'}</span>}
    </div>
    <WaitingBackend spec={BACKEND_SPEC} tip="Counts the agents in Report-only and their would-deny calls in the current environment." />
    {state === 'active'
      ? <button type="button" className="cp-admin-button cp-admin-button--small" onClick={onView}>View report<ArrowRight size={14} aria-hidden="true" /></button>
      : <button type="button" className="cp-admin-button cp-admin-button--small" onClick={onView}>{single ? 'Open agent' : 'Open agents'}<ArrowRight size={14} aria-hidden="true" /></button>}
    <button type="button" className="report-only-banner-close" aria-label="Hide for this session" title="Hide for this session" onClick={onDismiss}><X size={16} aria-hidden="true" /></button>
  </div>;
}
