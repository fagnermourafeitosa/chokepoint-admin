import { Route } from 'lucide-react';
import { Tooltip } from '../../../src/components/ui/tooltip/Tooltip';

// Admin 058 prototype: Take the tour in the bottom left corner, at the height of the footer buttons, with a
// tour icon (Route) instead of the help icon. The real button (src/features/onboarding/FirstAccessTour.tsx)
// is hidden on these pages by prototype.css; the real change is made at implementation.
// inline: inside a footer row of actions (the review page), at its left end, on the line of its buttons.
export function TourButton({ inline = false }: { inline?: boolean }) {
  return <span className={inline ? 'tl-tour tl-tour--inline' : 'tl-tour'}><Tooltip content="Take the tour"><button type="button" className="cp-admin-button cp-admin-button--secondary tl-tour-button" aria-label="Take the tour"><Route size={18} aria-hidden="true" /></button></Tooltip></span>;
}
