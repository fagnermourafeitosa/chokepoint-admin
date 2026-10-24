import { Dropdown } from '../ui/dropdown/Dropdown';

type ProfileMenuProps = {
  email: string;
};

export function ProfileMenu({ email }: ProfileMenuProps) {
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
    </Dropdown>
  );
}
