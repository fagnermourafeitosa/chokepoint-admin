import { useAuth } from '../features/auth/AuthContext';
import { AttentionOverview } from '../features/attention/AttentionOverview';

export function OverviewPage() {
  const auth = useAuth();
  if (!auth.session || !auth.workspace || !auth.environment) return <p role="status">Select a workspace and environment.</p>;
  const scope = { userId: auth.session.user.id, tenantId: auth.workspace.tenant_id, environmentId: auth.environment.id };
  return (
    <main id="main-content" className="admin-page cp-admin-container cp-admin-container--home" aria-label="Overview" tabIndex={-1}>
      <AttentionOverview key={`${scope.userId}:${scope.tenantId}:${scope.environmentId}`} scope={scope} />
    </main>
  );
}
