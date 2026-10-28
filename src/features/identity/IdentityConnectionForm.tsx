import { useState } from 'react';
import { ArrowLeft, Check, Info, Plus, TriangleAlert, X } from 'lucide-react';
import { usePendingChanges } from '../auth/pending/PendingChanges';
import { useAuth } from '../auth/AuthContext';
import type { DirectorySettings, IdentityConnection, IdentityFields, ProviderCapability } from './api';
import './identity.css';

type Props = {
 connection?: IdentityConnection; providers: ProviderCapability[]; providerError: boolean; pending: boolean; error: string;
 onSave: (fields: IdentityFields) => Promise<void>; onCheck: (fields: IdentityFields) => Promise<boolean>;
 onDirectoryCheck: (fields: IdentityFields) => Promise<boolean>; onCancel: () => void;
};
const emptyDirectory = (): DirectorySettings => ({ base_url: '', token_url: '', client_id: '', client_secret: '', has_secret: false, check_status: 'not_checked', checked_at: null });
function Help({ text }: { text: string }) { return <details className="identity-help"><summary aria-label="More information"><Info size={16} aria-hidden="true" /></summary><span>{text}</span></details>; }
function SectionHeading({ title, description, help }: { title: string; description: string; help: string }) {
 return <div className="identity-section-heading"><h2>{title} <Help text={help} /></h2><p>{description}</p></div>;
}
export function IdentityConnectionForm({ connection, providers, providerError, pending, error, onSave, onCheck, onDirectoryCheck, onCancel }: Props) {
 const auth = useAuth();
 const [provider, setProvider] = useState(connection?.provider ?? '');
 const [name, setName] = useState(connection?.name ?? '');
 const [issuer, setIssuer] = useState(connection?.issuer ?? '');
 const [audiences, setAudiences] = useState(connection?.audiences ?? ['']);
 const [groups] = useState(connection?.groups_claim ?? '');
 const [enabled, setEnabled] = useState(connection?.enabled ?? true);
 const [directory, setDirectory] = useState<DirectorySettings>(connection?.directory ?? emptyDirectory);
 const [authChecked, setAuthChecked] = useState(connection?.check_status === 'verified'), [directoryChecked, setDirectoryChecked] = useState(connection?.directory?.check_status === 'verified');
 const [localError, setLocalError] = useState('');
 const fields = (): IdentityFields => ({ provider, name: name.trim(), issuer, audiences, groups_claim: groups, enabled, revision: connection?.revision ?? 0, directory });
 const current = JSON.stringify(fields());
 const [initial] = useState(current);
 usePendingChanges(pending || current !== initial);
 const selected = providers.find(p => p.provider === provider);
 const lockedProvider = !!connection;
 function changedAuthentication() { setAuthChecked(false); setLocalError(''); }
 function updateDirectory(next: Partial<DirectorySettings>) { setDirectory(value => ({ ...value, ...next })); setDirectoryChecked(false); setLocalError(''); }
 function validate(): boolean {
  if (!name.trim() || !issuer.trim() || audiences.some(a => !a.trim())) { setLocalError('Enter the connection name, issuer and an accepted audience.'); return false; }
  return true;
 }
 async function checkAuth() { if (validate()) setAuthChecked(await onCheck(fields())); }
 async function checkDirectory() {
  if (!validate()) return;
  if (!directory.base_url || !directory.token_url || !directory.client_id || (!directory.client_secret && !directory.has_secret)) { setLocalError('Enter the SCIM URL, token endpoint, client ID and client secret.'); return; }
  setDirectoryChecked(await onDirectoryCheck(fields()));
 }
 return <section className="identity-editor" aria-label={connection ? 'Edit identity provider' : 'Connect identity provider'}>
  <button className="identity-back" type="button" onClick={onCancel} disabled={pending}><ArrowLeft size={16} />Identity providers</button>
  <header><h1 className="cp-admin-title">{connection ? 'Edit identity provider' : 'Connect identity provider'}</h1><p className="cp-admin-muted">Choose a provider to configure authentication and user access.</p></header>
  {providerError ? <p role="alert" className="cp-admin-notice cp-admin-notice--danger">Provider capabilities are unavailable. Reload and try again.</p> : null}
  <div className="identity-provider-choices" role="group" aria-label="Identity provider">
   {providers.map(item => <button key={item.provider} type="button" className="identity-provider-choice" data-selected={provider === item.provider || undefined} aria-pressed={provider === item.provider} disabled={pending || (lockedProvider && item.provider !== connection?.provider)} onClick={() => { setProvider(item.provider); changedAuthentication(); setDirectoryChecked(false); }}>
    {provider === item.provider ? <Check className="identity-provider-tick" size={16} aria-hidden="true" /> : null}
    <img src={`/idp-icons/${item.provider}.svg`} alt="" width="36" height="36" /><strong>{item.name}</strong>{!item.available ? <small>Not available yet</small> : null}
   </button>)}
  </div>
  {provider && selected && !selected.available ? <p className="cp-admin-notice" role="status">{selected.name} is not available yet.</p> : null}
  {selected?.available ? <form className="cp-admin-panel identity-form identity-form-redesign" onSubmit={event => { event.preventDefault(); if (validate()) void onSave(fields()); }}>
   <fieldset disabled={pending}>
    <div className="identity-form-section"><SectionHeading title="Connection" description="Identify this connection in your workspace." help="The connection belongs to the selected workspace and environment." /><div className="identity-form-fields"><label className="cp-admin-field">Connection name<input className="cp-admin-input" required maxLength={80} value={name} onChange={e => { setName(e.target.value); changedAuthentication(); }} /></label><small>{auth.workspace?.name} / {auth.environment?.name === 'production' ? 'Production' : 'Sandbox'}</small></div></div>
    <div className="identity-form-section"><SectionHeading title="Request authentication" description="Validate access tokens for your MCP requests." help="The issuer identifies the token issuer. Accepted audiences identify the APIs for which tokens are valid." /><div className="identity-form-fields">
     {provider === 'keycloak' ? <div className="cp-admin-notice identity-mapping-warning"><TriangleAlert size={18} aria-hidden="true" /><div><strong>Verify the Keycloak user identifier</strong><span>The token's subject (sub) must match the user's SCIM ID. The default Keycloak subject mapper does this. Custom or pairwise subject mappers can change the value. The checks below do not verify this mapping; confirm it with a real user token before granting access.</span></div></div> : null}
     <label className="cp-admin-field">Issuer URL<input className="cp-admin-input identity-mono" type="url" required maxLength={2048} placeholder="https://sso.example.com/realms/workforce" value={issuer} onChange={e => { setIssuer(e.target.value); changedAuthentication(); setDirectoryChecked(false); }} /><small>Use the exact issuer URL published by your identity provider.</small></label>
     <div className="identity-audiences"><span className="identity-field-label">Accepted audiences</span>{audiences.map((audience,index) => <div className="identity-audience-row" key={index}><input className="cp-admin-input identity-mono" aria-label={`Accepted audience ${index + 1}`} required maxLength={2048} value={audience} onChange={e => { setAudiences(values => values.map((value,i) => i === index ? e.target.value : value)); changedAuthentication(); }} placeholder="https://gateway.example.com/mcp" /><button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={audiences.length === 1} aria-label={`Remove audience ${index + 1}`} onClick={() => { setAudiences(values => values.filter((_,i) => i !== index)); changedAuthentication(); }}><X size={16} /></button></div>)}<button className="identity-text-button" type="button" disabled={audiences.length >= 10} onClick={() => { setAudiences(values => [...values,'']); changedAuthentication(); }}><Plus size={15} />Add audience</button><small>The resource identifiers accepted in access tokens.</small></div>
     <div className="identity-inline-check"><button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={() => void checkAuth()}>Check authentication</button><small role="status">{authChecked ? 'Issuer metadata and signing keys verified.' : 'Not checked'}</small></div>
     <div className="cp-admin-notice identity-mapping-warning"><TriangleAlert size={18} aria-hidden="true" /><div><strong>What the checks verify</strong><span>The authentication check verifies issuer metadata and signing keys. The directory check verifies SCIM access. Neither verifies a user's login, token audience, or permission to use a tool.</span></div></div>
    </div></div>
    <div className="identity-form-section"><SectionHeading title="User directory (SCIM)" description="Read users to associate them with agents." help="The backend uses this separate service account to read the directory. It does not grant user permissions." /><div className="identity-form-fields">
     {provider === 'keycloak' ? <div className="cp-admin-notice identity-mapping-warning"><TriangleAlert size={18} aria-hidden="true" /><div><strong>Directory coverage</strong><span>Keycloak SCIM may not list every user from external or federated directories, such as LDAP. An empty or incomplete list does not mean those users do not exist in the identity provider.</span></div></div> : null}
     <label className="cp-admin-field">SCIM API URL<input className="cp-admin-input identity-mono" type="url" required maxLength={2048} placeholder="https://sso.example.com/realms/workforce/scim/v2" value={directory.base_url} onChange={e => updateDirectory({ base_url: e.target.value })} /></label>
     <label className="cp-admin-field">Token endpoint<input className="cp-admin-input identity-mono" type="url" required maxLength={2048} placeholder="https://sso.example.com/realms/workforce/protocol/openid-connect/token" value={directory.token_url} onChange={e => updateDirectory({ token_url: e.target.value })} /></label>
     <div className="identity-two-fields"><label className="cp-admin-field">Client ID<input className="cp-admin-input identity-mono" required maxLength={255} value={directory.client_id} onChange={e => updateDirectory({ client_id: e.target.value })} /><small>The SCIM token audience must match the SCIM API URL.</small></label><label className="cp-admin-field">Client secret<input className="cp-admin-input" type="password" autoComplete="new-password" required={!directory.has_secret} maxLength={4096} placeholder={directory.has_secret ? 'Leave blank to keep existing secret' : ''} value={directory.client_secret ?? ''} onChange={e => updateDirectory({ client_secret: e.target.value })} /><small>Stored encrypted. Existing secrets cannot be displayed.</small></label></div>
     <div className="identity-inline-check"><button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={() => void checkDirectory()}>Check directory access</button><small role="status">{directoryChecked ? 'Directory access verified.' : 'Not checked'}</small></div>
    </div></div>
    <div className="identity-lifecycle"><strong>Lifecycle events</strong><Help text="Webhook synchronization is a separate delivery and is not available yet." /><span className="mcp-badge">Not available yet</span></div>
    <label className="cp-admin-choice identity-enable"><input className="cp-admin-switch" type="checkbox" role="switch" checked={enabled} onChange={e => setEnabled(e.target.checked)} /><span className="cp-admin-choice-copy"><strong>Enable connection</strong><small>Accept valid access tokens from this issuer in the selected environment.</small></span></label>
   </fieldset>
   {error || localError ? <p className="cp-admin-notice cp-admin-notice--danger" role="alert">{error || localError}</p> : null}
   <footer className="identity-form-actions"><span /><button className="cp-admin-button cp-admin-button--ghost" type="button" disabled={pending} onClick={onCancel}>Cancel</button><button className="cp-admin-button" type="submit" disabled={pending}>{pending ? 'Working…' : connection ? 'Save changes' : 'Create connection'}</button></footer>
  </form> : null}
 </section>;
}
