import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { Building2, Send, UserRound } from 'lucide-react';
import { Wordmark } from '../../components/brand/Wordmark';
import { ProfileMenu } from '../../components/header/ProfileMenu';
import { useAuth } from '../auth/AuthContext';
import '../../layouts/admin-layout.css';
import '../../components/header/admin-header.css';
import './account.css';

// Admin 051: the account area. Its own layout, with no Admin navigation, no
// selectors and no Report-only banner; the same design system.
export function AccountLayout() {
  const auth = useAuth();
  const { pathname } = useLocation();
  const title = pathname.startsWith('/account/info') ? 'Account info' : pathname.startsWith('/account/events-export') ? 'Events export' : 'Workspaces';
  return (
    <div className="admin-layout">
      <title>{`${title} | Account | Xokepoint`}</title>
      <a className="admin-skip-link" href="#main-content">Skip to content</a>
      <header className="cp-admin-topbar">
        <div className="cp-admin-topbar-inner admin-topbar-inner">
          <Link className="cp-admin-brand" to="/account/workspaces" aria-label="Account home"><Wordmark /></Link>
          <span className="admin-nav-divider" aria-hidden="true" />
          <span className="account-topbar-title">Account</span>
          <div className="admin-nav-actions">
            <ProfileMenu email={auth.session?.user.email || auth.session?.user.display_name || ''} />
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

// The sections of the account area, with the design-system inner tabs.
export function AccountTabs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = pathname.startsWith('/account/info') ? 'info' : pathname.startsWith('/account/events-export') ? 'events-export' : 'workspaces';
  const page = (tab: string) => (current === tab ? 'page' : undefined);
  // Admin 053: Events export sits between Workspaces and Account info.
  return (
    <div className="cp-admin-inner-tabs account-tabs" role="group" aria-label="Account sections">
      <button type="button" aria-current={page('workspaces')} onClick={() => navigate('/account/workspaces')}><Building2 size={17} aria-hidden="true" />Workspaces</button>
      <button type="button" aria-current={page('events-export')} onClick={() => navigate('/account/events-export')}><Send size={17} aria-hidden="true" />Events export</button>
      <button type="button" aria-current={page('info')} onClick={() => navigate('/account/info')}><UserRound size={17} aria-hidden="true" />Account info</button>
    </div>
  );
}
