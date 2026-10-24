import { useState } from 'react';
import { useLocation } from 'react-router';
import { navigation } from '../../app/navigation';
import type { Environment } from '../../app/context/AdminEnvironmentContext';

export function useAdminLayout() {
  const { pathname } = useLocation();
  const currentPage = navigation.find(
    ({ path }) => path === pathname || (path !== '/' && pathname.startsWith(`${path}/`)),
  );
  const [environment, setEnvironment] = useState<Environment>('Sandbox');
  return { currentPage, environment, setEnvironment };
}
