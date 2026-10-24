import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { useTooltip } from './useTooltip';
import './tooltip.css';

type TooltipProps = { children: ReactNode; content: string };

export function Tooltip({ children, content }: TooltipProps) {
  const tip = useTooltip();
  return (
    <>
      <span
        ref={tip.trigger}
        className="admin-tooltip-trigger"
        tabIndex={0}
        aria-describedby={tip.open ? tip.id : undefined}
        onMouseEnter={tip.enter}
        onMouseLeave={tip.leave}
        onFocus={tip.focus}
        onBlur={tip.blur}
        onKeyDown={tip.onKeyDown}
      >
        {children}
      </span>
      {tip.open
        ? createPortal(
            <span
              ref={tip.tooltip}
              id={tip.id}
              className="admin-tooltip"
              role="tooltip"
              style={tip.position}
              onMouseEnter={tip.enter}
              onMouseLeave={tip.leave}
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
