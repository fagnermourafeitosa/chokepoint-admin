import { CopyButton } from '../copy/CopyButton';
import { Notice } from '../notice/Notice';

// Design system "One-time secret" (Admin 053): a secret that the backend returns
// once, at creation or rotation. A warning notice says it will not be shown
// again; the value is in mono with a Copy button.
export function OneTimeSecret({ value, title = 'Copy the secret now. You will not see it again.', className }: { value: string; title?: string; className?: string }) {
  return (
    <Notice tone="warning" title={title} className={className}>
      <span className="cp-admin-secret"><code>{value}</code><CopyButton value={value} /></span>
    </Notice>
  );
}
