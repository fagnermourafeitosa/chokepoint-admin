import { Outlet } from 'react-router';
import { AdminHeader } from '../components/header/AdminHeader';
import { AdminEnvironmentContext } from '../app/context/AdminEnvironmentContext';
import { useAdminLayout } from './hooks/useAdminLayout';
import { navigation } from '../app/navigation';
import './admin-layout.css';

export function AdminLayout() {
  const { currentPage, environment, setEnvironment } = useAdminLayout();

  return (
    <AdminEnvironmentContext.Provider value={environment}>
      <div className="admin-layout" data-environment={environment.toLowerCase()}>
        <title>{`${currentPage?.label ?? 'Admin'} | Chokepoint`}</title>
        <a className="admin-skip-link" href="#main-content">
          Skip to content
        </a>
        <AdminHeader
          environment={environment}
          onEnvironmentChange={setEnvironment}
          navigation={navigation}
          accountEmail="teste@chokpoint.dev"
        />
        <Outlet />
      </div>
    </AdminEnvironmentContext.Provider>
  );
}
