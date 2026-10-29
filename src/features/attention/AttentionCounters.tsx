import { useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import type { SignalCounts } from './api';

type Props = {
  pending?: SignalCounts;
  toolsWithoutReview?: number;
  onShowInbox: () => void;
};

// AttentionCounters shows the two counters that have a real source today.
export function AttentionCounters({ pending, toolsWithoutReview, onShowInbox }: Props) {
  const navigate = useNavigate();
  return (
    <div className="attention-counters">
      <Counter label="Pending" value={pending?.pending} hint="signals waiting for review" onClick={onShowInbox} />
      <Counter label="Tools without review" value={toolsWithoutReview} hint="open the tool catalog" onClick={() => navigate('/access/integrations?type=custom')} />
    </div>
  );
}

function Counter({ label, value, hint, onClick }: { label: string; value?: number; hint: string; onClick: () => void }) {
  return (
    <button type="button" className="attention-counter" onClick={onClick}>
      <span className="attention-counter-label">{label}</span>
      <strong>{value ?? '–'}</strong>
      <span className="attention-counter-hint">{hint}<ArrowRight size={14} aria-hidden="true" /></span>
    </button>
  );
}
