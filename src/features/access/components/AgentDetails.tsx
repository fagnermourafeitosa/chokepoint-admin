import type { AccessTarget } from '../target-context';
import './agent-details.css';
import { useEffect, useState } from 'react';
import { AgentGraph } from '../graph/AgentGraph';
import { Pencil, Trash2 } from 'lucide-react';
import type { AgentRecord, AgentScope } from '../agent-api';
import { AgentVisual } from './AgentVisual';
import { PermissionManager } from '../../permissions/PermissionManager';

type AgentDetailsProps = { agent: AgentRecord; scope: AgentScope; target?: AccessTarget; onEdit: () => void; onDelete: () => void };

// Agent metadata remains separate from the revisioned permission definition.
// The keyed editor drops scoped drafts and aborts requests when selection changes.
export function AgentDetails({ agent, scope, target, onEdit, onDelete }: AgentDetailsProps) {
  const [tab, setTab] = useState<'graph' | 'permissions'>(target ? 'permissions' : 'graph');
  const [permissionsOpened, setPermissionsOpened] = useState(!!target);
  useEffect(() => { if (target) { setTab('permissions'); setPermissionsOpened(true); } }, [target?.section, target?.policyId, target?.tool]);
  function openPermissions() { setPermissionsOpened(true); setTab('permissions'); }
  return <section className="cp-admin-panel access-agent-details" aria-label="Selected agent">
    <div className="access-agent-heading"><AgentVisual agent={agent} scope={scope} /><div className="agent-detail-copy"><div className="access-agent-title"><h2>{agent.name}</h2></div><p>{agent.description}</p><p className="cp-admin-muted">Permission grouping for associated users</p></div><div className="agent-detail-actions"><button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" type="button" onClick={onEdit}><Pencil size={15} aria-hidden="true" />Edit</button><button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" type="button" onClick={onDelete}><Trash2 size={15} aria-hidden="true" />Delete</button></div></div>
    <div className="access-detail-tabs" role="group" aria-label="Agent views"><button type="button" aria-pressed={tab === 'graph'} onClick={() => setTab('graph')}>Connection graph</button><button type="button" aria-pressed={tab === 'permissions'} onClick={openPermissions}>Permissions</button></div>
    <div hidden={tab !== 'graph'}><AgentGraph key={agent.id} agent={agent} scope={scope} onPermissions={openPermissions} /></div>
    {permissionsOpened ? <div hidden={tab !== 'permissions'}><PermissionManager key={`${scope.userId}:${scope.tenantId}:${scope.environmentId}:${agent.id}`} scope={scope} agentId={agent.id} target={target} /></div> : null}
  </section>;
}
