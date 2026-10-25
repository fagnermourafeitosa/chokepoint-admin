import { useAuth } from "../../features/auth/AuthContext";
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
