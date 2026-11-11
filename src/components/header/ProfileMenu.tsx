import { useAuth } from "../../features/auth/AuthContext";
import { Link } from "react-router";
import { Dropdown } from "../ui/dropdown/Dropdown";

type ProfileMenuProps = {
  email: string;
};

export function ProfileMenu({ email }: ProfileMenuProps) {
  const a = useAuth();
  return (
    <Dropdown
      group="admin-header"
      label="Open profile"
      triggerClassName="admin-account"
      trigger={email.charAt(0).toUpperCase()}
    >
      <div className="admin-profile">
        <strong>Account</strong>
        <span>{email}</span>
      </div>
      {/* Admin 051: the account area. */}
      <Link className="admin-dropdown-option" to="/account/workspaces">
        Account
      </Link>
      <button
        type="button"
        className="admin-dropdown-option"
        onClick={() => void a.logout()}
      >
        Sign out
      </button>
    </Dropdown>
  );
}
