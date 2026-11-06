import type { ReactNode } from 'react';
import { CircleAlert, Info, TriangleAlert } from 'lucide-react';

// A message about the screen, with one meaning per tone (Admin 048, design system Notice):
// info explains what happens, warning names a consequence to check, error says what failed.
export type NoticeTone = 'info' | 'warning' | 'error';

const icons = { info: Info, warning: TriangleAlert, error: CircleAlert };
const modifiers = { info: 'info', warning: 'warning', error: 'danger' };

type NoticeProps = { tone?: NoticeTone; title?: ReactNode; children?: ReactNode; className?: string };

export function Notice({ tone = 'info', title, children, className }: NoticeProps) {
  const Icon = icons[tone];
  return <div className={`cp-admin-notice cp-admin-notice--${modifiers[tone]}${className ? ` ${className}` : ''}`} role={tone === 'info' ? 'status' : 'alert'}>
    <Icon size={16} aria-hidden="true" />
    <div className="cp-admin-notice-body">{title ? <strong>{title}</strong> : null}{children}</div>
  </div>;
}
