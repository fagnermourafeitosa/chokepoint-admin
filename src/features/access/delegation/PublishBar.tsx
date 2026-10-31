import { CircleCheck, RefreshCw } from 'lucide-react';
import { WaitingBackend } from './WaitingBackend';

export type PublishState = 'effective' | 'pending';

// Draft and runtime state side by side. Reconciliation is automatic; there is no repair action.
export function PublishBar({ state, onState, changes, onDiscard }: { state: PublishState; onState: (s: PublishState) => void; changes: number; onDiscard: () => void }) {
  return <div className="delegation-publish" role="region" aria-label="Publication">
    <div className="delegation-publish-state">
      <span>{changes ? <><strong>Draft</strong> · {changes} unpublished {changes === 1 ? 'change' : 'changes'}</> : 'No unpublished changes'}</span>
      <span className="delegation-publish-sep" aria-hidden="true" />
      {state === 'effective'
        ? <span className="mcp-badge" data-tone="success"><CircleCheck size={13} aria-hidden="true" /> Revision 3 effective</span>
        : <span className="mcp-badge" data-tone="warning"><RefreshCw size={13} aria-hidden="true" /> Revision 4 pending · revision 3 still applies</span>}
      <WaitingBackend spec="033" />
    </div>
    <div className="delegation-publish-actions">
      <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => onState(state === 'effective' ? 'pending' : 'effective')} title="Prototype only: switch the runtime state">Preview state</button>
      <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={!changes} onClick={onDiscard}>Discard draft</button>
      <button type="button" className="cp-admin-button cp-admin-button--small" disabled={!changes}>Review &amp; publish</button>
    </div>
  </div>;
}
