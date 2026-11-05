import { useState } from 'react';
import { Plus, TriangleAlert, X } from 'lucide-react';
import { usePendingChanges } from '../auth/pending/PendingChanges';
import type { DirectoryCheck, DirectorySettings, IdentityConnection, IdentityFields } from './api';
import { Help } from './Help';
import { HarnessLoginSection, initialLogin, loginInput } from './HarnessLoginSection';
import { GuideLink, SectionHeading } from './formParts';
import './identity.css';

// Okta connection form (Admin 043, Backend 059). The directory is read with an API Services
// app (private_key_jwt and DPoP); harness login uses a separate OIDC Web app; headless subject
// tokens need an optional custom authorization server (Backend 059 Resolved Decisions 1 to 3).
const serviceGuide = 'https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/main/';
const keyGuide = `${serviceGuide}#generate-the-jwk-using-the-admin-console`;
const scopesGuide = `${serviceGuide}#grant-allowed-scopes`;
const roleGuide = `${serviceGuide}#assign-admin-roles-to-the-oauth-2-0-service-app`;
const domainGuide = 'https://developer.okta.com/docs/guides/find-your-domain/main/';
const loginAppGuide = 'https://help.okta.com/oie/en-us/content/topics/apps/apps_app_integration_wizard_oidc.htm';
const authServerGuide = 'https://developer.okta.com/docs/guides/customize-authz-server/main/';

// The org URL is the connection issuer: https, a host and no path.
function orgOf(value: string): string {
 try { const url = new URL(value.trim()); return url.protocol === 'https:' && (url.pathname === '/' || url.pathname === '') && !url.search ? url.origin : ''; } catch { return ''; }
}

type Props = {
 connection?: IdentityConnection; workspaceLabel: string; pending: boolean; error: string; groupsCapable: boolean;
 onSave: (fields: IdentityFields) => Promise<void>; onCheck: (fields: IdentityFields) => Promise<boolean>;
 onDirectoryCheck: (fields: IdentityFields) => Promise<DirectoryCheck | undefined>; onCancel: () => void;
};
export function OktaConnectionForm({ connection, workspaceLabel, groupsCapable, pending, error, onSave, onCheck, onDirectoryCheck, onCancel }: Props) {
 const stored = connection?.directory;
 const [name, setName] = useState(connection?.name ?? '');
 const [enabled, setEnabled] = useState(connection?.enabled ?? true);
 const [org, setOrg] = useState(connection?.issuer ?? '');
 const [clientId, setClientId] = useState(stored?.client_id ?? '');
 const [privateKey, setPrivateKey] = useState('');
 const [changingKey, setChangingKey] = useState(false);
 // The custom authorization server is the token issuer of the connection (Backend 059, 060).
 const [authServer, setAuthServer] = useState(connection?.token_issuer ?? '');
 const [headless, setHeadless] = useState(!!connection?.token_issuer);
 const [audiences, setAudiences] = useState<string[] | null>(connection?.token_issuer ? connection.audiences : null);
 const [login, setLogin] = useState(() => initialLogin(connection?.login));
 const [groupsReadable, setGroupsReadable] = useState<boolean>();
 const [checked, setChecked] = useState(connection?.check_status === 'verified' && stored?.check_status === 'verified');
 const [checking, setChecking] = useState(false), [localError, setLocalError] = useState('');
 const orgUrl = orgOf(org);
 const shownAudiences = audiences ?? ['api://default'];
 // The backend reuses a stored key only for the same org URL and client ID, so a change of
 // either asks for the private key of that app (Backend 059 Protocol contract 2).
 const credentialsMoved = !!connection && (orgUrl !== connection.issuer || clientId.trim() !== (stored?.client_id ?? ''));
 const hasStoredKey = !!stored?.has_secret && !changingKey && !credentialsMoved;
 const directory = (): DirectorySettings => ({ client_id: clientId, issuing_client_id: '', ...(hasStoredKey ? {} : { private_key: privateKey }), has_secret: !!stored?.has_secret, check_status: 'not_checked', checked_at: null });
 // Without a custom authorization server, the backend keeps the default audience and accepts no Okta subject token.
 const fields = (): IdentityFields => ({ provider: 'okta', name: name.trim(), issuer: orgUrl, audiences: headless ? shownAudiences.map(a => a.trim()) : ['api://default'], enabled, revision: connection?.revision ?? 0, directory: directory(), login: loginInput(login), ...(headless ? { token_issuer: authServer } : {}) });
 const current = JSON.stringify(fields());
 const [initial] = useState(current);
 usePendingChanges(pending || current !== initial);
 // Any change to what the check verified makes the check stale.
 function changed() { setChecked(false); setLocalError(''); }
 function validate(): boolean {
  if (!name.trim()) { setLocalError('Enter the connection name.'); return false; }
  if (!orgUrl) { setLocalError('Enter the Okta org URL, such as https://acme.okta.com, with https and no path.'); return false; }
  if (new URL(orgUrl).hostname.includes('-admin.')) { setLocalError('This is the URL of the Okta Admin Console. Remove "-admin" from it: https://acme.okta.com, not https://acme-admin.okta.com.'); return false; }
  if (!clientId.trim()) { setLocalError('Enter the client ID of the API Services app.'); return false; }
  if (!hasStoredKey) {
   try { const key = JSON.parse(privateKey); if (!key.kid || !key.d) throw new Error(); }
   catch { setLocalError(credentialsMoved && stored?.has_secret ? 'You changed the org URL or the client ID. Paste the private key of that app in JSON format.' : 'Paste the private key in JSON format, as Okta shows it after Generate new key. It must include "kid".'); return false; }
  }
  if (headless && !authServer) { setLocalError('Enter the Issuer of the custom authorization server, or turn off Accept tokens from your services.'); return false; }
  if (headless && authServer && !authServer.startsWith(`${orgUrl}/oauth2/`)) { setLocalError(`The custom authorization server must be of this org: ${orgUrl}/oauth2/<ID>.`); return false; }
  if (headless && authServer && shownAudiences.some(a => !a.trim())) { setLocalError('Enter each accepted audience, or remove the empty one.'); return false; }
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
    <label className="cp-admin-choice identity-enable"><input className="cp-admin-switch" type="checkbox" role="switch" checked={enabled} onChange={e => setEnabled(e.target.checked)} /><span className="cp-admin-choice-copy"><strong>Enable connection</strong><small>Accept people of this Okta org in the selected environment.</small></span></label>
    <label className="cp-admin-field"><span>Okta org URL <Help text={'The address of your Okta org, such as https://acme.okta.com or your custom domain.\n\nNot the Admin Console address: remove "-admin" from it.'} /></span><input className="cp-admin-input identity-mono" type="url" maxLength={2048} required placeholder="https://acme.okta.com" value={org} onChange={e => { setOrg(e.target.value.trim()); changed(); }} /><small><GuideLink href={domainGuide}>Find your Okta domain</GuideLink></small></label>
   </div></div>

   <div className="identity-form-section"><SectionHeading title="Okta API Services app" description="An API Services app in your org gives Xokepoint read access to your users and groups." help={'Xokepoint reads users and groups with the Okta Management API. It signs in as the API Services app with its private key, and every token is bound to Xokepoint with DPoP.\n\nIt asks only for okta.users.read and okta.groups.read, both read-only.\n\nDeactivated people and the Everyone group are not listed.'} /><div className="identity-form-fields">
    <ol className="lifecycle-steps" aria-label="Prepare Okta for Xokepoint">
     <li><span className="lifecycle-step-bubble" aria-hidden="true">1</span><div><strong>Create an API Services app</strong><span>In the Okta Admin Console, go to Applications, Applications, Create App Integration, and choose API Services. Name it, for example, Xokepoint directory. Copy its Client ID.</span><GuideLink href={serviceGuide}>Okta guide: create a service app</GuideLink></div></li>
     <li><span className="lifecycle-step-bubble" aria-hidden="true">2</span><div><strong>Generate a key</strong><span>In the app, General tab, Client Credentials, select Edit and choose Public key / Private key. Under Save keys in Okta, select Add key, then Generate new key. Copy the private key in JSON format at once: Okta shows it only once. Keep DPoP required.</span><GuideLink href={keyGuide}>Okta guide: generate the key</GuideLink></div></li>
     <li><span className="lifecycle-step-bubble" aria-hidden="true">3</span><div><strong>Grant the scopes</strong><span>In the app, Okta API Scopes tab, grant <code>okta.users.read</code> and <code>okta.groups.read</code>. Only a Super Administrator can grant scopes.</span><GuideLink href={scopesGuide}>Okta guide: grant scopes</GuideLink></div></li>
     <li><span className="lifecycle-step-bubble" aria-hidden="true">4</span><div><strong>Assign an admin role</strong><span>In the app, Admin roles tab, select Edit assignments and assign Read-only Administrator. Then paste the client ID and the key below.</span><GuideLink href={roleGuide}>Okta guide: assign admin roles</GuideLink></div></li>
    </ol>
    <label className="cp-admin-field">Client ID<input className="cp-admin-input identity-mono" maxLength={255} required placeholder="0oa…" value={clientId} onChange={e => { setClientId(e.target.value.trim()); changed(); }} /><small>The Client ID of the API Services app.</small></label>
    {hasStoredKey
     ? <label className="cp-admin-field">Private key<span className="identity-secret-row"><input className="cp-admin-input" type="password" disabled value="••••••••••••" aria-label="Stored private key" /><button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => { setChangingKey(true); changed(); }}>Change</button></span><small>Stored encrypted. Existing keys cannot be displayed.</small></label>
     : <label className="cp-admin-field"><span>Private key (JSON)</span><textarea className="cp-admin-input identity-mono identity-key" rows={5} spellCheck={false} autoComplete="off" placeholder={'{ "kty": "RSA", "kid": "…", "d": "…", … }'} value={privateKey} onChange={e => { setPrivateKey(e.target.value); changed(); }} /><small>{credentialsMoved && stored?.has_secret ? 'The org URL or the client ID changed: paste the private key of that app. ' : ''}The JSON key that Okta shows after Generate new key, with its kid. Stored encrypted. Existing keys cannot be displayed.</small></label>}
    {connection ? <div className="cp-admin-notice identity-mapping-warning" role="status"><TriangleAlert size={18} aria-hidden="true" /><div><strong>Changing the org</strong><span>If you change the org URL, the people associated before belong to the previous org and lose access. Xokepoint does not block the change.</span></div></div> : null}
    {localError || error ? <p className="cp-admin-notice cp-admin-notice--danger" role="alert">{localError || error}</p> : null}
    <div className="identity-inline-check"><button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={checking} onClick={() => void checkConnection()}>{checking ? 'Checking…' : 'Check connection'}</button><Help label="What the check verifies" text={'Check connection reads the metadata and signing keys of your org, gets a Management API token with the private key and DPoP, reads one user, the groups, and the groups of that user.\n\nIt tells you which step is missing: a wrong org URL, a wrong client ID, a wrong key, a scope not granted, or no admin role.'} /><small role="status">{checked ? 'Connection verified.' : 'Not checked'}</small></div>
    {checked && groupsReadable === false ? <p className="cp-admin-notice" role="status">The app can not read groups. Harness login needs it: grant okta.groups.read (step 3).</p> : null}
   </div></div>

   <div className="identity-form-section"><SectionHeading title="Request authentication" description="Let services of yours exchange Okta access tokens of your users for agent tokens." help={'Only needed for agents that run without a person at the keyboard: a service of yours sends the Okta access token of a user, and Xokepoint gives the agent a token for that user.\n\nOkta does not let other parties validate the access tokens of the org authorization server, so this needs a custom authorization server, part of Okta API Access Management.'} /><div className="identity-form-fields">
    <label className="cp-admin-choice identity-enable"><input className="cp-admin-switch" type="checkbox" role="switch" checked={headless} onChange={e => { setHeadless(e.target.checked); changed(); }} /><span className="cp-admin-choice-copy"><strong>Accept tokens from your services</strong><small>Needs a custom authorization server in Okta. Harness login and the directory work without it.</small></span></label>
    {headless ? <>
     <label className="cp-admin-field">Custom authorization server issuer<input className="cp-admin-input identity-mono" type="url" maxLength={2048} placeholder={`${orgUrl || 'https://acme.okta.com'}/oauth2/default`} value={authServer} onChange={e => { setAuthServer(e.target.value.trim()); changed(); }} /><small>In Security, API, Authorization Servers: the Issuer of the server. <GuideLink href={authServerGuide}>Okta guide: custom authorization server</GuideLink></small></label>
     <div className="identity-audiences"><span className="identity-field-label">Accepted audiences <Help text="The Audience of the custom authorization server. The default server uses api://default." /></span>{shownAudiences.map((audience, index) => <div className="identity-audience-row" key={index}><input className="cp-admin-input identity-mono" aria-label={`Audience ${index + 1}`} maxLength={2048} value={audience} onChange={e => { setAudiences(shownAudiences.map((value, i) => i === index ? e.target.value : value)); changed(); }} /><button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={shownAudiences.length === 1} aria-label={`Remove audience ${index + 1}`} onClick={() => { setAudiences(shownAudiences.filter((_, i) => i !== index)); changed(); }}><X size={16} /></button></div>)}<button className="identity-text-button" type="button" disabled={shownAudiences.length >= 10} onClick={() => { setAudiences([...shownAudiences, '']); changed(); }}><Plus size={15} />Add audience</button></div>
    </> : null}
   </div></div>

   <HarnessLoginSection provider="okta" loginGuide={loginAppGuide} value={login} stored={connection?.login ?? null} groupsCapable={groupsCapable} onChange={setLogin} />
  </fieldset>
  <footer className="identity-form-actions"><span /><button className="cp-admin-button cp-admin-button--ghost" type="button" disabled={pending} onClick={onCancel}>Cancel</button><button className="cp-admin-button" type="submit" disabled={pending}>{pending ? 'Working…' : connection ? 'Save changes' : 'Create connection'}</button></footer>
 </form>;
}
