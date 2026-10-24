import { Outlet } from 'react-router';
import { AccessNavigation } from '../features/access/components/AccessNavigation';
import '../features/access/access.css';

export function AccessPage() {
  return (
    <main id="main-content" className="admin-page cp-admin-container access-page" aria-label="Access" tabIndex={-1}>
      <AccessNavigation />
      <Outlet />
    </main>
  );
}
