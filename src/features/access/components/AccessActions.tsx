import './access-actions.css';
import { Plus } from 'lucide-react';

type AccessActionsProps = { onNewAgent: () => void; onReview: () => void; changeCount: number };

export function AccessActions({ onNewAgent, onReview, changeCount }: AccessActionsProps) {
  return (
    <div className="access-actions">
      <button
        className="cp-admin-button cp-admin-button--secondary"
        type="button"
        onClick={onNewAgent}
      >
        <Plus size={16} aria-hidden="true" />
        New agent
      </button>
      <button className="cp-admin-button cp-admin-button--dark" type="button" onClick={onReview}>
        Review changes
        {changeCount ? <span className="access-change-count">{changeCount}</span> : null}
      </button>
    </div>
  );
}
