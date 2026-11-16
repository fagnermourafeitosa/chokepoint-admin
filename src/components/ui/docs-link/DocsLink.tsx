import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

// Design system Documentation link (Admin 058): an Admin label that opens the page of the public
// documentation that explains it, in a new tab, ending with ArrowUpRight. Never a button.
export function DocsLink({ href, children }: { href: string; children: ReactNode }) {
  return <a className="cp-admin-docs-link" href={href} target="_blank" rel="noopener noreferrer">{children} <ArrowUpRight size={14} aria-hidden="true" /></a>;
}
