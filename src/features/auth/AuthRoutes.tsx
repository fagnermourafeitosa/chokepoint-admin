import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router";
import { AuthContext, useAuth } from "./AuthContext";
import { useAuthState } from "./useAuthState";
import { PendingChangesProvider } from "./pending/PendingChanges";
import { AuthStatus } from "./AuthPages";
export function AuthProvider({ children }: { children: ReactNode }) {
  return <PendingChangesProvider><SessionProvider>{children}</SessionProvider></PendingChangesProvider>;
}
function SessionProvider({ children }: { children: ReactNode }) {
  const auth = useAuthState();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
export function RequireSession() {
  const a = useAuth();
  if (a.loading || a.failed || a.signingOut || a.logoutFailed)
    return <AuthStatus />;
  if (!a.session) return <Navigate to="/login" replace />;
  if (a.contextLoading || a.contextFailed) return <AuthStatus />;
  // Admin 005: a person with no workspace creates the first one on the onboarding page.
  if (!a.workspaces.length) return <Navigate to="/onboarding/workspace" replace />;
  // Admin 051: with no chosen workspace, the account area lists them.
  if (!a.workspace || !a.environment)
    return <Navigate to="/account/workspaces" replace />;
  return (
    <Outlet
      key={`${a.session.user.id}:${a.workspace.tenant_id}:${a.environment.id}`}
    />
  );
}

// Admin 051: the account area needs a session, not a chosen workspace.
export function RequireAccount() {
  const a = useAuth();
  if (a.loading || a.failed || a.signingOut || a.logoutFailed)
    return <AuthStatus />;
  if (!a.session) return <Navigate to="/login" replace />;
  return <Outlet key={a.session.user.id} />;
}
