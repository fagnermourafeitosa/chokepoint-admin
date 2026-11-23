import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { UnsavedChangesDialog } from '../../components/ui/dialog/UnsavedChangesDialog';
import { SidePanel } from '../../components/ui/side-panel/SidePanel';
import type { PiiGroup, Switches } from './pii-terms';
import { sameSwitches } from './pii-terms';
import { PiiTypeGroups } from './PiiTypeGroups';

// Admin 063, item 7: the PII policy of one agent. Its switches start from its own policy, or from
// the environment when it has none. A change to any switch makes the whole list the own policy of
// the agent, the unchanged switches included; a save with no difference from the environment
// removes the own policy, so the agent follows the environment again (Backend 105: an absent own
// policy follows it). Reset to environment does the same in the draft; Save applies it.
export function PiiAgentPanel({ name, environment, groups, envSwitches, initial, own, busy, error, onClose, onSave }: {
  name: string; environment: string; groups: PiiGroup[]; own: boolean;
  envSwitches: Switches; initial: Switches; busy: boolean; error?: string;
  onClose: () => void; onSave: (own: Switches | undefined) => void;
}) {
  const [draft, setDraft] = useState<Switches>({ ...initial });
  const [asking, setAsking] = useState(false);
  // Reset of an own policy that has the same types as the environment: the switches do not move,
  // but Save must still remove the own policy.
  const [reset, setReset] = useState(false);
  // Cancel, the close button, Escape and a click outside the panel ask first when the draft changed.
  const edited = !sameSwitches(draft, initial);
  const dirty = edited || reset;
  const close = () => { if (busy) return; if (dirty) setAsking(true); else onClose(); };
  const changed = Object.keys(draft).filter(key => !!draft[key] !== !!envSwitches[key]);
  const differs = changed.length > 0;
  // An own policy stays one until it is saved with no difference or reset (Admin 063, item 7).
  const ownNow = differs || (own && !reset && !edited);
  const save = () => onSave(differs ? draft : undefined);
  return <SidePanel width="wide" eyebrow={`PII policy · ${environment}`} title={name} onClose={close}>
    <div className="pii-panel-body">
      <div className="pii-panel-state">
        <span className="mcp-badge" data-tone={ownNow ? 'warning' : undefined}>{ownNow ? 'Own policy' : 'Environment'}</span>
        <span className="cp-admin-muted">{ownNow && !differs ? `Has the same types as ${environment}. A later change to ${environment} does not reach this agent.` : differs ? `Differs from ${environment} in ${changed.length} ${changed.length === 1 ? 'type' : 'types'}. A later change to ${environment} does not reach this agent.` : `Masks the types of ${environment} and follows its later changes.`}</span>
        {ownNow ? <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => { setDraft({ ...envSwitches }); setReset(own); }}><RotateCcw size={15} aria-hidden="true" />Reset to environment</button> : null}
      </div>
      <PiiTypeGroups groups={groups} columns={['Type', 'Environment', 'This agent']} masked={key => !!draft[key]} cells={t => [
        <span className="mcp-badge" data-tone={envSwitches[t.key] ? 'success' : undefined}>{envSwitches[t.key] ? 'Masked' : 'Not masked'}</span>,
        <input className="cp-admin-switch" type="checkbox" role="switch" aria-label={`Mask ${t.label} for ${name}`} checked={!!draft[t.key]} onChange={e => { const on = e.target.checked; setDraft(d => ({ ...d, [t.key]: on })); }} />,
      ]} />
      {error && !asking ? <div className="cp-admin-notice" role="alert">{error}</div> : null}
      <footer className="identity-form-actions pii-panel-footer"><span />
        <button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={busy} onClick={close}>Cancel</button>
        <button type="button" className="cp-admin-button" disabled={busy || !dirty} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
      </footer>
    </div>
    {asking ? <UnsavedChangesDialog what={`the PII policy of ${name}`} busy={busy} error={error} onSave={save} onDiscard={onClose} onKeep={() => setAsking(false)} /> : null}
  </SidePanel>;
}
