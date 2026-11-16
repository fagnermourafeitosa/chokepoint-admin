import { useState } from 'react';
import { Activity, Building2, History, Send, UserRound } from 'lucide-react';
import { SelectMenu } from '../../../src/components/ui/dropdown/SelectMenu';
import { Notice } from '../../../src/components/ui/notice/Notice';
import { SidePanel } from '../../../src/components/ui/side-panel/SidePanel';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import '../../../src/features/account/account.css';
import { BarricadeIcon } from './BarricadeIcon';
import { actions, anomalies, environments, heuristics, history, modules, settings, workspaces, type Key } from './data';
import './prototype.css';

// Admin 062 prototype: Barricade as a tab of the account area (Admin 051), after Events export. Each
// environment of a workspace has its own setting (Backend 101). The page grows by security module:
// a rail on the left lists the modules (Behavior drift first), and each module has Detection and
// Automated response. The change history of the environment opens in a side panel. Rendered inside
// the real account layout under /account/prototype/barricade. Saving writes nothing.

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div className="identity-section-heading"><h2>{title}</h2><p>{description}</p></div>;
}

// A copy of AccountTabs (src/features/account/AccountLayout.tsx) with the Barricade tab.
function Tabs() {
  return <div className="cp-admin-inner-tabs account-tabs" role="group" aria-label="Account sections">
    <button type="button"><Building2 size={17} aria-hidden="true" />Workspaces</button>
    <button type="button"><Send size={17} aria-hidden="true" />Events export</button>
    <button type="button" aria-current="page"><BarricadeIcon />Barricade</button>
    <button type="button"><UserRound size={17} aria-hidden="true" />Account info</button>
  </div>;
}

export function BarricadePrototype() {
  const [workspace, setWorkspace] = useState(workspaces[0].value);
  const [environment, setEnvironment] = useState(environments[0].value);
  const [module, setModule] = useState(modules[0].key);
  const [showHistory, setShowHistory] = useState(false);
  const [edits, setEdits] = useState<Record<string, Record<Key, number>>>(Object.fromEntries(Object.entries(settings).map(([env, s]) => [env, { ...s.values }])));
  const [chosen, setChosen] = useState<Record<string, string>>(Object.fromEntries(anomalies.map(a => [a.key, 'alert'])));
  const values = edits[environment];
  const enforcing = Object.values(chosen).some(v => v !== 'alert');
  const envLabel = environments.find(e => e.value === environment)?.label;
  return <main id="main-content" className="admin-page cp-admin-container barricade-page" aria-label="Barricade" tabIndex={-1}>
    <Tabs />
    <header className="access-page-heading barricade-heading">
      <div>
        <h1 className="cp-admin-title">Barricade<WaitingBackend spec="101" tip="Stores the security settings of each workspace environment, created with the market defaults, with the history of every change." /></h1>
        <p className="cp-admin-muted">Security settings of each environment of a workspace. Sandbox and Production are set apart.</p>
      </div>
      <div className="barricade-scope">
        <label className="cp-admin-field">Workspace<SelectMenu block label="Workspace" value={workspace} onChange={setWorkspace} options={workspaces} /></label>
        <label className="cp-admin-field">Environment<SelectMenu block label="Environment" value={environment} onChange={setEnvironment} options={environments} /></label>
        <button type="button" className="cp-admin-button cp-admin-button--ghost barricade-history-button" onClick={() => setShowHistory(true)}><History size={16} aria-hidden="true" />Change history</button>
      </div>
    </header>
    <div className="barricade-layout">
      <nav className="cp-admin-panel barricade-rail" aria-label="Security modules">
        {modules.map(m => <button key={m.key} type="button" aria-current={module === m.key ? 'page' : undefined} onClick={() => setModule(m.key)}><Activity size={16} aria-hidden="true" /><span><strong>{m.label}</strong><small>{m.detail}</small></span></button>)}
      </nav>
      <form className="cp-admin-panel identity-form identity-form-redesign" onSubmit={e => e.preventDefault()}>
        <div className="barricade-module-head"><h2>Behavior drift</h2><small className="cp-admin-muted">{envLabel} · {settings[environment].updated}</small></div>
        <div className="identity-form-section">
          <SectionHeading title="Detection" description="How each agent's baseline is learned and when an anomaly is raised." />
          <div className="identity-form-fields barricade-fields">
            {heuristics.map(h => <label key={h.key} className="cp-admin-field">{h.label}
              <span className="barricade-input"><input className="cp-admin-input" type="number" min={1} value={values[h.key]} onChange={e => setEdits(all => ({ ...all, [environment]: { ...all[environment], [h.key]: Number(e.target.value) } }))} /><span className="cp-admin-muted">{h.unit}</span></span>
              <small>{h.help}</small></label>)}
          </div>
        </div>
        <div className="identity-form-section">
          <SectionHeading title="Automated response" description="The action taken when an anomaly is raised. Alert is the default; the other actions block calls without waiting for a person." />
          <div className="identity-form-fields">
            <table className="cp-admin-table barricade-table">
              <thead><tr><th>Anomaly</th><th>Action</th></tr></thead>
              <tbody>{anomalies.map(a => <tr key={a.key}><td><strong>{a.label}</strong><small className="cp-admin-muted barricade-detail">{a.detail}</small></td><td><SelectMenu block label={`Action for ${a.label}`} value={chosen[a.key]} onChange={v => setChosen(c => ({ ...c, [a.key]: v }))} options={actions} /></td></tr>)}</tbody>
            </table>
            {enforcing ? <Notice tone="warning" title="Calls will be blocked automatically">A suspended tool denies every call of that agent until an administrator restores it; a disabled agent gets no token and its next call is refused. For an agent in Report-only, the calls run and are recorded as would deny.</Notice> : null}
          </div>
        </div>
        <footer className="identity-form-actions ea-footer"><span /><button type="button" className="cp-admin-button cp-admin-button--ghost">Cancel</button><button className="cp-admin-button" type="submit">Save</button></footer>
      </form>
    </div>
    {showHistory ? <SidePanel eyebrow={`${workspaces.find(w => w.value === workspace)?.label} · ${envLabel}`} title="Change history" width="wide" onClose={() => setShowHistory(false)}>
      <div className="barricade-history-body">
        <p className="cp-admin-muted">Every change of this environment's Barricade setting, newest first. The history cannot be edited.</p>
        <table className="cp-admin-table barricade-history">
          <thead><tr><th>When</th><th>Who</th><th>Change</th></tr></thead>
          <tbody>{history[environment].map(h => <tr key={h.when + h.change}><td>{h.when}</td><td>{h.who}</td><td>{h.change}</td></tr>)}</tbody>
        </table>
      </div>
    </SidePanel> : null}
  </main>;
}
