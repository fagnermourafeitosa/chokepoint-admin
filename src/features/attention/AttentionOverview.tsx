import { OverviewDashboard } from '../overview/OverviewDashboard';
import { useAuth } from '../auth/AuthContext';
import type { EnvironmentScope } from '../access/environment-scope';
export function AttentionOverview({ scope }: { scope: EnvironmentScope }) {
  const auth = useAuth();
  return <OverviewDashboard scope={scope} environment={auth.environment?.name || 'Environment'} />;
}
