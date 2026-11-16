import { Route } from 'lucide-react';
import { Tooltip } from '../../../src/components/ui/tooltip/Tooltip';

// Take the tour at the bottom left with the Route icon. The real button is hidden on these pages by prototype.css.
export function TourButton() {
  return <span className="tl-tour"><Tooltip content="Take the tour"><button type="button" className="cp-admin-button cp-admin-button--secondary tl-tour-button" aria-label="Take the tour"><Route size={18} aria-hidden="true" /></button></Tooltip></span>;
}
