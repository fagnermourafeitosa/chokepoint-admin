import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router";
import { AuthContext, useAuth } from "./AuthContext";
import { useAuthState } from "./useAuthState";
import { AuthStatus } from "./AuthPages";
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthState();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
export function RequireSession() {
  const a = useAuth();
  if (a.loading || a.failed || a.signingOut || a.logoutFailed)
    return <AuthStatus />;
  if (!a.session) return <Navigate to="/login" replace />;
  if (a.contextLoading || a.contextFailed) return <AuthStatus />;
  if (!a.workspace || !a.environment)
    return <Navigate to="/workspaces" replace />;
  return (
    <Outlet
      key={`${a.session.user.id}:${a.workspace.tenant_id}:${a.environment.id}`}
    />
  );
}
