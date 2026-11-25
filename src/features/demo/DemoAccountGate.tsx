import { Navigate, Outlet } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { isDemoSession } from "./demo";

// Admin 066: the account area is not part of the demo. Its paths open the Admin of the demo
// workspace, which RequireSession opens in its Sandbox.
export function DemoAccountGate() {
  const a = useAuth();
  return isDemoSession(a.session) ? <Navigate to="/" replace /> : <Outlet />;
}
