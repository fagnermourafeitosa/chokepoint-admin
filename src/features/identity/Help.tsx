import { useId } from 'react';
import { Info } from 'lucide-react';

// Help shows secondary guidance on hover, focus or tap, so the form stays
// short. Text that the user must act on stays visible instead.
export function Help({ text, label = 'More information' }: { text: string; label?: string }) {
 const id = useId();
 return <span className="identity-help">
  <button type="button" className="identity-help-trigger" aria-label={label} aria-describedby={id}><Info size={16} aria-hidden="true" /></button>
  <span id={id} role="tooltip" className="identity-help-text">{text}</span>
 </span>;
}
