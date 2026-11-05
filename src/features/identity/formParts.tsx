import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { Help } from './Help';

// Shared parts of the provider forms (Google 023, Entra 042).
export function SectionHeading({ title, description, help }: { title: string; description: string; help: string }) {
 return <div className="identity-section-heading"><h2>{title} <Help text={help} /></h2><p>{description}</p></div>;
}

// A link to the official guide of the provider. It opens in a new tab.
export function GuideLink({ href, children }: { href: string; children: ReactNode }) {
 return <a href={href} target="_blank" rel="noreferrer">{children} <ExternalLink size={13} aria-hidden="true" /></a>;
}
