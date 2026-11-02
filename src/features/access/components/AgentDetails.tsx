import type { AccessTarget } from '../target-context';
import './agent-details.css';
import { Pencil, Trash2 } from 'lucide-react';
import type { AgentRecord, AgentScope } from '../agent-api';
import { AgentVisual } from './AgentVisual';
import { DelegationEditor } from '../delegation/DelegationEditor';

type AgentDetailsProps = { agent: AgentRecord; scope: AgentScope; target?: AccessTarget; onEdit: () => void; onDelete: () => void };

// Agent metadata remains separate from the revisioned permission document.
// One "Delegation and access" view replaces the connection graph and the permission editors (Admin 026).
// The keyed editor drops scoped drafts and aborts requests when selection changes.
export function AgentDetails({ agent, scope, target, onEdit, onDelete }: AgentDetailsProps) {
  return <section className="cp-admin-panel access-agent-details" aria-label="Selected agent">
    <div className="access-agent-heading"><AgentVisual agent={agent} scope={scope} /><div className="agent-detail-copy"><div className="access-agent-title"><h2>{agent.name}</h2></div><p>{agent.description}</p><p className="cp-admin-muted">Acts for the subjects that delegate to it</p></div><div className="agent-detail-actions"><button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" type="button" onClick={onEdit}><Pencil size={15} aria-hidden="true" />Edit</button><button className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" type="button" onClick={onDelete}><Trash2 size={15} aria-hidden="true" />Delete</button></div></div>
    <DelegationEditor key={`${scope.userId}:${scope.tenantId}:${scope.environmentId}:${agent.id}`} scope={scope} agentId={agent.id} agentName={agent.name} target={target} />
  </section>;
}
