import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
import { lifecycleApi, lifecycleKey } from './api';
import type { LifecycleConfiguration } from './api';

export type LifecycleAction = 'create' | 'rotate' | 'complete' | 'remove';
export type RevealedSecret = { url: string; secret: string };

// The provider retries a failed delivery for at most 15 minutes (Backend 016).
export const providerRetryWindowMs = 15 * 60_000;
export type RotationRisk = 'no-new-secret' | 'recent-previous' | null;
export const secretLeaveMessage = 'The lifecycle secret is still shown and cannot be displayed again. Leave without copying it?';

// useSecretLeaveGuard asks before an app link or a page unload discards the
// one-time secret. BrowserRouter has no navigation blocker, so link clicks are
// intercepted in the capture phase; Link skips navigation when the event is
// already prevented. Browser history buttons are not covered.
export function useSecretLeaveGuard(active: boolean) {
 useEffect(() => {
  if (!active) return;
  const click = (event: MouseEvent) => {
   const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
   // A modified click or a new-tab link keeps this page open.
   const keepsPage = event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link?.getAttribute('target') === '_blank';
   if (!link || keepsPage || event.defaultPrevented || window.confirm(secretLeaveMessage)) return;
   event.preventDefault();
  };
  const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); };
  document.addEventListener('click', click, true);
  window.addEventListener('beforeunload', unload);
  return () => { document.removeEventListener('click', click, true); window.removeEventListener('beforeunload', unload); };
 }, [active]);
}

// rotationRisk reports why completing the rotation now can drop retries that
// the provider still signs with the previous secret.
export function rotationRisk(state: LifecycleConfiguration, now = Date.now()): RotationRisk {
 if (!state.rotation_in_progress) return null;
 if (!state.current_secret_first_accepted_at) return 'no-new-secret';
 const previous = state.previous_secret_last_accepted_at ? Date.parse(state.previous_secret_last_accepted_at) : NaN;
 return now - previous < providerRetryWindowMs ? 'recent-previous' : null;
}

const lifecycleNotices: Record<LifecycleAction, string> = {
 create: 'Auto sync enabled. Copy the secret and create the Keycloak webhook.',
 rotate: 'New secret created. Update the Keycloak webhook secret, then complete the rotation.',
 complete: 'Rotation completed. Chokepoint now rejects the previous secret.',
 remove: 'Lifecycle receiver removed.',
};

export function lifecycleError(action: LifecycleAction, error: unknown): string {
 if (error instanceof HttpError) {
  if (error.status === 409) {
   if (action === 'create') return 'Auto sync is already enabled for this connection. The current state was reloaded.';
   if (action === 'rotate') return 'A secret rotation is already in progress. Complete it before you start another one.';
   if (action === 'complete') return 'No secret rotation is in progress. The current state was reloaded.';
  }
  if (error.status === 404) return 'Auto sync is not configured for this connection anymore. The current state was reloaded.';
  if (error.status === 400 || error.status === 501) return 'Auto sync requires an enabled Keycloak connection with a user directory.';
 }
 return 'The request could not be completed. Retry when the service is available.';
}

export function useLifecycleSync(scope: EnvironmentScope, connectionId: string) {
 const client = useQueryClient();
 const key = lifecycleKey(scope, connectionId);
 const query = useQuery({ queryKey: key, queryFn: ({ signal }) => lifecycleApi.get(scope, connectionId, signal), retry: false });
 const [pending, setPending] = useState(false);
 const [error, setError] = useState('');
 const [notice, setNotice] = useState('');
 const [revealed, setRevealed] = useState<RevealedSecret | null>(null);
 const controller = useRef<AbortController | null>(null);
 useEffect(() => () => controller.current?.abort(), []);

 async function run(action: LifecycleAction): Promise<boolean> {
  if (controller.current) return false;
  const request = new AbortController(); controller.current = request; setPending(true); setError(''); setNotice('');
  try {
   const result = await lifecycleApi[action](scope, connectionId, request.signal);
   if (request.signal.aborted) return false;
   // The secret exists only in this response; it is kept in component state
   // and never written to the query cache.
   if (result.secret && result.receiver_url) setRevealed({ url: result.receiver_url, secret: result.secret });
   client.setQueryData(key, { ...result, secret: undefined });
   setNotice(lifecycleNotices[action]);
   return true;
  } catch (reason) {
   if (!request.signal.aborted) { setError(lifecycleError(action, reason)); void client.invalidateQueries({ queryKey: key }); }
   return false;
  } finally {
   if (!request.signal.aborted) { controller.current = null; setPending(false); }
  }
 }
 return { ...query, pending, error, notice, revealed, dismissSecret: () => setRevealed(null), run };
}
