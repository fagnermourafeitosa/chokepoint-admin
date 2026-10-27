import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { EnvironmentScope } from '../../access/environment-scope';
import { usePendingChanges } from '../../auth/pending/PendingChanges';
import { enterpriseApi, type ApplicationStatus } from './api';
import { GitHubSetupGuide } from './GitHubSetupGuide';

type Props = { scope: EnvironmentScope; onClose: () => void; onSaved: () => Promise<void> };
export function GitHubApplication(props: Props) {
  const configuration = useQuery({ queryKey: ['mcp-application', props.scope.userId, props.scope.tenantId, props.scope.environmentId, 'github'], queryFn: ({ signal }) => enterpriseApi.application(props.scope, 'github', signal), staleTime: 0, retry: false });
  if (configuration.isPending) return <p role="status">Loading GitHub application…</p>;
  if (configuration.isError) return <p role="alert">Could not load your GitHub application. <button className="cp-admin-button" onClick={() => void configuration.refetch()}>Retry</button></p>;
  return <GitHubApplicationForm key={`${props.scope.tenantId}:${props.scope.environmentId}:${configuration.data.revision}`} {...props} initial={configuration.data} />;
}
function GitHubApplicationForm({ scope, initial, onClose, onSaved }: Props & { initial: ApplicationStatus }) {
  const cache = useQueryClient();
  const [clientID, setClientID] = useState(initial.client_id), [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  usePendingChanges(busy || clientID !== initial.client_id || !!secret);
  async function save() {
    if (request.current) return;
    const controller = new AbortController(); request.current = controller; setBusy(true); setError('');
    try {
      const saved = await enterpriseApi.saveApplication(scope, 'github', { client_id: clientID, client_secret: secret, revision: initial.revision }, controller.signal);
      if (controller.signal.aborted) return;
      cache.setQueryData(['mcp-application', scope.userId, scope.tenantId, scope.environmentId, 'github'], saved);
      setSecret('');
      await onSaved();
    } catch {
      if (!controller.signal.aborted) setError('Could not save the application. Check the values or reopen configuration if another administrator changed it.');
    } finally {
      if (!controller.signal.aborted) { request.current = null; setBusy(false); }
    }
  }
  return <section className="github-application" aria-label="Configure GitHub application">
    <GitHubSetupGuide />
    <form className="github-application-form cp-admin-panel" onSubmit={event => { event.preventDefault(); void save(); }}>
      <h3>Your GitHub application</h3>
      <p className="cp-admin-muted">Saved only for the selected workspace and environment. Each customer uses its own application.</p>
      {initial.configured ? <p className="cp-admin-notice">Replacing this configuration requires both credentials. Existing connections can require authorization again when their tokens expire.</p> : null}
      <fieldset disabled={busy}>
        <label className="cp-admin-field">Client ID<input className="cp-admin-input" autoComplete="off" required maxLength={200} value={clientID} onChange={event => setClientID(event.target.value)} /><small>Copy the Client ID from your GitHub App settings.</small></label>
        <label className="cp-admin-field">Client secret<input className="cp-admin-input" type="password" autoComplete="new-password" required maxLength={4096} value={secret} onChange={event => setSecret(event.target.value)} /><small>{initial.configured ? 'A secret is stored. Enter a new secret to replace the configuration.' : 'Generate a client secret in GitHub. It is encrypted after saving.'}</small></label>
      </fieldset>
      {error ? <p role="alert" className="cp-admin-notice" data-tone="danger">{error}</p> : null}
      <footer className="enterprise-review-actions"><button className="cp-admin-button cp-admin-button--ghost" type="button" disabled={busy} onClick={onClose}>Cancel</button><button className="cp-admin-button" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save GitHub application'}</button></footer>
    </form>
  </section>;
}
