import { useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';

export function useDropdown() {
  const disclosure = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !disclosure.current?.contains(event.target))
        disclosure.current?.removeAttribute('open');
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && disclosure.current?.open) {
        disclosure.current.removeAttribute('open');
        disclosure.current.querySelector('summary')?.focus();
      }
    }
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);
  function closeOnSelection(event: MouseEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest('button'))
      disclosure.current?.removeAttribute('open');
  }
  return { disclosure, closeOnSelection };
}
