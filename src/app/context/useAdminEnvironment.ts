import { useContext } from 'react';
import { AdminEnvironmentContext } from './AdminEnvironmentContext';

export function useAdminEnvironment() {
  const environment = useContext(AdminEnvironmentContext);
  if (!environment) throw new Error('Admin environment provider is required');
  return environment;
}
