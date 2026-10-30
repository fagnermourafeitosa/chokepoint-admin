import { useEffect, useRef, useState } from 'react';
import { useBlocker, useLocation } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog } from '../../components/ui/dialog/Dialog';
import { attentionApi, attentionKey } from './api';
import type { EnvironmentScope } from '../access/environment-scope';

// The guard belongs to an opened Inbox item, not to individual decision rows.
export function SignalDetailGuard({ scope }: { scope: EnvironmentScope }) {
  const location = useLocation();
  const id = new URLSearchParams(location.search).get('signal_id');
  return id ? <OpenedSignalDetail key={id} scope={scope} id={id} /> : null;
}
function OpenedSignalDetail({ scope, id }: { scope: EnvironmentScope; id: string }) {
  const client = useQueryClient();
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const attempted = useRef<string | null>(null);
  const key = [...attentionKey(scope), 'detail', id];
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => attentionApi.get(scope, id!, signal),
    enabled: !!id,
    retry: false,
  });
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!query.data || query.isError || query.data.status === 'resolved') return false;
    const next = new URLSearchParams(nextLocation.search);
    return (
      currentLocation.pathname !== nextLocation.pathname ||
      next.get('signal_id') !== id ||
      next.get('window_start') !== new URLSearchParams(currentLocation.search).get('window_start')
    );
  });
  async function review() {
    if (!id) return;
    setBusy(true);
    setError('');
    const request = new AbortController();
    controller.current = request;
    try {
      const item = await attentionApi.review(scope, id, request.signal);
      if (request.signal.aborted) return;
      client.setQueryData(key, item);
      await client.invalidateQueries({ queryKey: attentionKey(scope) });
    } catch {
      if (!request.signal.aborted)
        setError('This item could not be marked as reviewed. Try again before leaving.');
    } finally {
      if (!request.signal.aborted) {
        controller.current = null;
        setBusy(false);
      }
    }
  }
  useEffect(() => {
    if (id && query.data?.status === 'open' && attempted.current !== id) {
      attempted.current = id;
      void review();
    }
  }, [id, query.data?.status]);
  async function leave(resolve: boolean) {
    if (!id || busy) return;
    setBusy(true);
    setError('');
    const request = new AbortController();
    controller.current = request;
    try {
      const item = resolve
        ? await attentionApi.resolve(scope, id, request.signal)
        : await attentionApi.review(scope, id, request.signal);
      if (request.signal.aborted) return;
      client.setQueryData(key, item);
      await client.invalidateQueries({ queryKey: attentionKey(scope) });
      if (!request.signal.aborted) blocker.proceed?.();
    } catch {
      if (!request.signal.aborted)
        setError(
          `The item could not be ${resolve ? 'resolved' : 'reviewed'}. You are still in the detail. Try again.`,
        );
    } finally {
      if (!request.signal.aborted) {
        controller.current = null;
        setBusy(false);
      }
    }
  }
  if (!id) return null;
  return (
    <>
      {query.isError || error ? (
        <div role="alert" className="cp-admin-notice signal-detail-notice">
          <div>
            <strong>Item status could not be saved</strong>
            <span>
              {error || 'The Inbox item could not be loaded. Its status has not been confirmed.'}
            </span>
          </div>
          <button
            className="cp-admin-button cp-admin-button--secondary"
            disabled={busy}
            onClick={() => {
              if (query.isError) void query.refetch();
              else void review();
            }}
          >
            Retry
          </button>
        </div>
      ) : null}
      {blocker.state === 'blocked' ? (
        <Dialog
          title="Finish reviewing this item"
          onClose={() => {
            if (!busy) blocker.reset();
          }}
        >
          <div className="admin-dialog-body">
            <p>Keep this item reviewed, or mark it resolved if you have finished treating it.</p>
            <p className="cp-admin-muted">
              Resolved records your decision. It does not verify that future calls will succeed.
            </p>
            {error ? <p role="alert">{error}</p> : null}
          </div>
          <div className="admin-dialog-actions">
            <button
              className="cp-admin-button cp-admin-button--ghost"
              disabled={busy}
              onClick={() => blocker.reset()}
            >
              Cancel
            </button>
            <button
              className="cp-admin-button cp-admin-button--secondary"
              disabled={busy}
              onClick={() => void leave(false)}
            >
              Keep reviewed
            </button>
            <button className="cp-admin-button" disabled={busy} onClick={() => void leave(true)}>
              {busy ? 'Saving…' : 'Mark resolved'}
            </button>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
