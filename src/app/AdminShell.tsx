import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router';
import logo from '../assets/logo.png';
import { HeaderDropdown } from './HeaderDropdown';
import { navigation } from './navigation';

const environments = ['Sandbox', 'Production'] as const;

export function AdminShell() {
  const { pathname } = useLocation();
  const currentPage = navigation.find(({ path }) => path === pathname);
  const [environment, setEnvironment] = useState<(typeof environments)[number]>('Sandbox');

  return (
    <div className="admin-shell" data-environment={environment.toLowerCase()}>
      <title>{`${currentPage?.label ?? 'Admin'} | Chokepoint`}</title>
      <a className="admin-skip-link" href="#main-content">Skip to content</a>
      <header className="cp-admin-topbar">
        <div className="cp-admin-topbar-inner admin-topbar-inner">
          <NavLink className="cp-admin-brand" to="/" aria-label="Chokepoint home">
            <img src={logo} alt="Chokepoint" />
          </NavLink>
          <span className="admin-nav-divider" aria-hidden="true" />
          <HeaderDropdown
            label="Select workspace"
            triggerClassName="admin-workspace"
            trigger={<><span className="admin-workspace-avatar" aria-hidden="true">W</span><span>Workspace</span><ChevronDown size={14} aria-hidden="true" /></>}
          >
            <button type="button" className="admin-dropdown-option" aria-pressed="true">
              <span>Workspace</span><Check size={15} aria-hidden="true" />
            </button>
          </HeaderDropdown>
          <HeaderDropdown
            label={`Select environment: ${environment}`}
            triggerClassName="admin-environment"
            trigger={<><span className="cp-admin-status-dot" aria-hidden="true" />{environment}<ChevronDown size={14} aria-hidden="true" /></>}
          >
            {environments.map((option) => (
              <button
                key={option}
                type="button"
                className="admin-dropdown-option"
                aria-pressed={environment === option}
                onClick={() => setEnvironment(option)}
              >
                <span>{option}</span>{environment === option ? <Check size={15} aria-hidden="true" /> : null}
              </button>
            ))}
          </HeaderDropdown>
          <nav className="cp-admin-topbar-nav admin-primary-nav" aria-label="Primary">
            {navigation.map(({ path, label }) => (
              <NavLink key={path} to={path} end>{label}</NavLink>
            ))}
          </nav>
          <div className="admin-nav-actions">
            <HeaderDropdown label="Open profile" triggerClassName="admin-account" trigger="T">
              <div className="admin-profile">
                <strong>Account</strong>
                <span>teste@chokpoint.dev</span>
              </div>
            </HeaderDropdown>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
