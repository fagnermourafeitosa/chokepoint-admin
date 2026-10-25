import { useAuth } from '../../auth/AuthContext';
import { MCPRegistry } from '../../mcp/MCPRegistry';
export function IntegrationsPage() {
 const auth = useAuth();
 if (!auth.session || !auth.workspace || !auth.environment) return <p role="status">Select a workspace and environment.</p>;
 const scope = { userId: auth.session.user.id, tenantId: auth.workspace.tenant_id, environmentId: auth.environment.id };
 return <MCPRegistry key={`${scope.userId}:${scope.tenantId}:${scope.environmentId}`} scope={scope} />;
}
