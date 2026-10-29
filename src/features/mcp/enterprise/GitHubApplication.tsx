import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Info } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { EnvironmentScope } from '../../access/environment-scope';
import { usePendingChanges } from '../../auth/pending/PendingChanges';
import { enterpriseApi, type ApplicationStatus } from './api';
import { GitHubSetupGuide } from './GitHubSetupGuide';

type Props = { scope: EnvironmentScope; onClose: () => void; onSaved: () => Promise<void> };
export function GitHubApplication(props: Props) {
  const configuration = useQuery({ queryKey: ['mcp-application', props.scope.userId, props.scope.tenantId, props.scope.environmentId, 'github'], queryFn: ({ signal }) => enterpriseApi.application(props.scope, 'github', signal), staleTime: 0, retry: false });
  if (configuration.isPending) return <p role="status">Loading GitHub App…</p>;
  if (configuration.isError) return <p role="alert">Could not load your GitHub App. <button className="cp-admin-button" onClick={() => void configuration.refetch()}>Retry</button></p>;
  return <GitHubApplicationForm key={`${props.scope.tenantId}:${props.scope.environmentId}:${configuration.data.revision}`} {...props} initial={configuration.data} />;
}
function GitHubApplicationForm({ scope, initial, onClose, onSaved }: Props & { initial: ApplicationStatus }) {
  const cache = useQueryClient();
  const [clientID, setClientID] = useState(initial.client_id), [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  // A stored secret is shown masked until the user chooses to replace it.
  const [changingSecret, setChangingSecret] = useState(false), [copied, setCopied] = useState(false);
  const callback = initial.callback_url;
  async function copyCallback() { try { await navigator.clipboard.writeText(callback); setCopied(true); window.setTimeout(() => setCopied(false), 2500); } catch { setError('Copy failed. Select the callback URL and copy it manually.'); } }
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  usePendingChanges(busy || clientID !== initial.client_id || !!secret);
  async function save() {
    if (request.current) return;
    if (initial.configured && !secret) { setChangingSecret(true); setError('Enter the new client secret. Replacing the configuration needs both credentials.'); return; }
    const controller = new AbortController(); request.current = controller; setBusy(true); setError('');
    try {
      const saved = await enterpriseApi.saveApplication(scope, 'github', { client_id: clientID, client_secret: secret, revision: initial.revision }, controller.signal);
      if (controller.signal.aborted) return;
      cache.setQueryData(['mcp-application', scope.userId, scope.tenantId, scope.environmentId, 'github'], saved);
      setSecret('');
      await onSaved();
    } catch {
      if (!controller.signal.aborted) setError('Could not save the GitHub App. Check the values or reopen configuration if another administrator changed it.');
    } finally {
      if (!controller.signal.aborted) { request.current = null; setBusy(false); }
    }
  }
  return <section className="github-application" aria-label="Configure GitHub App">
    <GitHubSetupGuide callback={initial.callback_url} />
    <form className="github-application-form cp-admin-panel" onSubmit={event => { event.preventDefault(); void save(); }}>
      <h3>Your GitHub App</h3>
      <p className="cp-admin-muted">Saved only for the selected workspace and environment. Each customer uses its own GitHub App.</p>
      {initial.configured ? <div className="cp-admin-notice identity-info"><Info size={18} aria-hidden="true" /><div><strong>Replacing needs both credentials</strong><span>Enter the Client ID and a new client secret. Existing connections can require authorization again when their tokens expire.</span></div></div> : null}
      <div className="github-callback"><span className="github-callback-label">Callback URL</span><div className="github-callback-row"><code className="github-setup-value">{callback}</code><button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => void copyCallback()}>{copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{copied ? 'Copied' : 'Copy'}</button></div><small>Paste this in your GitHub App, in the field "Callback URL". The backend sets this address.</small></div>
      <fieldset disabled={busy}>
        <label className="cp-admin-field">Client ID<input className="cp-admin-input" autoComplete="off" required maxLength={200} value={clientID} onChange={event => setClientID(event.target.value)} /><small>In GitHub: Settings, Developer settings, GitHub Apps, select your app, then General. Copy the Client ID, not the App ID.</small></label>
        <label className="cp-admin-field">Client secret{initial.configured && !changingSecret
          ? <span className="github-secret-row"><input className="cp-admin-input" type="password" disabled value="••••••••••••" aria-label="Stored client secret" /><button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => setChangingSecret(true)}>Change</button></span>
          : <input className="cp-admin-input" type="password" autoComplete="new-password" required maxLength={4096} value={secret} onChange={event => setSecret(event.target.value)} />}
          <small>{initial.configured ? 'A secret is stored and encrypted. It cannot be displayed.' : 'On the same GitHub page, under Client secrets, select Generate a new client secret. It is encrypted after saving.'}</small></label>
      </fieldset>
      {error ? <p role="alert" className="cp-admin-notice" data-tone="danger">{error}</p> : null}
      <footer className="enterprise-review-actions"><button className="cp-admin-button cp-admin-button--ghost" type="button" disabled={busy} onClick={onClose}>Cancel</button><button className="cp-admin-button" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save GitHub App'}</button></footer>
    </form>
  </section>;
}
