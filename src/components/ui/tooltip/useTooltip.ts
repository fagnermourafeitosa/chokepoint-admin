import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

export function useTooltip() {
  const id = useId();
  const trigger = useRef<HTMLSpanElement>(null);
  const tooltip = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const hideTimer = useRef<number | undefined>(undefined);
  const open = (hovered || focused) && !dismissed;
  useEffect(() => () => window.clearTimeout(hideTimer.current), []);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      if (!trigger.current || !tooltip.current) return;
      const anchor = trigger.current.getBoundingClientRect();
      const tip = tooltip.current.getBoundingClientRect();
      const left = Math.max(
        12,
        Math.min(
          anchor.left + anchor.width / 2 - tip.width / 2,
          window.innerWidth - tip.width - 12,
        ),
      );
      const above = anchor.top - tip.height - 8;
      setPosition({ left, top: above >= 12 ? above : anchor.bottom + 8 });
    }
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  function enter() {
    window.clearTimeout(hideTimer.current);
    setDismissed(false);
    setHovered(true);
  }
  function leave() {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setHovered(false), 150);
  }
  function focus() {
    setDismissed(false);
    setFocused(true);
  }
  function blur() {
    setFocused(false);
  }
  function onKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      setDismissed(true);
    }
  }
  return { id, trigger, tooltip, open, position, enter, leave, focus, blur, onKeyDown };
}
