import { AppProviders } from './providers/AppProviders';
import { AppRoutes } from './AppRoutes';

export function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
