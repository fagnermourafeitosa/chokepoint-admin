import { Notice } from '../../../components/ui/notice/Notice';
import type { Loss } from './accessLoss';
import { lossText } from './accessLossText';

// The "Access is lost" warning of a draft (Admin 064 Solution 2): one line for each loss of access.
// It knows nothing of the diff; the review panel and the Publish confirmation of the history use it.
export function AccessLossNotice({ losses, agentName }: { losses: Loss[]; agentName: string }) {
  if (!losses.length) return null;
  const lines = losses.map(l => lossText(l, agentName));
  return <Notice tone="warning" title="Access is lost">
    {lines.length === 1 ? <p className="access-loss-line">{lines[0]}</p> : <ul className="access-loss-lines">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>}
  </Notice>;
}
