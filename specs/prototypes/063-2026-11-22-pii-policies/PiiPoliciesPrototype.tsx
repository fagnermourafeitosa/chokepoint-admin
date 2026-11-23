import { useEffect, useState } from 'react';
import { Activity, Building2, History, Pencil, ScanEye, Send, SlidersHorizontal, UserRound } from 'lucide-react';
import { ReportOnlyChip } from '../../../src/components/report-only/ReportOnlyChip';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import { BarricadeIcon } from '../../../src/features/account/BarricadeIcon';
import { TracePager } from '../../../src/features/investigate/TraceUI';
import '../../../src/features/investigate/investigate.css';
import '../../../src/features/account/account.css';
import '../../../src/features/account/barricade.css';
import '../../../src/features/identity/identity.css';
import { AgentPolicyPanel } from './AgentPolicyPanel';
import { agents as initialAgents, allTypes, environments, filters, workspaceOn, workspaces, type Agent } from './data';
import { HistoryPanel } from './HistoryPanel';
import { StatusSelect } from './StatusSelect';
import { TypeGroups } from './TypeGroups';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import './prototype.css';

// Admin 063 prototype: PII policies, a module of Barricade (Admin 062) in the account area. Each
// environment of a workspace chooses the types masked in tool responses; an agent follows its
// environment or has its own policy. Rendered inside the real account layout under
// /account/prototype/pii-policies. Saving writes nothing.

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div className="identity-section-heading"><h2>{title}</h2><p>{description}</p></div>;
}

// A copy of AccountTabs (src/features/account/AccountLayout.tsx) with the Barricade tab current.
// Leaving to another section asks first when the module has unsaved changes.
function Tabs({ onLeave }: { onLeave: (then: () => void) => void }) {
  const stay = () => onLeave(() => undefined);
  return <div className="cp-admin-inner-tabs account-tabs" role="group" aria-label="Account sections">
    <button type="button" onClick={stay}><Building2 size={17} aria-hidden="true" />Workspaces</button>
    <button type="button" onClick={stay}><Send size={17} aria-hidden="true" />Events export</button>
    <button type="button" aria-current="page"><BarricadeIcon />Barricade</button>
    <button type="button" onClick={stay}><UserRound size={17} aria-hidden="true" />Account info</button>
  </div>;
}

const defaults = Object.fromEntries(allTypes.map(t => [t.key, t.masked]));
const label = (key: string) => allTypes.find(t => t.key === key)?.label ?? key;

// The own policy of an agent is a full list of switches (Backend 105: never merged with the
// environment); the table shows only where it differs from the environment.
function difference(agent: Agent, env: Record<string, boolean>) {
  const changed = agent.own ? Object.entries(agent.own).filter(([key, on]) => on !== env[key]) : [];
  if (changed.length === 0) return <span className="cp-admin-muted">Same as the environment</span>;
  const off = changed.filter(([, on]) => !on).map(([k]) => label(k));
  const on = changed.filter(([, v]) => v).map(([k]) => label(k));
  return <span>{[off.length ? `${off.join(', ')} not masked` : '', on.length ? `${on.join(', ')} masked` : ''].filter(Boolean).join('; ')}</span>;
}

export function PiiPoliciesPrototype() {
  const [workspace, setWorkspace] = useState(workspaces[0].value);
  const [environment, setEnvironment] = useState(environments[0].value);
  const [masked, setMasked] = useState<Record<string, boolean>>(defaults);
  const [saved, setSaved] = useState<Record<string, boolean>>(defaults);
  const [agents, setAgents] = useState(initialAgents);
  const [editing, setEditing] = useState<string>();
  const [page, setPage] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [module, setModule] = useState<'drift' | 'pii'>('pii');
  // The action that waits for the answer of Save your changes? (leave, change scope, or cancel).
  const [leaving, setLeaving] = useState<{ then: () => void }>();
  const current = workspaces.find(w => w.value === workspace)!;
  const envLabel = environments.find(e => e.value === environment)!.label;
  const dirty = JSON.stringify(masked) !== JSON.stringify(saved);
  const agent = agents.find(a => a.name === editing);
  const leave = (then: () => void) => { if (dirty) setLeaving({ then }); else then(); };
  // A reload or a closed browser tab can only get the native prompt of the browser.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  return <main id="main-content" className="admin-page cp-admin-container barricade-page" aria-label="Barricade" tabIndex={-1}>
    <Tabs onLeave={leave} />
    <header className="access-page-heading barricade-heading">
      <div>
        <h1 className="cp-admin-title">Barricade</h1>
        <p className="cp-admin-muted">Security settings of each environment of a workspace. Sandbox and Production are set apart.</p>
      </div>
      <div className="barricade-scope">
        <label className="cp-admin-field">Workspace<StatusSelect label="Workspace" value={workspace} options={workspaces.map(w => ({ value: w.value, label: w.label, on: workspaceOn(w) }))} onChange={value => leave(() => setWorkspace(value))} /></label>
        <label className="cp-admin-field">Environment<StatusSelect label="Environment" value={environment} options={environments.map(e => ({ ...e, on: filters(current, e.value) }))} onChange={value => leave(() => setEnvironment(value))} /></label>
        {module === 'pii' ? <button type="button" className="cp-admin-button cp-admin-button--ghost barricade-history-button" onClick={() => document.getElementById('pii-agents')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><SlidersHorizontal size={16} aria-hidden="true" />Manage</button> : null}
        <button type="button" className="cp-admin-button cp-admin-button--ghost barricade-history-button" onClick={() => setShowHistory(true)}><History size={16} aria-hidden="true" />History</button>
      </div>
    </header>
    <div className="barricade-layout pii-modules">
      <div className="cp-admin-inner-tabs" role="group" aria-label="Security modules">
        <button type="button" aria-current={module === 'drift' ? 'page' : undefined} onClick={() => leave(() => setModule('drift'))}><Activity size={17} aria-hidden="true" />Behavior drift</button>
        <button type="button" aria-current={module === 'pii' ? 'page' : undefined} onClick={() => setModule('pii')}><ScanEye size={17} aria-hidden="true" />PII Policies</button>
      </div>
      {module === 'drift' ? <section className="cp-admin-panel identity-form" aria-label="Behavior drift"><div className="barricade-module-head"><h2>Behavior drift</h2><small className="cp-admin-muted">The editor of Admin 062, unchanged.</small></div></section> : <form className="cp-admin-panel identity-form identity-form-redesign" aria-label="PII Policies" onSubmit={e => { e.preventDefault(); setSaved(masked); }}>
        <div className="barricade-module-head"><h2>PII Policies <WaitingBackend spec="105" tip="Reads and saves the masked types of the environment and of each agent, with the change history of Barricade." /></h2><span className="mcp-badge">{envLabel}</span></div>
        <div className="identity-form-section">
          <SectionHeading title="Masked types" description="Each value of a masked type is replaced by its type, such as {EMAIL}, in the response of a tool before the agent reads it. The arguments that an agent sends are not changed." />
          <div className="identity-form-fields">
            <TypeGroups columns={['Type', 'Replaced by', 'Mask']} masked={key => masked[key]} cells={t => [
              <code>{t.placeholder}</code>,
              <input className="cp-admin-switch" type="checkbox" role="switch" aria-label={`Mask ${t.label}`} checked={masked[t.key]} onChange={e => { const on = e.target.checked; setMasked(m => ({ ...m, [t.key]: on })); }} />,
            ]} />
          </div>
        </div>
        <div id="pii-agents" className="identity-form-section barricade-last-section">
          <SectionHeading title="Agents" description="An agent follows the masked types of its environment, or has its own policy, for example an agent that must not read the contact data of customers." />
          <div className="identity-form-fields">
            <div className="cp-admin-table-scroll">
              <table className="cp-admin-table pii-agents-table">
                <thead><tr><th scope="col">Agent</th><th scope="col">PII filter <WaitingBackend spec="105" tip="Turns the PII filter of one agent on or off in each environment; on for a new agent. Off keeps its policy." /></th><th scope="col">Policy</th><th scope="col">Difference from the environment</th><th scope="col" className="pii-actions">Actions</th></tr></thead>
                <tbody>{agents.map(a => <tr key={a.name}>
                  <td><span className="pii-agent"><strong>{a.name}</strong>{a.reportOnly ? <ReportOnlyChip /> : null}</span><small className="cp-admin-muted pii-detail">{a.mcp}</small></td>
                  
                  <td><div className="pii-env-toggles">{environments.map(e => <span key={e.value} className="pii-toggle">
                    <input className="cp-admin-switch cp-admin-switch--status" type="checkbox" role="switch" aria-label={`PII filter of ${a.name} in ${e.label}`} disabled={!filters(current, e.value)} checked={filters(current, e.value) && !a.off?.[e.value]} onChange={ev => { const on = ev.target.checked; setAgents(list => list.map(x => (x.name === a.name ? { ...x, off: { ...x.off, [e.value]: !on } } : x))); }} />{e.label}
                  </span>)}</div></td>
                  <td><span className="mcp-badge" data-tone={a.own ? 'warning' : undefined}>{a.own ? 'Own policy' : 'Environment'}</span></td>
                  <td>{difference(a, saved)}</td>
                  <td className="pii-actions"><button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => setEditing(a.name)}><Pencil size={15} aria-hidden="true" />Edit</button></td>
                </tr>)}</tbody>
              </table>
            </div>
            <TracePager page={page} size={10} total={agents.length} onPage={setPage} />
          </div>
        </div>
        <footer className="identity-form-actions barricade-footer"><span />
          <button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={!dirty} onClick={() => leave(() => undefined)}>Cancel</button>
          <button className="cp-admin-button" type="submit" disabled={!dirty}>Save</button>
        </footer>
      </form>}
    </div>
    {leaving ? <UnsavedChangesDialog what={`the masked types of ${envLabel}`} onSave={() => { setSaved(masked); setLeaving(undefined); leaving.then(); }} onDiscard={() => { setMasked(saved); setLeaving(undefined); leaving.then(); }} onKeep={() => setLeaving(undefined)} /> : null}
    {showHistory ? <HistoryPanel scope={`${workspaces.find(w => w.value === workspace)!.label} · ${envLabel}`} onClose={() => setShowHistory(false)} /> : null}
    {agent ? <AgentPolicyPanel agent={agent} environment={envLabel} masked={saved} onClose={() => setEditing(undefined)}
      onSave={own => { setAgents(list => list.map(x => (x.name === agent.name ? { ...x, own } : x))); setEditing(undefined); }} /> : null}
  </main>;
}
