import { Notice } from '../../../src/components/ui/notice/Notice';

// Admin 064 prototype: one warning for a draft that takes access away, with one line for each loss.
export function AccessLoss({ losses }: { losses: string[] }) {
  if (!losses.length) return null;
  return <Notice tone="warning" title="Access is lost">
    {losses.length === 1 ? losses[0] : <ul className="rr-losses">{losses.map(l => <li key={l}>{l}</li>)}</ul>}
  </Notice>;
}
