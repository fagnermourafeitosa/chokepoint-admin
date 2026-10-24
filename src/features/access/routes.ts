import { ContextSourcesPage } from './pages/ContextSourcesPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { PermissionsPage } from './pages/PermissionsPage';

export const accessRoutes = [
  { path: '', Page: PermissionsPage },
  { path: 'context-sources', Page: ContextSourcesPage },
  { path: 'integrations', Page: IntegrationsPage },
] as const;
