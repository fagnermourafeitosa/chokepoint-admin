import { useEffect, useRef, useState, type ReactNode } from "react";
import { PreparingSteps } from "../onboarding/PreparingSteps";
import { useLoginAction } from "./useLoginAction";
import { useWorkspaceOnboarding } from "./useWorkspaceOnboarding";
import { Navigate } from "react-router";
import { useAuth } from "./AuthContext";

import { Wordmark } from "../../components/brand/Wordmark";
import "./auth.css";

export function AuthFrame({ children, publicEntry = false }: { children: ReactNode; publicEntry?: boolean }) {
  return (
    <main className={publicEntry ? "auth-page auth-page--public" : "auth-page"}>
      <div className="auth-region">
        <span className="auth-public-logo" role="img" aria-label="Xokepoint"><Wordmark /></span>
        {children}
      </div>
    </main>
  );
}
export function AuthStatus() {
  const a = useAuth();
  if (a.signingOut)
    return (
      <AuthFrame>
        <p role="status">Signing out…</p>
      </AuthFrame>
    );
  if (a.logoutFailed)
    return (
      <AuthFrame>
        <h1>Sign-out could not be confirmed</h1>
        <p>Your private view is hidden. Try again to end your session.</p>
        <button className="cp-admin-button" onClick={() => void a.logout()}>
          Try sign out again
        </button>
      </AuthFrame>
    );
  if (a.loading || a.contextLoading)
    return (
      <AuthFrame>
        <p role="status">Checking your access…</p>
      </AuthFrame>
    );
  return (
    <AuthFrame>
      <h1>Could not check your access</h1>
      <p role="alert">The service is unavailable. Please try again.</p>
      <button className="cp-admin-button" onClick={a.retry}>
        Try again
      </button>
    </AuthFrame>
  );
}
// Admin 067, decision 2a: the document of this page was loaded by the Back or Forward button.
// The navigation entry describes the first load of the document, so it counts only when that
// load was /login itself, not an Admin page that later routed here.
function arrivedByBack() {
  const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return entry?.type === "back_forward" && new URL(entry.name).pathname === window.location.pathname;
}

// Admin 067: the page starts the sign-in by itself, with the top-level same-origin POST of
// Admin 004. After a failed callback (?error) it waits for Try again, so the browser never loops
// between the Admin and the identity provider.
export function LoginPage({ signup = false }: { signup?: boolean }) {
  const a = useAuth();
  const { opening, start } = useLoginAction();
  const form = useRef<HTMLFormElement>(null);
  const started = useRef(false);
  const [back, setBack] = useState(arrivedByBack);
  const failed = new URLSearchParams(window.location.search).has("error");
  const ready = !a.loading && !a.failed && !a.signingOut && !a.logoutFailed && !a.session;
  useEffect(() => {
    if (!ready || failed || started.current) return;
    started.current = true;
    if (back) history.back();
    else form.current?.requestSubmit();
  }, [ready, failed, back]);
  // A page restored from the back-forward cache runs no effect again: it goes back the same way.
  useEffect(() => {
    const restored = (event: PageTransitionEvent) => {
      if (!event.persisted || failed) return;
      setBack(true);
      history.back();
    };
    window.addEventListener("pageshow", restored);
    return () => window.removeEventListener("pageshow", restored);
  }, [failed]);
  if (a.loading || a.failed || a.signingOut || a.logoutFailed)
    return <AuthStatus />;
  if (a.session) return <Navigate to="/" replace />;
  return (
    <AuthFrame publicEntry>
      {failed ? (
        <>
          <h1>{signup ? "Create your account" : "Sign in"}</h1>
          <p className="auth-error" role="alert">
            Sign-in could not be completed. Please try again.
          </p>
        </>
      ) : null}
      <form
        ref={form}
        method="post"
        action={`/api/v1/auth/${signup ? "signup" : "login"}`}
        onSubmit={start}
      >
        {/* After Back, the button stays usable in case there is no page before /login to go back to. */}
        <button className="cp-admin-button auth-primary" disabled={opening || (!failed && !back)}>
          {opening || (!failed && !back) ? "Opening sign-in…" : failed ? "Try again" : "Sign in"}
        </button>
      </form>
    </AuthFrame>
  );
}
function PreparingWorkspace() {
  return (
    <AuthFrame>
      <h1>Preparing your workspace</h1>
      <PreparingSteps />
    </AuthFrame>
  );
}

export function WorkspaceOnboarding() {
  const a = useAuth();
  const { name, setName, error, pending, submit } = useWorkspaceOnboarding();
  if (
    a.loading ||
    a.failed ||
    a.contextLoading ||
    a.contextFailed ||
    a.signingOut ||
    a.logoutFailed
  )
    return <AuthStatus />;
  if (!a.session) return <Navigate to="/login" replace />;
  if (a.workspaces.length || !a.session.user.can_create_workspace)
    return <Navigate to="/" replace />;
  if (pending) return <PreparingWorkspace />;
  return (
    <AuthFrame>
      <h1>Create your workspace</h1>
      <p>Keep your agents and configuration together.</p>
      <form onSubmit={submit}>
        <label className="cp-admin-field">
          Workspace name
          <input
            className="cp-admin-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
          />
        </label>
        {error ? (
          <p className="auth-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="cp-admin-button auth-primary" disabled={pending}>
          {pending ? "Creating workspace…" : "Create workspace"}
        </button>
      </form>
      <button
        className="cp-admin-button cp-admin-button--ghost auth-choice"
        onClick={() => void a.logout()}
      >
        Sign out
      </button>
    </AuthFrame>
  );
}
