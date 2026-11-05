import { useState } from 'react';
import { agentName, idpName, mcpUrl } from './data';
import { HarnessAccess, HarnessClients, HarnessSessions } from './HarnessPrototype';
import { HarnessLoginSection } from './HarnessLoginSection';

// Layout prototype of Admin 036 (Backend 045). Each tab shows one element in the place where the
// real screen will have it; the caption says where. Fixed data, local state only.
type Tab = 'idp' | 'identity' | 'sessions' | 'connection';
const tabs: [Tab, string, string][] = [
  ['idp', 'Identity provider panel', 'Access → Permissions → agent → Delegation and access → identity provider node. New block under the consent record.'],
  ['identity', 'Identity view', 'Access → Permissions → agent → Identity. New card right under the Key card.'],
  ['sessions', 'Harness sessions', 'Access → Permissions → agent. New third view next to Delegation and access and Identity.'],
  ['connection', 'Identity connection', 'Access → Integrations → identity connection form (Keycloak/OIDC and Google). New last section.'],
];

export function HarnessAccessPage() {
  const [tab, setTab] = useState<Tab>('idp');
  const [google, setGoogle] = useState(false);
  const caption = tabs.find(t => t[0] === tab)![2];
  return <section aria-label="Harness access prototype" className="prototype-page">
    <header className="access-page-heading"><div><span className="cp-admin-label">LAYOUT PROTOTYPE · ADMIN 036</span><h1 className="cp-admin-title">Harness access</h1><p className="cp-admin-muted">The pages that a person sees at login are at <a href="/prototype/harness-login">/prototype/harness-login</a>.</p></div></header>
    <nav className="prototype-nav" aria-label="Prototype screens">{tabs.map(([t, label]) => <a key={t} href={`#${t}`} className={tab === t ? 'active' : undefined} onClick={e => { e.preventDefault(); setTab(t); }}>{label}</a>)}</nav>
    <div className="prototype-stack">
      <p className="prototype-caption">{caption}</p>
      {tab === 'idp' ? <div className="cp-admin-panel harness-frame"><header><small>Identity provider</small><h4>{idpName}</h4><p className="cp-admin-muted">{idpName} → {agentName}</p></header><HarnessAccess idpName={idpName} agentName={agentName} people /></div> : null}
      {tab === 'identity' ? <div className="harness-frame"><HarnessClients agentName={agentName} mcpUrl={mcpUrl} /></div> : null}
      {tab === 'sessions' ? <div className="cp-admin-panel harness-frame"><HarnessSessions agentName={agentName} /></div> : null}
      {tab === 'connection' ? <div className="harness-frame">
        <div className="delegation-toggle" role="group" aria-label="Provider"><button type="button" aria-pressed={!google} onClick={() => setGoogle(false)}>Keycloak / OIDC</button><button type="button" aria-pressed={google} onClick={() => setGoogle(true)}>Google Workspace</button></div>
        <div className="cp-admin-panel identity-form identity-form-redesign"><HarnessLoginSection provider={google ? 'google' : 'keycloak'} /></div>
      </div> : null}
    </div>
  </section>;
}
