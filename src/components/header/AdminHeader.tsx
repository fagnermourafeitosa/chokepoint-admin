import { NavLink } from 'react-router';
import logo from '../../assets/logo.png';
import { EnvironmentSelector } from './EnvironmentSelector';
import type { Environment } from '../../app/context/AdminEnvironmentContext';
import { PrimaryNavigation } from './PrimaryNavigation';
import { ProfileMenu } from './ProfileMenu';
import { WorkspaceSelector } from './WorkspaceSelector';
import './admin-header.css';

type AdminHeaderProps = {
  environment: Environment;
  onEnvironmentChange: (environment: Environment) => void;
  navigation: readonly { path: string; label: string }[];
  accountEmail: string;
};

export function AdminHeader({ environment, onEnvironmentChange, navigation, accountEmail }: AdminHeaderProps) {
  return (
    <header className="cp-admin-topbar">
      <div className="cp-admin-topbar-inner admin-topbar-inner">
        <NavLink className="cp-admin-brand" to="/" aria-label="Chokepoint home">
          <img src={logo} alt="Chokepoint" />
        </NavLink>
        <span className="admin-nav-divider" aria-hidden="true" />
        <WorkspaceSelector />
        <EnvironmentSelector value={environment} onChange={onEnvironmentChange} />
        <PrimaryNavigation items={navigation} />
        <div className="admin-nav-actions">
          <ProfileMenu email={accountEmail} />
        </div>
      </div>
    </header>
  );
}
