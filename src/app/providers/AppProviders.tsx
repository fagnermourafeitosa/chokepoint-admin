import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAppProviders } from './useAppProviders';

export function AppProviders({ children }: { children: ReactNode }) {
  const { queryClient } = useAppProviders();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
