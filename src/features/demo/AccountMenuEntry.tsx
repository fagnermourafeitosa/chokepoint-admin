import { Link } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { isDemoSession } from "./demo";

// Admin 051, Admin 066: the Account entry of the profile menu, disabled in the demo.
export function AccountMenuEntry() {
  const a = useAuth();
  return isDemoSession(a.session) ? (
    <button type="button" className="admin-dropdown-option" disabled title="Not available in the demo">
      Account
    </button>
  ) : (
    <Link className="admin-dropdown-option" to="/account/workspaces">
      Account
    </Link>
  );
}
