import { useState } from 'react';
import { Plus, TriangleAlert, X } from 'lucide-react';
import { usePendingChanges } from '../auth/pending/PendingChanges';
import type { DirectoryCheck, DirectorySettings, IdentityConnection, IdentityFields, LoginSettings } from './api';
import { Help } from './Help';
import { HarnessLoginSection, initialLogin } from './HarnessLoginSection';
import { GuideLink, SectionHeading } from './formParts';
import './identity.css';

// Microsoft Entra ID connection form (Admin 042, Backend 058). One app registration of the
// customer is the directory client and the harness login client: its client ID and secret
// are typed once and sent in both settings (Backend 058 Resolved Decision 3).
const entraCenter = 'https://entra.microsoft.com';
const registerGuide = 'https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app';
const secretGuide = 'https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials';
const consentGuide = 'https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/grant-admin-consent';
const redirectGuide = 'https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri';
const exposeGuide = 'https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-configure-app-expose-web-apis';
const tenantGuide = 'https://learn.microsoft.com/en-us/entra/fundamentals/how-to-find-tenant';
const authority = 'https://login.microsoftonline.com/';
const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const personalTenant = '9188040d-6c67-4c5b-b112-36a304b66dad';
const issuerOf = (tenant: string) => `${authority}${guid.test(tenant) ? tenant.toLowerCase() : '<tenant ID>'}/v2.0`;
const tenantOf = (issuer?: string) => issuer?.startsWith(authority) && issuer.endsWith('/v2.0') ? issuer.slice(authority.length, -'/v2.0'.length) : '';

type Props = {
 connection?: IdentityConnection; workspaceLabel: string; pending: boolean; error: string; groupsCapable: boolean;
 onSave: (fields: IdentityFields) => Promise<void>; onCheck: (fields: IdentityFields) => Promise<boolean>;
 onDirectoryCheck: (fields: IdentityFields) => Promise<DirectoryCheck | undefined>; onCancel: () => void;
};
export function EntraConnectionForm({ connection, workspaceLabel, groupsCapable, pending, error, onSave, onCheck, onDirectoryCheck, onCancel }: Props) {
 const stored = connection?.directory;
 const [name, setName] = useState(connection?.name ?? '');
 const [enabled, setEnabled] = useState(connection?.enabled ?? true);
 const [tenant, setTenant] = useState(tenantOf(connection?.issuer));
 const [clientId, setClientId] = useState(stored?.client_id ?? '');
 const [secret, setSecret] = useState('');
 // A stored secret is shown masked until the administrator chooses to replace it.
 const [changingSecret, setChangingSecret] = useState(false);
 // Accepted audiences follow the client ID until the administrator edits them.
 const [audiences, setAudiences] = useState<string[] | null>(connection?.audiences ?? null);
 const [login, setLogin] = useState(() => initialLogin(connection?.login));
 const [groupsReadable, setGroupsReadable] = useState<boolean>();
 const [checked, setChecked] = useState(connection?.check_status === 'verified' && stored?.check_status === 'verified');
 const [checking, setChecking] = useState(false), [localError, setLocalError] = useState('');
 const shownAudiences = audiences ?? (clientId ? [clientId, `api://${clientId}`] : ['']);
 const hasStoredSecret = !!stored?.has_secret && !changingSecret;
 const directory = (): DirectorySettings => ({ client_id: clientId, issuing_client_id: '', client_secret: hasStoredSecret ? '' : secret, has_secret: !!stored?.has_secret, check_status: 'not_checked', checked_at: null });
 // The login client is the same app; a new secret is sent for both. null removes the client.
 const loginFields = (): LoginSettings | null => !login.enabled && !connection?.login ? null : { enabled: login.enabled, client_id: clientId, ...(hasStoredSecret ? {} : { client_secret: secret }) };
 const fields = (): IdentityFields => ({ provider: 'entra', name: name.trim(), issuer: issuerOf(tenant.trim()), audiences: shownAudiences.map(a => a.trim()), enabled, revision: connection?.revision ?? 0, directory: directory(), login: loginFields() });
 const current = JSON.stringify(fields());
 const [initial] = useState(current);
 usePendingChanges(pending || current !== initial);
 // Any change to what the check verified makes the check stale.
 function changed() { setChecked(false); setLocalError(''); }
 function validate(): boolean {
  if (!name.trim()) { setLocalError('Enter the connection name.'); return false; }
  if (!guid.test(tenant.trim())) { setLocalError('Enter the Directory (tenant) ID, a GUID such as 00000000-0000-0000-0000-000000000000.'); return false; }
  if (tenant.trim().toLowerCase() === personalTenant) { setLocalError('This is the tenant of personal Microsoft accounts. Enter the tenant ID of your organization.'); return false; }
  if (!guid.test(clientId.trim())) { setLocalError('Enter the Application (client) ID, a GUID.'); return false; }
  if (!hasStoredSecret && !secret) { setLocalError('Paste the client secret value.'); return false; }
  if (shownAudiences.some(a => !a.trim())) { setLocalError('Enter each accepted audience, or remove the empty one.'); return false; }
  if (login.enabled && hasStoredSecret && !connection?.login?.has_secret) { setLocalError('To turn on harness login, select Change and paste the secret value again.'); return false; }
  return true;
 }
 async function checkConnection() {
  if (!validate()) return;
  setChecking(true); setChecked(false);
  try {
   if (!await onCheck(fields())) return;
   const result = await onDirectoryCheck(fields());
   if (!result || result.check_status !== 'verified') return;
   setGroupsReadable(result.groups_readable);
   setChecked(true);
  } finally { setChecking(false); }
 }
 return <form className="cp-admin-panel identity-form identity-form-redesign" onSubmit={event => { event.preventDefault(); if (validate()) void onSave(fields()); }}>
  <fieldset disabled={pending || checking}>
   <div className="identity-form-section"><SectionHeading title="Connection" description="Identify this connection in your workspace." help="The connection belongs to the selected workspace and environment." /><div className="identity-form-fields">
    <label className="cp-admin-field">Connection name<input className="cp-admin-input" maxLength={80} required value={name} onChange={e => { setName(e.target.value); changed(); }} /></label><small>{workspaceLabel}</small>
    <label className="cp-admin-choice identity-enable"><input className="cp-admin-switch" type="checkbox" role="switch" checked={enabled} onChange={e => setEnabled(e.target.checked)} /><span className="cp-admin-choice-copy"><strong>Enable connection</strong><small>Accept people of this Microsoft Entra tenant in the selected environment.</small></span></label>
   </div></div>

   <div className="identity-form-section"><SectionHeading title="Microsoft Entra app" description="One app registration in your tenant gives Chokepoint access to your users and groups." help={'Chokepoint uses one app registration of your tenant to read users and groups with Microsoft Graph, and to sign people in from a coding harness.\n\nIt asks only for User.Read.All and GroupMember.Read.All, both read-only.'} /><div className="identity-form-fields">
    <ol className="lifecycle-steps" aria-label="Prepare Microsoft Entra for Chokepoint">
     <li><span className="lifecycle-step-bubble" aria-hidden="true">1</span><div><strong>Register an app</strong><span>In the <GuideLink href={entraCenter}>Microsoft Entra admin center</GuideLink>, go to Identity, Applications, App registrations, New registration. Choose "Accounts in this organizational directory only". On the app Overview, copy the Application (client) ID and the Directory (tenant) ID.</span><GuideLink href={registerGuide}>Microsoft guide: register an application</GuideLink></div></li>
     <li><span className="lifecycle-step-bubble" aria-hidden="true">2</span><div><strong>Create a client secret</strong><span>In the app, go to Certificates &amp; secrets, Client secrets, New client secret. Copy the Value at once: Entra shows it only once. Do not copy the Secret ID. Note the expiry date and create a new secret before it.</span><GuideLink href={secretGuide}>Microsoft guide: add a client secret</GuideLink></div></li>
     <li><span className="lifecycle-step-bubble" aria-hidden="true">3</span><div><strong>Add the Graph permissions</strong><span>In the app, go to API permissions, Add a permission, Microsoft Graph, Application permissions. Add <code>User.Read.All</code> and <code>GroupMember.Read.All</code>, then select Grant admin consent. A Global Administrator or a Privileged Role Administrator must grant it.</span><GuideLink href={consentGuide}>Microsoft guide: grant admin consent</GuideLink></div></li>
     <li><span className="lifecycle-step-bubble" aria-hidden="true">4</span><div><strong>Paste the values</strong><span>Enter the tenant ID, the client ID and the secret value below, then select Check connection.</span></div></li>
    </ol>
    <p className="cp-admin-muted">Guests (people from other organizations invited to your tenant) are not listed and can not use Chokepoint.</p>
    <div className="identity-two-fields">
     <label className="cp-admin-field"><span>Directory (tenant) ID <Help text="On the app Overview, or in Identity, Overview of the Microsoft Entra admin center." /></span><input className="cp-admin-input identity-mono" maxLength={36} required placeholder="00000000-0000-0000-0000-000000000000" value={tenant} onChange={e => { setTenant(e.target.value.trim()); changed(); }} /><small><GuideLink href={tenantGuide}>Find your tenant ID</GuideLink></small></label>
     <label className="cp-admin-field">Application (client) ID<input className="cp-admin-input identity-mono" maxLength={36} required placeholder="00000000-0000-0000-0000-000000000000" value={clientId} onChange={e => { setClientId(e.target.value.trim()); changed(); }} /><small>Used for the directory and for harness login.</small></label>
    </div>
    {hasStoredSecret
     ? <label className="cp-admin-field">Client secret value<span className="identity-secret-row"><input className="cp-admin-input" type="password" disabled value="••••••••••••" aria-label="Stored client secret" /><button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => { setChangingSecret(true); changed(); }}>Change</button></span><small>Stored encrypted. Existing secrets cannot be displayed.</small></label>
     : <label className="cp-admin-field">Client secret value<input className="cp-admin-input" type="password" autoComplete="new-password" maxLength={4096} value={secret} onChange={e => { setSecret(e.target.value); changed(); }} /><small>The Value column, not the Secret ID. Stored encrypted. Existing secrets cannot be displayed.</small></label>}
    {connection ? <div className="cp-admin-notice identity-mapping-warning" role="status"><TriangleAlert size={18} aria-hidden="true" /><div><strong>Changing the tenant</strong><span>If you change the tenant ID, the people associated before belong to the previous tenant and lose access. Chokepoint does not block the change.</span></div></div> : null}
    {localError || error ? <p className="cp-admin-notice cp-admin-notice--danger" role="alert">{localError || error}</p> : null}
    <div className="identity-inline-check"><button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={checking} onClick={() => void checkConnection()}>{checking ? 'Checking…' : 'Check connection'}</button><Help label="What the check verifies" text={'Check connection reads the Microsoft Entra metadata and signing keys of your tenant, gets a Microsoft Graph token with the client secret, reads one user and reads the groups.\n\nIt tells you which step is missing: a wrong tenant ID, a wrong client ID, a wrong or expired secret, or a permission without admin consent.'} /><small role="status">{checked ? 'Connection verified.' : 'Not checked'}</small></div>
    {checked && groupsReadable === false ? <p className="cp-admin-notice" role="status">The app can not read groups. Harness login needs it: add GroupMember.Read.All and grant admin consent (step 3).</p> : null}
   </div></div>

   <div className="identity-form-section"><SectionHeading title="Request authentication" description="Validate Microsoft Entra access tokens of your users." help="Chokepoint accepts access tokens that Microsoft Entra issues for your app, for people of your tenant only. The issuer comes from the tenant ID." /><div className="identity-form-fields">
    <label className="cp-admin-field">Issuer URL<input className="cp-admin-input identity-mono" readOnly value={issuerOf(tenant)} /><small>Set from the tenant ID.</small></label>
    <div className="identity-audiences"><span className="identity-field-label">Accepted audiences <Help text={'Only needed when a service of yours exchanges a Microsoft Entra token of a user for an agent token.\n\nIn the app, go to Expose an API, set the Application ID URI (the default is api://<client ID>) and add a scope.'} /></span>{shownAudiences.map((audience, index) => <div className="identity-audience-row" key={index}><input className="cp-admin-input identity-mono" aria-label={`Audience ${index + 1}`} maxLength={2048} value={audience} onChange={e => { setAudiences(shownAudiences.map((value, i) => i === index ? e.target.value : value)); changed(); }} /><button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={shownAudiences.length === 1} aria-label={`Remove audience ${index + 1}`} onClick={() => { setAudiences(shownAudiences.filter((_, i) => i !== index)); changed(); }}><X size={16} /></button></div>)}<button className="identity-text-button" type="button" disabled={shownAudiences.length >= 10} onClick={() => { setAudiences([...shownAudiences, '']); changed(); }}><Plus size={15} />Add audience</button><small>The client ID and the Application ID URI of your app. <GuideLink href={exposeGuide}>Microsoft guide: expose an API</GuideLink></small></div>
   </div></div>

   <HarnessLoginSection provider="entra" sharedClient={{ guide: redirectGuide }} value={login} stored={connection?.login ?? null} groupsCapable={groupsCapable} onChange={setLogin} />
  </fieldset>
  <footer className="identity-form-actions"><span /><button className="cp-admin-button cp-admin-button--ghost" type="button" disabled={pending} onClick={onCancel}>Cancel</button><button className="cp-admin-button" type="submit" disabled={pending}>{pending ? 'Working…' : connection ? 'Save changes' : 'Create connection'}</button></footer>
 </form>;
}
