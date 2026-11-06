import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CircleHelp } from 'lucide-react';
import { Tooltip } from '../../components/ui/tooltip/Tooltip';
import { traceKey } from '../investigate/api';
import { attentionApi, attentionKey } from './api';
import type { SignalStatus } from './api';
import type { EnvironmentScope } from '../access/environment-scope';

export const statusText: Record<SignalStatus, string> = { open: 'Open', reviewed: 'Reviewed', resolved: 'Resolved' };

// The status of one Inbox item and its Mark resolved action (Admin 045). It never
// blocks navigation. With reviewOnOpen, an Open item becomes Reviewed once.
// Mount it with key={id}, so that its saved status belongs to one item.
export function InboxItemStatus({ scope, id, status, reviewOnOpen = false, label, chip = true }: {
  scope: EnvironmentScope;
  id: string;
  status: SignalStatus;
  reviewOnOpen?: boolean;
  label?: string;
  // The Inbox row shows the chip in its When column and the action here.
  chip?: boolean;
}) {
  const client = useQueryClient();
  const [saved, setSaved] = useState<SignalStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const reviewed = useRef(false);
  const alive = useRef(true);
  const current = saved ?? status;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.current?.abort();
    };
  }, []);

  async function refresh() {
    await Promise.all([
      client.invalidateQueries({ queryKey: attentionKey(scope) }),
      client.invalidateQueries({ queryKey: [...traceKey(scope), 'detail'] }),
    ]);
  }

  useEffect(() => {
    if (!reviewOnOpen || status !== 'open' || reviewed.current) return;
    reviewed.current = true;
    // Not aborted on unmount: leaving the inspector does not cancel the review.
    void attentionApi.review(scope, id).then(
      (item) => {
        if (alive.current) setSaved((previous) => previous ?? item.status);
        void refresh();
      },
      () => undefined, // The item stays Open; the Inbox shows its real status.
    );
  }, [reviewOnOpen, status, scope, id]);

  async function resolve() {
    setBusy(true);
    setError(false);
    const request = new AbortController();
    controller.current = request;
    try {
      const item = await attentionApi.resolve(scope, id, request.signal);
      if (request.signal.aborted) return;
      setSaved(item.status);
      await refresh();
    } catch {
      if (!request.signal.aborted) setError(true);
    } finally {
      if (!request.signal.aborted) {
        controller.current = null;
        setBusy(false);
      }
    }
  }

  return (
    <span className="inbox-item-status">
      {label ? <span className="inbox-item-status-label">{label}</span> : null}
      {chip ? <small className="attention-status-chip">{statusText[current]}</small> : null}
      {current !== 'resolved' && !error ? (
        <>
          <button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" disabled={busy} onClick={() => void resolve()}>
            {busy ? 'Saving…' : 'Mark resolved'}
          </button>
          <Tooltip content="Resolved records your decision. It does not verify that future calls will succeed.">
            <CircleHelp size={14} aria-label="About Mark resolved" />
          </Tooltip>
        </>
      ) : null}
      {error ? (
        <span role="alert" className="inbox-item-status-error">
          The item could not be resolved. Try again.
          <button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" disabled={busy} onClick={() => void resolve()}>Retry</button>
        </span>
      ) : null}
    </span>
  );
}
