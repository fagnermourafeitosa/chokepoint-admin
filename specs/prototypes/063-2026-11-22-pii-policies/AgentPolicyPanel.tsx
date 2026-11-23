import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { SidePanel } from '../../../src/components/ui/side-panel/SidePanel';
import type { Agent } from './data';
import { TypeGroups } from './TypeGroups';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';

// Admin 063 prototype: the PII policy of one agent. Its switches start from its own policy, or from
// the environment when it has none. A change to any switch makes the whole list of switches the own
// policy of the agent, the unchanged switches included. A save that leaves no difference from the environment removes the
// own policy, so the agent follows the environment again (Backend 105: an absent own policy follows
// it); Reset to environment does the same at once in the draft. Saving writes nothing.
export function AgentPolicyPanel({ agent, environment, masked, onClose, onSave }: {
  agent: Agent; environment: string; masked: Record<string, boolean>;
  onClose: () => void; onSave: (own: Record<string, boolean> | undefined) => void;
}) {
  const initial = agent.own ?? masked;
  const [draft, setDraft] = useState<Record<string, boolean>>({ ...initial });
  const [asking, setAsking] = useState(false);
  // Cancel, the close button, Escape and a click outside the panel ask first when the draft changed.
  const dirty = Object.keys(draft).some(key => draft[key] !== initial[key]);
  const close = () => { if (dirty) setAsking(true); else onClose(); };
  const changed = Object.fromEntries(Object.entries(draft).filter(([key, on]) => on !== masked[key]));
  const differs = Object.keys(changed).length > 0;
  const save = () => onSave(differs ? draft : undefined);
  return <SidePanel width="wide" eyebrow={`PII policy · ${environment}`} title={agent.name} onClose={close}>
    <div className="pii-panel-body">
      <div className="pii-panel-state">
        <span className="mcp-badge" data-tone={differs ? 'warning' : undefined}>{differs ? 'Own policy' : 'Environment'}</span>
        <span className="cp-admin-muted">{differs ? `Differs from ${environment} in ${Object.keys(changed).length} ${Object.keys(changed).length === 1 ? 'type' : 'types'}. A later change to ${environment} does not reach this agent.` : `Masks the types of ${environment} and follows its later changes.`}</span>
        {differs ? <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => setDraft({ ...masked })}><RotateCcw size={15} aria-hidden="true" />Reset to environment</button> : null}
      </div>
      <TypeGroups columns={['Type', 'Environment', 'This agent']} masked={key => draft[key]} cells={t => [
        <span className="mcp-badge" data-tone={masked[t.key] ? 'success' : undefined}>{masked[t.key] ? 'Masked' : 'Not masked'}</span>,
        <input className="cp-admin-switch" type="checkbox" role="switch" aria-label={`Mask ${t.label} for ${agent.name}`} checked={draft[t.key]} onChange={e => { const on = e.target.checked; setDraft(d => ({ ...d, [t.key]: on })); }} />,
      ]} />
      <footer className="identity-form-actions pii-panel-footer"><span />
        <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={close}>Cancel</button>
        <button type="button" className="cp-admin-button" onClick={save}>Save</button>
      </footer>
    </div>
    {asking ? <UnsavedChangesDialog what={`the PII policy of ${agent.name}`} onSave={save} onDiscard={onClose} onKeep={() => setAsking(false)} /> : null}
  </SidePanel>;
}
