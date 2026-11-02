import type { AccessTarget } from '../target-context';
import './agent-details.css';
import { useState } from 'react';
import { Pencil, Power, Trash2 } from 'lucide-react';
import { HttpError } from '../../../api/http-client';
import { agentApi, type AgentRecord, type AgentScope } from '../agent-api';
import { AgentVisual } from './AgentVisual';
import { DelegationEditor } from '../delegation/DelegationEditor';

type AgentDetailsProps = { agent: AgentRecord; scope: AgentScope; target?: AccessTarget; onEdit: () => void; onDelete: () => void; onChanged: (agent: AgentRecord) => void; onReload: () => void };

// The kill switch (Admin 031, Backend 032 Resolved Decision 2): a disabled agent
// gets no new token and its next call is rejected. Its configuration and key stay.
function AgentStatusAction({ agent, scope, onChanged, onReload }: Pick<AgentDetailsProps, 'agent' | 'scope' | 'onChanged' | 'onReload'>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; conflict: boolean }>();
  const disabled = agent.status === 'disabled';
  async function change() {
    setBusy(true); setError(undefined);
    try {
      onChanged(await agentApi.setStatus(scope, agent.id, disabled ? 'active' : 'disabled', agent.revision));
    } catch (cause) {
      const conflict = cause instanceof HttpError && cause.status === 409;
      setError({ conflict, message: conflict ? 'The agent changed in another session. Reload to see its current status.' : `Could not ${disabled ? 'enable' : 'disable'} the agent. Retry when the service is available.` });
    } finally { setBusy(false); }
  }
  return <>
    <button className={`cp-admin-button cp-admin-button--small ${disabled ? 'cp-admin-button--secondary' : 'cp-admin-button--danger-soft'}`} type="button" disabled={busy} onClick={() => void change()}><Power size={15} aria-hidden="true" />{disabled ? 'Enable agent' : 'Disable agent'}</button>
    {error ? <div role="alert" className="cp-admin-notice access-agent-status-error" data-tone="danger">{error.message}{error.conflict ? <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => { setError(undefined); onReload(); }}>Reload</button> : null}</div> : null}
  </>;
}

// Agent metadata remains separate from the revisioned permission document.
// One "Delegation and access" view replaces the connection graph and the permission editors (Admin 026).
// The keyed editor drops scoped drafts and aborts requests when selection changes.
export function AgentDetails({ agent, scope, target, onEdit, onDelete, onChanged, onReload }: AgentDetailsProps) {
  const disabled = agent.status === 'disabled';
  return <section className="cp-admin-panel access-agent-details" aria-label="Selected agent">
    <div className="access-agent-heading"><AgentVisual agent={agent} scope={scope} /><div className="agent-detail-copy"><div className="access-agent-title"><h2>{agent.name}</h2><span className="mcp-badge" data-tone={disabled ? undefined : 'success'}>{disabled ? 'Disabled' : 'Active'}</span></div><p>{agent.description}</p><p className="cp-admin-muted">{disabled ? 'Disabled: it gets no token, and its next call is rejected.' : 'Acts for the subjects that delegate to it'}</p></div><div className="agent-detail-actions"><AgentStatusAction key={agent.id} agent={agent} scope={scope} onChanged={onChanged} onReload={onReload} /><button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" type="button" onClick={onEdit}><Pencil size={15} aria-hidden="true" />Edit</button><button className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" type="button" onClick={onDelete}><Trash2 size={15} aria-hidden="true" />Delete</button></div></div>
    <DelegationEditor key={`${scope.userId}:${scope.tenantId}:${scope.environmentId}:${agent.id}`} scope={scope} agentId={agent.id} agentName={agent.name} target={target} />
  </section>;
}
