import type { ReactNode } from "react";
import { useLoginAction } from "./useLoginAction";
import { useWorkspaceOnboarding } from "./useWorkspaceOnboarding";
import { Link, Navigate } from "react-router";
import logo from "../../assets/logo.png";
import { useAuth } from "./AuthContext";

import "./auth.css";

export function AuthFrame({ children, publicEntry = false }: { children: ReactNode; publicEntry?: boolean }) {
  return (
    <main className={publicEntry ? "auth-page auth-page--public" : "auth-page"}>
      <div className="auth-region">
        {publicEntry ? <span className="auth-public-logo">CHOKEPOINT</span> : <img className="auth-logo" src={logo} alt="Chokepoint" />}
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
export function LoginPage({ signup = false }: { signup?: boolean }) {
  const a = useAuth();
  const { opening, start } = useLoginAction();
  if (a.loading || a.failed || a.signingOut || a.logoutFailed)
    return <AuthStatus />;
  if (a.session) return <Navigate to="/workspaces" replace />;
  return (
    <AuthFrame publicEntry>
      <h1>{signup ? "Create your account" : "Sign in to Chokepoint"}</h1>
      <p>
        {signup
          ? "Create an account to set up your workspace."
          : "Use your account to access your workspace."}
      </p>
      {new URLSearchParams(window.location.search).has("error") ? (
        <p className="auth-error" role="alert">
          Sign-in could not be completed. Please try again.
        </p>
      ) : null}
      <form
        method="post"
        action={`/api/v1/auth/${signup ? "signup" : "login"}`}
        onSubmit={start}
      >
        <button className="cp-admin-button auth-primary" disabled={opening}>
          {opening
            ? "Opening sign-in…"
            : signup
              ? "Continue to sign up"
              : "Continue to sign in"}
        </button>
      </form>
      <p className="auth-secondary">
        {signup ? "Already have an account?" : "New to Chokepoint?"}{" "}
        <Link to={signup ? "/login" : "/signup"}>
          {signup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </AuthFrame>
  );
}
export function WorkspacePage() {
  const a = useAuth();
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
  if (a.workspace && a.environment) return <Navigate to="/" replace />;
  return (
    <AuthFrame>
      <h1>
        {a.workspaces.length
          ? "Choose your workspace"
          : "You do not have access to a workspace."}
      </h1>
      {a.workspaces.map((w) => (
        <button
          className="cp-admin-button auth-choice"
          key={w.tenant_id}
          onClick={() => a.chooseWorkspace(w)}
        >
          {w.name}
        </button>
      ))}
      {a.workspace && !a.environments.length ? (
        <p role="status">No environments are available for this workspace.</p>
      ) : null}
      {a.workspace
        ? a.environments.map((e) => (
            <button
              className="cp-admin-button auth-choice"
              key={e.id}
              onClick={() => a.chooseEnvironment(e.id)}
            >
              {e.name === "sandbox" ? "Sandbox" : "Production"}
            </button>
          ))
        : null}
      {!a.workspaces.length && a.session?.user.can_create_workspace ? (
        <Link
          className="cp-admin-button auth-choice"
          to="/onboarding/workspace"
        >
          Create your first workspace
        </Link>
      ) : null}
      <button
        className="cp-admin-button cp-admin-button--ghost auth-choice"
        onClick={() => void a.logout()}
      >
        Sign out
      </button>
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
    return <Navigate to="/workspaces" replace />;
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
