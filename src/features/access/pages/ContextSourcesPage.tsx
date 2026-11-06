import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { SourcesPage } from '../../sources/SourcesPage';

// Opened from Add trusted attributes in the panel of a tool (Admin 048): a banner names the agent
// and the tool, and Back returns to the panel of that tool.
function ReturnBanner({ params }: { params: URLSearchParams }) {
  const navigate = useNavigate();
  const agentId = params.get('agent_id'), serverId = params.get('server_id'), tool = params.get('tool');
  if (!agentId || !serverId || !tool) return null;
  const name = `${params.get('agent_name') || 'the agent'} · ${tool}`;
  return <div className="cp-admin-notice context-return-banner" role="status">
    <div><strong>Adding trusted attributes for {name}</strong><span>Add a binding for this tool, then go back to its rules.</span></div>
    <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" onClick={() => navigate(`/access?${new URLSearchParams({ agent_id: agentId, server_id: serverId, tool, section: 'grants' })}`)}><ArrowLeft size={15} aria-hidden="true" />Back to {name}</button>
  </div>;
}

export function ContextSourcesPage(){
 const auth=useAuth();
 const [params]=useSearchParams();
 if(!auth.session||!auth.workspace||!auth.environment)return <p>Select a workspace and environment.</p>;
 const scope={userId:auth.session.user.id,tenantId:auth.workspace.tenant_id,environmentId:auth.environment.id};
 return <><ReturnBanner params={params}/><SourcesPage key={`${scope.userId}:${scope.tenantId}:${scope.environmentId}`} scope={scope}/></>;
}
