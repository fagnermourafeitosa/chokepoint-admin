import type { AccessTarget } from '../target-context';
import './agent-details.css';
import { useState } from 'react';
import { Eye, Pencil, Power, ShieldCheck, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ReportOnlyChip } from '../../../components/report-only/ReportOnlyChip';
import { ModeDialog, ReportOnlyNotice, ReviewDateDialog } from './EnforcementControls';
import { RevisionHistory } from '../delegation/RevisionHistory';
import { CatalogProvider } from '../delegation/catalog';
import { HttpError } from '../../../api/http-client';
import { agentApi, type AgentRecord, type AgentScope } from '../agent-api';
import { AgentVisual } from './AgentVisual';
import { DelegationEditor, type BlockRequest } from '../delegation/DelegationEditor';
import { AgentIdentity } from '../delegation/AgentIdentity';
import { HarnessSessions } from '../delegation/HarnessSessions';

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

type AgentView = 'delegation' | 'identity' | 'sessions';
// The dialogs and the panel of the enforcement mode (Admin 041).
type ModePanel = 'mode' | 'date' | 'history';
const noIssuers: string[] = [];

// Agent metadata remains separate from the revisioned permission document.
// One "Delegation and access" view replaces the connection graph and the permission editors (Admin 026).
// The Identity view holds the key of the agent client (Admin 029) and its harness login (Admin 036).
// Harness sessions lists the people and machines logged in from a harness (Admin 036). Both views stay mounted, so a
// switch keeps an unsaved draft. The keyed editor drops scoped drafts and aborts requests when selection changes.
export function AgentDetails({ agent, scope, target, onEdit, onDelete, onChanged, onReload }: AgentDetailsProps) {
  const disabled = agent.status === 'disabled';
  // The view resets to the view of the target, or Delegation and access, for another agent or another navigation target.
  // The target is a new object on each render, so it is compared by the fields of the URL. The
  // principal is left out: it arrives later from the decision of the same navigation.
  const place = `${agent.id}|${target ? [target.section, target.serverId, target.tool, target.policyId, target.connectionId, target.view].join('|') : ''}`;
  const initial: AgentView = target?.view ?? 'delegation';
  const [choice, setChoice] = useState<{ place: string; view: AgentView }>({ place, view: initial });
  const view = choice.place === place ? choice.view : initial;
  const choose = (next: AgentView) => setChoice({ place, view: next });
  const editorKey = `${scope.userId}:${scope.tenantId}:${scope.environmentId}:${agent.id}`;
  const [block, setBlock] = useState<BlockRequest>();
  const [panel, setPanel] = useState<ModePanel>();
  const navigate = useNavigate();
  const reportOnly = agent.enforcement === 'report_only';
  return <section className="cp-admin-panel access-agent-details" aria-label="Selected agent">
    <div className="access-agent-heading"><AgentVisual agent={agent} scope={scope} /><div className="agent-detail-copy"><div className="access-agent-title"><h2>{agent.name}</h2><span className="mcp-badge" data-tone={disabled ? undefined : 'success'}>{disabled ? 'Disabled' : 'Active'}</span>{reportOnly ? <ReportOnlyChip /> : null}</div><p>{agent.description}</p><p className="cp-admin-muted">{disabled ? 'Disabled: it gets no token, and its next call is rejected.' : reportOnly ? 'Report-only: its calls run, and Xokepoint records the calls that its policy would deny.' : 'Acts for the subjects that delegate to it'}</p></div><div className="agent-detail-actions"><button className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" type="button" onClick={() => setPanel('mode')}>{reportOnly ? <><ShieldCheck size={15} aria-hidden="true" />Enforce access</> : <><Eye size={15} aria-hidden="true" />Report-only</>}</button><AgentStatusAction key={agent.id} agent={agent} scope={scope} onChanged={onChanged} onReload={onReload} /><button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" type="button" onClick={onEdit}><Pencil size={15} aria-hidden="true" />Edit</button><button className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" type="button" onClick={onDelete}><Trash2 size={15} aria-hidden="true" />Delete</button></div></div>
    {reportOnly ? <ReportOnlyNotice scope={scope} agent={agent} onChangeDate={() => setPanel('date')} onHistory={() => setPanel('history')}
      onViewCalls={() => navigate(`/investigate?${new URLSearchParams({ view: 'decisions', result: 'would_deny', agent: agent.id })}`)} /> : null}
    <div className="cp-admin-inner-tabs agent-views" role="group" aria-label="Agent view">
      {([['delegation', 'Delegation and access'], ['identity', 'Identity'], ['sessions', 'Harness sessions']] as const).map(([value, label]) =>
        <button key={value} type="button" aria-pressed={view === value} onClick={() => choose(value)}>{label}</button>)}
    </div>
    <div hidden={view !== 'delegation'}><DelegationEditor key={editorKey} scope={scope} agentId={agent.id} agentName={agent.name} target={target} block={block} /></div>
    <div hidden={view !== 'identity'}><AgentIdentity key={editorKey} scope={scope} agentId={agent.id} agentName={agent.name} disabled={disabled} /></div>
    {panel === 'mode' ? <ModeDialog scope={scope} agent={agent} onClose={() => setPanel(undefined)} onChanged={onChanged} onReload={onReload} /> : null}
    {panel === 'date' ? <ReviewDateDialog scope={scope} agent={agent} onClose={() => setPanel(undefined)} onChanged={onChanged} onReload={onReload} /> : null}
    {panel === 'history' ? <CatalogProvider scope={scope} issuers={noIssuers}><RevisionHistory scope={scope} agentId={agent.id} agentName={agent.name} onClose={() => setPanel(undefined)} /></CatalogProvider> : null}
    {view === 'sessions' ? <HarnessSessions key={editorKey} scope={scope} agentId={agent.id} agentName={agent.name} onBlock={(issuer, subject) => setBlock(v => ({ id: (v?.id ?? 0) + 1, issuer, subject }))} /> : null}
  </section>;
}
