import { Inbox } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './empty-state.css';

type EmptyStateProps = { title: string; description?: string; icon?: LucideIcon };

export function EmptyState({ title, description, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <div className="admin-empty-state" role="status">
      <span className="admin-empty-state-icon">
        <Icon size={26} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
