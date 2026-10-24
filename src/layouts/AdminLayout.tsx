import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { AdminHeader } from '../components/header/AdminHeader';
import type { Environment } from '../components/header/EnvironmentSelector';
import { navigation } from '../app/navigation';
import './admin-layout.css';

export function AdminLayout() {
  const { pathname } = useLocation();
  const currentPage = navigation.find(({ path }) => path === pathname);
  const [environment, setEnvironment] = useState<Environment>('Sandbox');

  return (
    <div className="admin-layout" data-environment={environment.toLowerCase()}>
      <title>{`${currentPage?.label ?? 'Admin'} | Chokepoint`}</title>
      <a className="admin-skip-link" href="#main-content">Skip to content</a>
      <AdminHeader
        environment={environment}
        onEnvironmentChange={setEnvironment}
        navigation={navigation}
        accountEmail="teste@chokpoint.dev"
      />
      <Outlet />
    </div>
  );
}
