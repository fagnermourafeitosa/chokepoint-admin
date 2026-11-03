import { NavLink } from 'react-router';
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

// Outer contour of the Anton O and the arrow cut into it: the Xokepoint mark of the home
// (frontend specifications 010 and 011). The arrow O replaces the first O of the wordmark.
const markO = 'M498 16Q287 16 175.5 -111.5Q64 -239 64 -480V-1316Q64 -1542 174.5 -1659.0Q285 -1776 498 -1776Q711 -1776 821.5 -1659.0Q932 -1542 932 -1316V-480Q932 -239 820.5 -111.5Q709 16 498 16Z';
const markArrow = 'M194 -880H794M504 -1170L794 -880L504 -590';
function Wordmark() {
  return <span>X<svg className="cp-admin-wordmark-o" viewBox="0 -1776 996 1792" aria-hidden="true" focusable="false"><path d={markO} /><path className="cp-admin-wordmark-arrow" d={markArrow} /></svg>KEPOINT</span>;
}

export function AdminHeader({ environment, onEnvironmentChange, navigation, accountEmail }: AdminHeaderProps) {
  return (
    <header className="cp-admin-topbar">
      <div className="cp-admin-topbar-inner admin-topbar-inner">
        <NavLink className="cp-admin-brand" to="/" aria-label="Xokepoint home">
          <Wordmark />
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
