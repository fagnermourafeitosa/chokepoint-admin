import { useState } from 'react';
import { Check, Copy, Plus, TriangleAlert, UserRoundSearch, X } from 'lucide-react';
import { usePendingChanges } from '../auth/pending/PendingChanges';
import type { DiscoveryResult, Eligibility, IdentityConnection, IdentityFields } from './api';
import { Help } from './Help';
import { SectionHeading } from './formParts';
import { initialLogin, loginInput } from './HarnessLoginSection';
import './identity.css';

// Generic OIDC connection form (Admin 065, Backend 106): any OpenID Connect provider without a
// directory. The issuer is read by discovery, or by typed endpoints; the people come from the tokens.
type Props = {
 connection?: IdentityConnection; workspaceLabel: string; pending: boolean; error: string;
 onSave: (fields: IdentityFields) => Promise<void>; onCheck: (fields: IdentityFields) => Promise<IdentityConnection | undefined>; onCancel: () => void;
};
const emptyEndpoints = { authorization_endpoint: '', token_endpoint: '', jwks_uri: '' };

export function GenericOidcConnectionForm({ connection, workspaceLabel, pending, error, onSave, onCheck, onCancel }: Props) {
 const [name, setName] = useState(connection?.name ?? '');
 const [enabled, setEnabled] = useState(connection?.enabled ?? true);
 const [issuer, setIssuer] = useState(connection?.issuer ?? '');
 const [manual, setManual] = useState(!!connection?.manual_endpoints);
 const [endpoints, setEndpoints] = useState(connection?.manual_endpoints ?? emptyEndpoints);
 const [emailClaim, setEmailClaim] = useState(connection?.email_claim ?? 'email');
 const [groupsClaim, setGroupsClaim] = useState(connection?.groups_claim ?? '');
 const [headless, setHeadless] = useState(!!connection?.audiences.length);
 const [audiences, setAudiences] = useState(connection?.audiences.length ? connection.audiences : ['']);
 const [eligibility, setEligibility] = useState<Eligibility>(connection?.eligibility ?? 'approved');
 const [extraScopes, setExtraScopes] = useState(connection?.extra_scopes ?? '');
 const [login, setLogin] = useState(() => initialLogin(connection?.login));
 const [changingSecret, setChangingSecret] = useState(false);
 const [discovery, setDiscovery] = useState<DiscoveryResult | null>(null);
 const [checked, setChecked] = useState(connection?.check_status === 'verified');
 const [checking, setChecking] = useState(false), [localError, setLocalError] = useState(''), [copied, setCopied] = useState(false);
 const fields = (): IdentityFields => ({
  provider: 'oidc', name: name.trim(), issuer: issuer.trim(), audiences: headless ? audiences.map(a => a.trim()) : [], enabled, revision: connection?.revision ?? 0, directory: null,
  manual_endpoints: manual ? endpoints : null, email_claim: emailClaim.trim() || 'email', groups_claim: groupsClaim.trim() || undefined, extra_scopes: extraScopes.trim() || undefined, eligibility, login: loginInput(login),
 });
 const current = JSON.stringify(fields());
 const [initial] = useState(current);
 usePendingChanges(pending || current !== initial);
 // Any change to what the check reads makes it stale.
 function changed() { setChecked(false); setDiscovery(null); setLocalError(''); }
 const keepsSecret = !!connection?.login?.has_secret && connection.login.client_id === login.client_id && !changingSecret;
 const redirect = connection?.login?.redirect_uri ?? '';
 function validate(): boolean {
  if (!name.trim() || !issuer.trim()) { setLocalError('Enter the connection name and the issuer URL.'); return false; }
  if (manual && (!endpoints.authorization_endpoint || !endpoints.token_endpoint || !endpoints.jwks_uri)) { setLocalError('Enter the three endpoints, or turn off Enter endpoints manually.'); return false; }
  if (headless && audiences.some(a => !a.trim())) { setLocalError('Enter each accepted audience, or remove the empty one.'); return false; }
  if (eligibility === 'groups' && !groupsClaim.trim()) { setLocalError('People in chosen groups needs a groups claim.'); return false; }
  if (login.enabled && (!login.client_id || (!login.client_secret && !keepsSecret))) { setLocalError('Enter the client ID and the client secret of the application registered for harness login.'); return false; }
  return true;
 }
 async function check() {
  if (!validate()) return;
  setChecking(true); setChecked(false); setDiscovery(null);
  try {
   const result = await onCheck(fields());
   if (result?.check_status === 'verified') { setChecked(true); setDiscovery(result.discovery ?? null); }
  } finally { setChecking(false); }
 }
 const eligibilityOption = (value: Eligibility, title: string, note: React.ReactNode, disabled = false) => <label className="cp-admin-choice"><input type="radio" name="eligibility" checked={eligibility === value} disabled={disabled} onChange={() => setEligibility(value)} /><span className="cp-admin-choice-copy"><strong>{title}</strong><small>{note}</small></span></label>;

 return <form className="cp-admin-panel identity-form identity-form-redesign generic-oidc-form" onSubmit={event => { event.preventDefault(); if (validate()) void onSave(fields()); }}>
  <fieldset disabled={pending || checking}>
   <div className="identity-form-section"><SectionHeading title="Connection" description="Identify this connection in your workspace." help="The connection belongs to the selected workspace and environment." /><div className="identity-form-fields">
    <label className="cp-admin-field">Connection name<input className="cp-admin-input" maxLength={80} required value={name} onChange={e => setName(e.target.value)} /></label><small>{workspaceLabel}</small>
    <label className="cp-admin-choice identity-enable"><input className="cp-admin-switch" type="checkbox" role="switch" checked={enabled} onChange={e => setEnabled(e.target.checked)} /><span className="cp-admin-choice-copy"><strong>Enable connection</strong><small>Accept people who sign in with this provider in the selected environment.</small></span></label>
   </div></div>

   <div className="identity-form-section"><SectionHeading title="Provider" description="Any OpenID Connect provider that publishes its discovery document and public keys." help={'The platform reads /.well-known/openid-configuration of the issuer, then its public keys (jwks_uri), and verifies the signature of each token with them.\n\nA provider that signs tokens only with a shared secret (HS256), or issues opaque tokens, can not be verified and is refused.'} /><div className="identity-form-fields">
    <label className="cp-admin-field">Issuer URL<input className="cp-admin-input identity-mono" type="url" maxLength={2048} required placeholder="https://login.example.com" value={issuer} onChange={e => { setIssuer(e.target.value.trim()); changed(); }} /><small>The exact issuer of the tokens, the iss claim. Without manual endpoints, discovery is read from this address.</small></label>
    <label className="cp-admin-choice identity-enable"><input className="cp-admin-switch" type="checkbox" role="switch" checked={manual} onChange={e => { setManual(e.target.checked); changed(); }} /><span className="cp-admin-choice-copy"><strong>Enter endpoints manually</strong><small>For a server that does not publish /.well-known/openid-configuration.</small></span></label>
    {manual ? <>
     <label className="cp-admin-field">Authorization endpoint<input className="cp-admin-input identity-mono" type="url" maxLength={2048} value={endpoints.authorization_endpoint} onChange={e => { setEndpoints({ ...endpoints, authorization_endpoint: e.target.value.trim() }); changed(); }} /><small>Where people sign in. Needed only for harness login.</small></label>
     <label className="cp-admin-field">Token endpoint<input className="cp-admin-input identity-mono" type="url" maxLength={2048} value={endpoints.token_endpoint} onChange={e => { setEndpoints({ ...endpoints, token_endpoint: e.target.value.trim() }); changed(); }} /><small>Where the platform exchanges the sign-in code for the ID token. Needed only for harness login.</small></label>
     <label className="cp-admin-field">Public keys URL (JWKS)<input className="cp-admin-input identity-mono" type="url" maxLength={2048} value={endpoints.jwks_uri} onChange={e => { setEndpoints({ ...endpoints, jwks_uri: e.target.value.trim() }); changed(); }} /><small>The keys that verify the signature of each token.</small></label>
    </> : null}
    {localError || error ? <p className="cp-admin-notice cp-admin-notice--danger" role="alert">{localError || error}</p> : null}
    <div className="identity-inline-check"><button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={checking} onClick={() => void check()}>{checking ? 'Checking…' : manual ? 'Check endpoints' : 'Read discovery'}</button><small role="status">{checked ? (manual ? 'Public keys read.' : 'Discovery read.') : 'Not checked'}</small></div>
    {discovery ? <dl className="oidc-discovery">
     {discovery.authorization_endpoint && !manual ? <><dt>Authorization endpoint</dt><dd><code>{discovery.authorization_endpoint}</code></dd></> : null}
     {discovery.token_endpoint && !manual ? <><dt>Token endpoint</dt><dd><code>{discovery.token_endpoint}</code></dd></> : null}
     <dt>Public keys</dt><dd><code>{discovery.jwks_uri}</code><small>{discovery.keys} {discovery.keys === 1 ? 'key' : 'keys'}</small></dd>
     {discovery.algorithms.length ? <><dt>{manual ? 'Key algorithms' : 'Signing algorithms'}</dt><dd>{discovery.algorithms.map(alg => <span key={alg} className="mcp-badge">{alg}</span>)}</dd></> : null}
     {discovery.claims?.length ? <><dt>Claims</dt><dd>{discovery.claims.map(claim => <code key={claim}>{claim}</code>)}</dd></> : null}
    </dl> : null}
   </div></div>

   <div className="identity-form-section"><SectionHeading title="Who is who" description="How the platform tells people apart, and what it shows about them." help={'A person is the pair issuer and sub. The sub never changes, so access stays with the same person.\n\nThe email can change in many providers, and in some the person edits it. It is only shown, never used to identify anyone.'} /><div className="identity-form-fields">
    <div className="identity-value"><span className="identity-field-label">Person identifier</span><code>iss + sub</code></div>
    <div className="identity-two-fields">
     <label className="cp-admin-field">Email claim<input className="cp-admin-input identity-mono" maxLength={64} value={emailClaim} onChange={e => setEmailClaim(e.target.value.trim())} /><small>Shown in the Admin only when email_verified is true.</small></label>
     <label className="cp-admin-field">Groups claim<input className="cp-admin-input identity-mono" maxLength={64} placeholder="groups" value={groupsClaim} onChange={e => { setGroupsClaim(e.target.value.trim()); if (!e.target.value.trim() && eligibility === 'groups') setEligibility('approved'); }} /><small>Optional. A list of strings in the token. Leave it empty if the provider sends no groups.</small></label>
    </div>
    <div className="cp-admin-notice identity-info generic-oidc-notice" role="status"><UserRoundSearch size={18} aria-hidden="true" /><div><strong>No directory</strong><span>This provider has no list of people to read. A person appears in People after the first harness login or token exchange. Group names are typed as they come in the groups claim.</span></div></div>
   </div></div>

   <div className="identity-form-section"><SectionHeading title="Request authentication" description="Let services of yours exchange access tokens of your users for agent tokens." help="Only needed for agents that run without a person at the keyboard: a service of yours sends the access token of a user, and the platform gives the agent a token for that user." /><div className="identity-form-fields">
    <label className="cp-admin-choice identity-enable"><input className="cp-admin-switch" type="checkbox" role="switch" checked={headless} onChange={e => setHeadless(e.target.checked)} /><span className="cp-admin-choice-copy"><strong>Accept tokens from your services</strong><small>Harness login works without it.</small></span></label>
    {headless ? <div className="identity-audiences"><span className="identity-field-label">Accepted audiences</span>{audiences.map((audience, index) => <div className="identity-audience-row" key={index}><input className="cp-admin-input identity-mono" aria-label={`Audience ${index + 1}`} maxLength={2048} value={audience} onChange={e => setAudiences(audiences.map((value, i) => i === index ? e.target.value : value))} /><button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={audiences.length === 1} aria-label={`Remove audience ${index + 1}`} onClick={() => setAudiences(audiences.filter((_, i) => i !== index))}><X size={16} /></button></div>)}<button className="identity-text-button" type="button" disabled={audiences.length >= 10} onClick={() => setAudiences([...audiences, ''])}><Plus size={15} />Add audience</button><small>The aud of the access tokens that your services send.</small></div> : null}
   </div></div>

   <div className="identity-form-section"><SectionHeading title="Harness login" description="Let people log in from a coding harness through this provider." help="People log in from a coding harness (Claude Code, Codex and similar) through this provider. The platform sends the person to the provider with the authorization code flow and PKCE, reads who they are from the ID token, then asks for their consent." /><div className="identity-form-fields">
    <label className="cp-admin-choice identity-enable"><input className="cp-admin-switch" type="checkbox" role="switch" checked={login.enabled} onChange={e => setLogin({ ...login, enabled: e.target.checked })} /><span className="cp-admin-choice-copy"><strong>Allow harness login</strong><small>Each person still sees the agent and its tools and consents at login.</small></span></label>
    {login.enabled ? <>
     <fieldset className="cp-admin-choice-group"><legend>Who can log in</legend>
      {eligibilityOption('groups', 'People in chosen groups', groupsClaim ? <>Each agent chooses the groups, read from the <code>{groupsClaim}</code> claim.</> : 'Needs a groups claim.', !groupsClaim)}
      {eligibilityOption('everyone', 'Everyone who signs in with this provider', 'Each agent still limits the tools, resources and rules.')}
      {eligibilityOption('approved', 'Approved people only', 'After the first login, a person waits until you approve them in People. Approved once for this connection.')}
     </fieldset>
     {eligibility === 'everyone' ? <div className="cp-admin-notice identity-mapping-warning" role="status"><TriangleAlert size={18} aria-hidden="true" /><div><strong>Anyone with an account can log in</strong><span>If people can create their own account in this provider, they can log in too. Block a person in the agent to stop them.</span></div></div> : null}
     <ol className="lifecycle-steps" aria-label="Register the platform in your login server">
      <li><span className="lifecycle-step-bubble" aria-hidden="true">1</span><div><strong>Register the platform in your login server</strong><span>Once, for everyone who logs in from a harness. The administrator of your OIDC server creates an application for the platform, the same way as for any app that uses your login.</span></div></li>
      <li><span className="lifecycle-step-bubble" aria-hidden="true">2</span><div><strong>Allow this redirect URI</strong><span>Your server sends people back to this address after they sign in. It refuses any address that is not allowed.</span>
       {redirect ? <div className="identity-value oidc-step-value"><code>{redirect}</code><button type="button" className="relation-icon-button" aria-label="Copy redirect URI" onClick={() => { void navigator.clipboard?.writeText(redirect); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check size={14} /> : <Copy size={14} />}</button></div> : <span className="cp-admin-muted">Save the connection to get the redirect URI.</span>}</div></li>
      <li><span className="lifecycle-step-bubble" aria-hidden="true">3</span><div><strong>Paste the client ID and secret</strong><span>Your server creates them for that application. The client ID tells your server that the request comes from the platform; the secret proves it when the platform receives the sign-in.</span></div></li>
     </ol>
     <div className="identity-two-fields">
      <label className="cp-admin-field">Client ID<input className="cp-admin-input identity-mono" maxLength={255} required value={login.client_id} onChange={e => setLogin({ ...login, client_id: e.target.value.trim() })} /></label>
      <label className="cp-admin-field">Client secret{keepsSecret
       ? <span className="identity-secret-row"><input className="cp-admin-input" type="password" disabled value="••••••••••••" aria-label="Stored client secret" /><button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => setChangingSecret(true)}>Change</button></span>
       : <input className="cp-admin-input" type="password" autoComplete="new-password" maxLength={4096} value={login.client_secret ?? ''} onChange={e => setLogin({ ...login, client_secret: e.target.value })} />}
       <small>Stored encrypted. Existing secrets cannot be displayed.</small></label>
     </div>
     <label className="cp-admin-field"><span>Additional scopes <Help text={'The platform always asks for openid, email and profile.\n\nSome providers add the groups claim only when a scope asks for it. Name that scope here, as your provider documents it.'} /></span><input className="cp-admin-input identity-mono" maxLength={255} placeholder="groups" value={extraScopes} onChange={e => setExtraScopes(e.target.value)} /><small>Optional, separated by spaces.</small></label>
    </> : null}
   </div></div>
  </fieldset>
  <footer className="identity-form-actions"><span /><button className="cp-admin-button cp-admin-button--ghost" type="button" disabled={pending} onClick={onCancel}>Cancel</button><button className="cp-admin-button" type="submit" disabled={pending || !checked}>{pending ? 'Working…' : connection ? 'Save changes' : 'Create connection'}</button></footer>
 </form>;
}
