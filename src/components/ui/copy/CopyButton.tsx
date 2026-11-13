import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';

// Design system "Copy button" (Admin 053): copies one value; the label turns
// to Copied for a moment. It never shows the value it copies.
export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timer);
  }, [copied]);
  return (
    <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={!value}
      onClick={() => { void navigator.clipboard?.writeText(value).then(() => setCopied(true)); }}>
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{copied ? 'Copied' : label}
    </button>
  );
}
