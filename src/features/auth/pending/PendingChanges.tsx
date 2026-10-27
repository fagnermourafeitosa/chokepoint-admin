import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type PendingChanges = {
  register: (key: symbol, pending: boolean) => void;
  confirmSwitch: (target: 'workspace' | 'environment') => boolean;
};
const PendingChangesContext = createContext<PendingChanges | null>(null);

// Only explicit workspace/environment changes consult this transient registry.
export function PendingChangesProvider({ children }: { children: ReactNode }) {
  const sources = useRef(new Set<symbol>());
  const value = useMemo<PendingChanges>(() => ({
    register(key, pending) { if (pending) sources.current.add(key); else sources.current.delete(key); },
    confirmSwitch(target) {
      return sources.current.size === 0 || window.confirm(`You have pending changes. Switching ${target} will discard unsaved changes. Continue?`);
    },
  }), []);
  return <PendingChangesContext.Provider value={value}>{children}</PendingChangesContext.Provider>;
}
export function usePendingChangesGuard() {
  const context = useContext(PendingChangesContext);
  if (!context) throw new Error('Pending changes context required');
  return context;
}

// Each mounted editor owns its registration and removes it on scope teardown.
export function usePendingChanges(pending: boolean) {
  const { register } = usePendingChangesGuard();
  const [key] = useState(() => Symbol('pending-editor'));
  useLayoutEffect(() => {
    register(key, pending);
    return () => register(key, false);
  }, [register, key, pending]);
}
