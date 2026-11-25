import { useAuth } from "../../features/auth/AuthContext";
import { AccountMenuEntry } from "../../features/demo/AccountMenuEntry";
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
      {/* Admin 051: the account area; Admin 066: disabled in the demo. */}
      <AccountMenuEntry />
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
