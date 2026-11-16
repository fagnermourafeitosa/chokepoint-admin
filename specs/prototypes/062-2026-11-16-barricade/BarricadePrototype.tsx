import { useState } from 'react';
import { Building2, Send, UserRound } from 'lucide-react';
import { SelectMenu } from '../../../src/components/ui/dropdown/SelectMenu';
import { Notice } from '../../../src/components/ui/notice/Notice';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import '../../../src/features/account/account.css';
import { BarricadeIcon } from './BarricadeIcon';
import { departures, heuristics, responses, workspaces } from './data';
import './prototype.css';

// Admin 062 prototype: Barricade as a tab of the account area (Admin 051), after Events export, because
// its settings belong to a workspace and apply to Sandbox and Production. Rendered inside the real
// account layout under /account/prototype/barricade. The drift heuristics of Backend 099 with their
// defaults, and the response to each departure (Backend 099 Implementation Decision 16a). Saving writes nothing.

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
  const [values, setValues] = useState<Record<string, number>>(Object.fromEntries(heuristics.map(h => [h.key, h.value])));
  const [chosen, setChosen] = useState<Record<string, string>>(Object.fromEntries(departures.map(d => [d.key, 'alert'])));
  const enforcing = Object.values(chosen).some(v => v !== 'alert');
  return <main id="main-content" className="admin-page cp-admin-container barricade-page" aria-label="Barricade" tabIndex={-1}>
    <Tabs />
    <header className="access-page-heading">
      <div>
        <h1 className="cp-admin-title">Barricade<WaitingBackend spec="101" tip="Stores the security settings of each workspace: the drift heuristics and the response to each departure." /></h1>
        <p className="cp-admin-muted">Security settings of a workspace, for Sandbox and Production: how an agent that leaves its pattern is detected, and what happens then.</p>
      </div>
    </header>
    <form className="cp-admin-panel identity-form identity-form-redesign" onSubmit={e => e.preventDefault()}>
      <div className="identity-form-section">
        <SectionHeading title="Workspace" description="The settings below apply to both environments of this workspace." />
        <div className="identity-form-fields barricade-workspace"><label className="cp-admin-field">Workspace<SelectMenu block label="Workspace" value={workspace} onChange={setWorkspace} options={workspaces} /></label></div>
      </div>
      <div className="identity-form-section">
        <SectionHeading title="Behavior drift detection" description="How each agent's pattern is learned and when a departure becomes a signal. The defaults follow market practice." />
        <div className="identity-form-fields barricade-fields">
          {heuristics.map(h => <label key={h.key} className="cp-admin-field">{h.label}
            <span className="barricade-input"><input className="cp-admin-input" type="number" min={1} value={values[h.key]} onChange={e => setValues(v => ({ ...v, [h.key]: Number(e.target.value) }))} /><span className="cp-admin-muted">{h.unit}</span></span>
            <small>{h.help}</small></label>)}
        </div>
      </div>
      <div className="identity-form-section">
        <SectionHeading title="Response to a departure" description="What happens when an agent leaves its pattern. Alert is the default: a signal in the Inbox, also sent to Slack when chosen there." />
        <div className="identity-form-fields">
          <div className="cp-admin-table-scroll"><table className="cp-admin-table barricade-table">
            <thead><tr><th>Departure</th><th>Response</th></tr></thead>
            <tbody>{departures.map(d => <tr key={d.key}><td><strong>{d.label}</strong><small className="cp-admin-muted barricade-detail">{d.detail}</small></td><td><SelectMenu block label={`Response to ${d.label}`} value={chosen[d.key]} onChange={v => setChosen(c => ({ ...c, [d.key]: v }))} options={responses} /></td></tr>)}</tbody>
          </table></div>
          {enforcing ? <Notice tone="warning" title="Calls will be blocked automatically">A suspended tool denies every call of that agent until an administrator restores it; a disabled agent gets no token and its next call is refused. For an agent in Report-only, the calls run and are recorded as would deny.</Notice> : null}
        </div>
      </div>
      <footer className="identity-form-actions ea-footer"><span /><button type="button" className="cp-admin-button cp-admin-button--ghost">Cancel</button><button className="cp-admin-button" type="submit">Save</button></footer>
    </form>
  </main>;
}
