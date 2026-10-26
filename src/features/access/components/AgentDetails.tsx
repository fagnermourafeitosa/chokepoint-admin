import './agent-details.css';
import { Pencil, Trash2 } from 'lucide-react';
import type { AgentRecord, AgentScope } from '../agent-api';
import { AgentVisual } from './AgentVisual';
import { PermissionManager } from '../../permissions/PermissionManager';

type AgentDetailsProps = { agent: AgentRecord; scope: AgentScope; onEdit: () => void; onDelete: () => void };

// Agent metadata remains separate from the revisioned permission definition.
// The keyed editor drops scoped drafts and aborts requests when selection changes.
export function AgentDetails({ agent, scope, onEdit, onDelete }: AgentDetailsProps) {
  return <section className="cp-admin-panel access-agent-details" aria-label="Selected agent">
    <div className="access-agent-heading"><AgentVisual agent={agent} scope={scope} /><div className="agent-detail-copy"><div className="access-agent-title"><h2>{agent.name}</h2></div><p>{agent.description}</p><p className="cp-admin-muted">Permission grouping for associated users</p></div><div className="agent-detail-actions"><button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" type="button" onClick={onEdit}><Pencil size={15} aria-hidden="true" />Edit</button><button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" type="button" onClick={onDelete}><Trash2 size={15} aria-hidden="true" />Delete</button></div></div>
    <PermissionManager key={`${scope.userId}:${scope.tenantId}:${scope.environmentId}:${agent.id}`} scope={scope} agentId={agent.id} />
  </section>;
}
