import { useAuth } from '../features/auth/AuthContext';
import { Investigate } from '../features/investigate/Investigate';
export function InvestigatePage() {
  const auth = useAuth();
  if (!auth.session || !auth.workspace || !auth.environment) return <p role="status">Select a workspace and environment.</p>;
  const scope = { userId: auth.session.user.id, tenantId: auth.workspace.tenant_id, environmentId: auth.environment.id };
  return <main id="main-content" className="admin-page cp-admin-container" aria-label="Investigate" tabIndex={-1}><Investigate key={`${scope.userId}:${scope.tenantId}:${scope.environmentId}`} scope={scope} /></main>;
}
