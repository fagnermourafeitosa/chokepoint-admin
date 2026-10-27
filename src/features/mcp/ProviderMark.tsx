import { Server } from 'lucide-react';

// Provider identity selects an audited local asset, never a remote icon URL.
export function ProviderMark({ provider, size = 24 }: { provider?: string; size?: number }) {
  return provider === 'github' ? <img src="/brands/github.png" alt="" width={size} height={size} className="provider-mark" /> : <Server size={size} aria-hidden="true" />;
}
