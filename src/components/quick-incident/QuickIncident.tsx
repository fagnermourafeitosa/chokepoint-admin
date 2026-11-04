import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowRight, Bug, Search, X } from 'lucide-react';
import { HttpError } from '../../api/http-client';
import { useAuth } from '../../features/auth/AuthContext';
import { utcTime } from '../../features/investigate/TraceUI';
import { incidentApi, incidentLabels, incidentRoutes, normalizeCode, type Incident } from './api';
import './quick-incident.css';

// Quick incident (Admin 039): paste the reference code of a refusal and open
// its inspector. It looks only in the current environment (Backend 053).
function SearchBug({ size = 16 }: { size?: number }) {
  return (
    <span className="quick-incident-glyph" style={{ width: size, height: size }} aria-hidden="true">
      <Search size={size} strokeWidth={2.2} />
      <Bug size={Math.round(size * 0.42)} strokeWidth={2.6} className="quick-incident-glyph-bug" />
    </span>
  );
}

type Status =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'format' }
  | { kind: 'missing'; code: string }
  | { kind: 'several'; items: Incident[] }
  | { kind: 'error' };

export function QuickIncident() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const linked = params.get('incident');
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  const scope = auth.session && auth.workspace && auth.environment
    ? { userId: auth.session.user.id, tenantId: auth.workspace.tenant_id, environmentId: auth.environment.id }
    : undefined;

  function close() {
    request.current?.abort();
    setOpen(false);
    setValue('');
    setStatus({ kind: 'idle' });
  }

  function go(item: Incident) {
    close();
    navigate(incidentRoutes[item.kind](item.id));
  }

  async function find(raw: string) {
    const code = normalizeCode(raw);
    if (!code) return setStatus({ kind: 'format' });
    if (!scope) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setStatus({ kind: 'busy' });
    try {
      const result = await incidentApi.find(scope, code, controller.signal);
      if (controller.signal.aborted) return;
      if (result.items.length === 1) go(result.items[0]);
      else if (result.items.length > 1) setStatus({ kind: 'several', items: result.items });
      else setStatus({ kind: 'missing', code });
    } catch (error) {
      if (controller.signal.aborted) return;
      setStatus(error instanceof HttpError && error.status === 400 ? { kind: 'format' } : { kind: 'error' });
    }
  }

  // A link with ?incident={code} runs the lookup once, then leaves the URL clean.
  useEffect(() => {
    if (!linked || !scope) return;
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete('incident');
      return next;
    }, { replace: true });
    setOpen(true);
    setValue(linked);
    void find(linked);
    // find reads the current scope; the effect runs once per linked code.
  }, [linked, scope?.environmentId]);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
      // A modal dialog or side panel is on top: the field would open behind it.
      const covered = document.querySelector('dialog[open]') !== null;
      if (e.key === '/' && !typing && !covered && !open && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }
    }
    function onPointer(e: MouseEvent) {
      if (open && root.current && !root.current.contains(e.target as Node)) close();
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onPointer);
    };
  });

  // A new environment makes an open lookup and its message stale: close both.
  const environmentId = scope?.environmentId;
  const shown = useRef(environmentId);
  useEffect(() => {
    if (shown.current === environmentId) return;
    shown.current = environmentId;
    close();
  }, [environmentId]);
  useEffect(() => () => request.current?.abort(), []);

  if (!open)
    return (
      <div className="quick-incident" ref={root}>
        <button type="button" className="quick-incident-trigger" onClick={() => setOpen(true)} aria-keyshortcuts="/">
          <SearchBug />
          <span>Quick incident</span>
          <kbd>/</kbd>
        </button>
      </div>
    );

  return (
    <div className="quick-incident is-open" ref={root}>
      <form
        className="quick-incident-form"
        role="search"
        aria-label="Quick incident"
        onSubmit={(e) => {
          e.preventDefault();
          void find(value);
        }}
      >
        <label className="attention-sr-only" htmlFor="quick-incident-code">
          Reference code
        </label>
        <input
          ref={input}
          id="quick-incident-code"
          className="quick-incident-input"
          placeholder="k3f7-x2ab"
          autoComplete="off"
          spellCheck={false}
          maxLength={16}
          value={value}
          aria-invalid={status.kind === 'format'}
          aria-describedby="quick-incident-status"
          onChange={(e) => {
            setValue(e.target.value);
            if (status.kind !== 'busy') setStatus({ kind: 'idle' });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') close();
          }}
        />
        <button type="submit" className="quick-incident-go" aria-label="Find incident" disabled={status.kind === 'busy'}>
          <SearchBug />
        </button>
        <button type="button" className="quick-incident-close" aria-label="Close" onClick={close}>
          <X size={14} />
        </button>
      </form>
      <div id="quick-incident-status" className="quick-incident-panel" role="status" aria-live="polite">
        {status.kind === 'idle' ? (
          <>
            <p>Paste the code a person or a developer sent you.</p>
            <ul>
              <li>Refused harness login page</li>
              <li>Denied tool call</li>
              <li>Refused token exchange</li>
            </ul>
          </>
        ) : null}
        {status.kind === 'busy' ? <p>Looking in {auth.environment?.name}…</p> : null}
        {status.kind === 'format' ? <p className="is-warn">A reference code has 8 characters, like k3f7-x2ab.</p> : null}
        {status.kind === 'missing' ? (
          <p className="is-warn">
            No refusal with <code>{status.code}</code> in {auth.environment?.name}. Check the code and the environment named with it. Codes older than the retained
            history are deleted.
          </p>
        ) : null}
        {status.kind === 'several' ? (
          <>
            <p className="is-warn">{status.items.length} refusals have this code. Choose one.</p>
            <ul className="quick-incident-matches">
              {status.items.map((item) => (
                <li key={`${item.kind}:${item.id}`}>
                  <button type="button" onClick={() => go(item)}>
                    <span>{incidentLabels[item.kind]}</span>
                    <small>{utcTime(item.occurred_at)}</small>
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {status.kind === 'error' ? <p className="is-warn">The lookup could not be completed. Try again.</p> : null}
      </div>
    </div>
  );
}
