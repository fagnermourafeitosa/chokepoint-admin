import { useAuth } from '../../auth/AuthContext';
import { SourcesPage } from '../../sources/SourcesPage';
export function ContextSourcesPage(){
 const auth=useAuth();
 if(!auth.session||!auth.workspace||!auth.environment)return <p>Select a workspace and environment.</p>;
 const scope={userId:auth.session.user.id,tenantId:auth.workspace.tenant_id,environmentId:auth.environment.id};
 return <SourcesPage key={`${scope.userId}:${scope.tenantId}:${scope.environmentId}`} scope={scope}/>;
}
