import type { AccessTarget } from '../target-context';
import './agent-details.css';
import { useState } from 'react';
import { Pencil, Power, Trash2 } from 'lucide-react';
import type { AgentRecord, AgentScope } from '../agent-api';
import { AgentVisual } from './AgentVisual';
import { DelegationEditor } from '../delegation/DelegationEditor';
import { WaitingBackend } from '../delegation/WaitingBackend';

type AgentDetailsProps = { agent: AgentRecord; scope: AgentScope; target?: AccessTarget; onEdit: () => void; onDelete: () => void };

// Layout prototype: one view replaces the connection graph and the permission editors.
export function AgentDetails({ agent, scope, onEdit, onDelete }: AgentDetailsProps) {
  const [disabled, setDisabled] = useState(false);
  return <section className="cp-admin-panel access-agent-details" aria-label="Selected agent">
    <div className="access-agent-heading"><AgentVisual agent={agent} scope={scope} /><div className="agent-detail-copy"><div className="access-agent-title"><h2>{agent.name}</h2><span className="mcp-badge agent-status" data-tone={disabled ? undefined : 'success'}>{disabled ? 'Disabled' : 'Active'}</span><WaitingBackend spec="032" tip="Turns the agent on or off at once. A disabled agent gets no new token and its next call is rejected." /></div><p>{agent.description}</p><p className="cp-admin-muted">Acts for the subjects that delegate to it</p></div><div className="agent-detail-actions"><button className={`cp-admin-button cp-admin-button--small ${disabled ? 'cp-admin-button--secondary' : 'cp-admin-button--danger-soft'}`} type="button" onClick={() => setDisabled(v => !v)}><Power size={15} aria-hidden="true" />{disabled ? 'Enable agent' : 'Disable agent'}</button><button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" type="button" onClick={onEdit}><Pencil size={15} aria-hidden="true" />Edit</button><button className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" type="button" onClick={onDelete}><Trash2 size={15} aria-hidden="true" />Delete</button></div></div>
    <DelegationEditor key={agent.id} agentName={agent.name} disabled={disabled} />
  </section>;
}
