import { useEffect, useState } from 'react';
import { Check, Copy, Info, TriangleAlert } from 'lucide-react';
import { Dialog } from '../../components/ui/dialog/Dialog';
import type { EnvironmentScope } from '../access/environment-scope';
import { usePendingChanges } from '../auth/pending/PendingChanges';
import type { IdentityConnection, LifecycleConfiguration } from './api';
import { Help } from './Help';
import { rotationRisk, useLifecycleSync, useSecretLeaveGuard } from './useLifecycleSync';
import type { LifecycleAction, RevealedSecret } from './useLifecycleSync';

// Event types translated by the Backend 016 Keycloak adapter. Subscribing to
// other types makes the provider retry every unsupported event.
const supportedEventTypes = ['access.REGISTER', 'access.UPDATE_PROFILE', 'access.UPDATE_EMAIL', 'access.DELETE_ACCOUNT', 'admin.USER-CREATE', 'admin.USER-UPDATE', 'admin.USER-DELETE'];
const failureLabels: Record<string, string> = {
 invalid_event: 'Invalid event', unsupported_operation: 'Unsupported event type', conflict: 'Conflicting event or configuration change',
 deadline_exceeded: 'Processing timed out', rate_limited: 'Rate limit reached', contention: 'Concurrent changes to the same user',
 unavailable: 'Directory or database unavailable',
};
const deliveryLimitations = 'Keycloak drops an event when it cannot reach Chokepoint, and pending retries are lost when Keycloak restarts.\n\nThere is no periodic reconciliation, so a lost change stays missing until the user changes again.\n\nCreate the Keycloak webhook yourself with the values shown when you enable or rotate.';
const when = (value?: string | null) => (value ? new Date(value).toLocaleString() : 'None yet');

type Props = { scope: EnvironmentScope; connection?: IdentityConnection; onSecretVisibleChange?: (visible: boolean) => void };

// LifecycleSyncSection is shown only for a saved, enabled Keycloak connection
// with a user directory, the only configuration the receiver accepts.
export function LifecycleSyncSection({ scope, connection, onSecretVisibleChange }: Props) {
 if (!connection || connection.provider !== 'keycloak' || !connection.enabled || !connection.directory) return null;
 return <LifecycleSync scope={scope} connectionId={connection.id} onSecretVisibleChange={onSecretVisibleChange} />;
}

function CopyButton({ value, label }: { value: string; label: string }) {
 // A new object per click restarts the timer when the result repeats.
 const [result, setResult] = useState<{ kind: 'copied' | 'failed' } | null>(null);
 const [copying, setCopying] = useState(false);
 useEffect(() => {
  if (!result) return;
  const timer = window.setTimeout(() => setResult(null), 3000);
  return () => window.clearTimeout(timer);
 }, [result]);
 async function copy() {
  setCopying(true);
  try { await navigator.clipboard.writeText(value); setResult({ kind: 'copied' }); }
  catch { setResult({ kind: 'failed' }); }
  finally { setCopying(false); }
 }
 return <span className="lifecycle-copy-control">
  <button type="button" className="cp-admin-button cp-admin-button--ghost lifecycle-copy" aria-label={`Copy ${label}`} disabled={copying} onClick={() => void copy()}>
   {result?.kind === 'copied' ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{result?.kind === 'copied' ? 'Copied' : 'Copy'}
  </button>
  <small role="status" className={result?.kind === 'failed' ? 'lifecycle-copy-failed' : 'identity-sr-only'}>{result?.kind === 'failed' ? 'Copy failed. Select the value and copy it manually.' : result?.kind === 'copied' ? `${label} copied` : ''}</small>
 </span>;
}

function SecretPanel({ revealed, onDone }: { revealed: RevealedSecret; onDone: () => void }) {
 const [copied, setCopied] = useState(false);
 const body = JSON.stringify({ enabled: true, url: revealed.url, secret: revealed.secret, eventTypes: supportedEventTypes }, null, 2);
 return <section className="lifecycle-secret" aria-label="Receiver secret">
  <div className="cp-admin-notice identity-mapping-warning"><TriangleAlert size={18} aria-hidden="true" /><div><strong>Copy the secret now</strong><span>This secret is shown only once. If you lose it, rotate the secret and configure Keycloak again.</span></div></div>
  <div className="lifecycle-value"><span className="identity-field-label">Receiver URL</span><code>{revealed.url}</code><CopyButton value={revealed.url} label="receiver URL" /></div>
  <div className="lifecycle-value"><span className="identity-field-label">Secret</span><code>{revealed.secret}</code><CopyButton value={revealed.secret} label="secret" /></div>
  <div className="lifecycle-value lifecycle-body"><span className="identity-field-label">Keycloak webhook body</span><pre aria-label="Keycloak webhook body">{body}</pre><CopyButton value={body} label="Keycloak webhook body" /></div>
  <small>Create the webhook in the Keycloak realm with this body (Phase Two webhooks API). If Keycloak runs in a container, replace the URL host with the name it uses to reach Chokepoint.</small>
  <label className="cp-admin-choice"><input type="checkbox" checked={copied} onChange={e => setCopied(e.target.checked)} /><span className="cp-admin-choice-copy"><strong>I have copied the secret</strong></span></label>
  <div><button type="button" className="cp-admin-button" disabled={!copied} onClick={onDone}>Done</button></div>
 </section>;
}

// SetupSteps explains why the receiver URL exists and where to use it. Step 3
// is marked done once a delivery has been stored.
function SetupSteps({ state }: { state: LifecycleConfiguration }) {
 const delivered = !!state.last_committed_at;
 return <ol className="lifecycle-steps" aria-label="Connect Keycloak to Chokepoint">
  <li><span className="lifecycle-step-bubble" aria-hidden="true">1</span><div><strong>Copy the receiver URL</strong><span>This is the address where Chokepoint listens. Keycloak sends user changes to it.</span></div></li>
  <li><span className="lifecycle-step-bubble" aria-hidden="true">2</span><div><strong>Paste it in Keycloak</strong><span>In the customer realm, create a webhook with this URL, the secret, and the event types. Use the Phase Two webhooks API (<code>POST /realms/&lt;realm&gt;/webhooks</code>). Chokepoint shows the secret and a ready body once, when you enable or rotate.</span></div></li>
  <li data-done={delivered || undefined}><span className="lifecycle-step-bubble" aria-hidden="true">{delivered ? <Check size={14} /> : 3}</span><div><strong>{delivered ? 'Keycloak is delivering' : 'Check the delivery'}</strong><span>{delivered ? 'Chokepoint received a user change. Last delivery is shown below.' : 'Change a user in Keycloak. Last delivery below shows a time when Chokepoint receives it.'}</span></div></li>
 </ol>;
}

// SecretHint tells the user that the secret was copied once and cannot be shown
// again, and how to get a new one.
function SecretHint({ rotating }: { rotating: boolean }) {
 return <div className="cp-admin-notice identity-info"><Info size={18} aria-hidden="true" /><div><strong>{rotating ? 'Secret rotation in progress' : 'The secret was already shown'}</strong>{rotating
  ? <span>Chokepoint accepts the previous secret and the new one. Update the secret of the Keycloak webhook to the new one. When "First accepted with new secret" shows a time, select Complete rotation. After that, the previous secret stops working. The secret was shown only once. To see a new one: 1. Select Complete rotation. 2. Select Rotate secret. 3. Copy the new secret and update the Keycloak webhook.</span>
  : <span>Chokepoint shows the secret only once, so it cannot be displayed again. To see a new one: 1. Select Rotate secret. 2. Copy the new secret. 3. Update the secret of the Keycloak webhook.</span>}</div></div>;
}

function Health({ state }: { state: LifecycleConfiguration }) {
 return <dl className="lifecycle-health">
  <div><dt>Receiver URL</dt><dd className="lifecycle-url"><code>{state.receiver_url}</code>{state.receiver_url ? <CopyButton value={state.receiver_url} label="receiver URL" /> : null}</dd></div>
  <div><dt>Last delivery</dt><dd>{when(state.last_committed_at)}</dd></div>
  <div><dt>Last failure</dt><dd>{state.last_failure_at ? <>{when(state.last_failure_at)}<small>{failureLabels[state.last_failure_code ?? ''] ?? 'Unknown failure'}</small></> : 'None'}</dd></div>
  {state.rotation_in_progress ? <>
   <div><dt>Last accepted with previous secret</dt><dd>{when(state.previous_secret_last_accepted_at)}</dd></div>
   <div><dt>First accepted with new secret</dt><dd>{when(state.current_secret_first_accepted_at)}</dd></div>
  </> : null}
 </dl>;
}

function LifecycleSync({ scope, connectionId, onSecretVisibleChange }: { scope: EnvironmentScope; connectionId: string; onSecretVisibleChange?: (visible: boolean) => void }) {
 const sync = useLifecycleSync(scope, connectionId);
 const [confirm, setConfirm] = useState<'complete' | 'remove' | null>(null);
 const [active, setActive] = useState<LifecycleAction | null>(null);
 const visible = !!sync.revealed;
 usePendingChanges(visible);
 useSecretLeaveGuard(visible);
 useEffect(() => { onSecretVisibleChange?.(visible); }, [visible, onSecretVisibleChange]);
 const state = sync.data;
 const risk = state ? rotationRisk(state) : null;
 async function act(action: LifecycleAction) {
  setActive(action);
  try { if (await sync.run(action)) setConfirm(null); } finally { setActive(null); }
 }
 return <div className="identity-form-section lifecycle-section">
  <div className="identity-section-heading"><h2>Auto sync users <Help label="Delivery limitations" text={deliveryLimitations} /></h2><p>Receive user changes from Keycloak as they happen.</p></div>
  <div className="identity-form-fields">
   {sync.error ? <p className="cp-admin-notice cp-admin-notice--danger" role="alert">{sync.error}</p> : null}
   {sync.notice ? <p className="cp-admin-notice" role="status">{sync.notice}</p> : null}
   {sync.isPending ? <p role="status">Loading auto sync…</p> : sync.isError || !state ? <div className="cp-admin-notice" role="alert">Could not load auto sync. <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => void sync.refetch()}>Retry</button></div> : <>
    {sync.revealed ? <SecretPanel revealed={sync.revealed} onDone={sync.dismissSecret} /> : null}
    {state.configured ? <>
     <div className="lifecycle-status"><span className="mcp-badge" data-tone="success">Enabled</span>{state.rotation_in_progress ? <span className="mcp-badge">Rotation in progress</span> : null}</div>
     <SetupSteps state={state} />
     {sync.revealed ? null : <SecretHint rotating={state.rotation_in_progress} />}
     <Health state={state} />
     <div className="lifecycle-actions">
      {state.rotation_in_progress
       ? <button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={sync.pending} onClick={() => (risk ? setConfirm('complete') : void act('complete'))}>{active === 'complete' && !confirm ? 'Completing…' : 'Complete rotation'}</button>
       : <button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={sync.pending || visible} onClick={() => void act('rotate')}>{active === 'rotate' ? 'Rotating…' : 'Rotate secret'}</button>}
      <button type="button" className="cp-admin-button cp-admin-button--ghost lifecycle-remove" disabled={sync.pending} onClick={() => setConfirm('remove')}>Remove receiver</button>
     </div>
    </> : !sync.revealed ? <div className="lifecycle-empty">
     <div className="cp-admin-notice identity-info"><Info size={18} aria-hidden="true" /><div><strong>How it works</strong><span>Chokepoint creates a receiver URL and a secret. Keycloak sends signed user events to that URL, and Chokepoint reads the user's current state from the directory before it stores the change.</span></div></div>
     <div><button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={sync.pending} onClick={() => void act('create')}>{active === 'create' ? 'Enabling…' : 'Enable auto sync'}</button></div>
    </div> : null}
   </>}
  </div>
  {confirm === 'complete' ? <Dialog title="Complete rotation?" onClose={() => { if (!sync.pending) setConfirm(null); }}>
   <div className="admin-dialog-body">
    <p>{risk === 'no-new-secret' ? 'No delivery has been accepted with the new secret yet. Keycloak may still use the previous secret.' : 'A delivery was accepted with the previous secret less than 15 minutes ago. Keycloak can still retry events signed with it.'}</p>
    <p>After completion, Chokepoint rejects the previous secret, and those events are lost. To avoid this, update the Keycloak webhook secret and wait until both conditions clear.</p>
    {sync.error ? <p role="alert">{sync.error}</p> : null}
   </div>
   <div className="admin-dialog-actions"><button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={sync.pending} onClick={() => setConfirm(null)}>Wait</button><button type="button" className="cp-admin-button" disabled={sync.pending} onClick={() => void act('complete')}>{sync.pending ? 'Completing…' : 'Complete anyway'}</button></div>
  </Dialog> : null}
  {confirm === 'remove' ? <Dialog title="Remove auto sync receiver?" onClose={() => { if (!sync.pending) setConfirm(null); }}>
   <div className="admin-dialog-body">
    <p>Chokepoint deletes the receiver URL and its secrets. The Keycloak webhook stops working, and later user changes are not received. Stored users and their history stay.</p>
    {sync.error ? <p role="alert">{sync.error}</p> : null}
   </div>
   <div className="admin-dialog-actions"><button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={sync.pending} onClick={() => setConfirm(null)}>Cancel</button><button type="button" className="cp-admin-button cp-admin-button--danger" disabled={sync.pending} onClick={() => void act('remove')}>{sync.pending ? 'Removing…' : 'Remove receiver'}</button></div>
  </Dialog> : null}
 </div>;
}
