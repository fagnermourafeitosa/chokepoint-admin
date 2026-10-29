import { useCallback, useState } from 'react';
import { ArrowLeft, Check, Plus, X } from 'lucide-react';
import { usePendingChanges } from '../auth/pending/PendingChanges';
import { useAuth } from '../auth/AuthContext';
import type { EnvironmentScope } from '../access/environment-scope';
import type { DirectoryCheck, DirectorySettings, IdentityConnection, IdentityFields, IssuingClient, ProviderCapability } from './api';
import { Help } from './Help';
import { LifecycleSyncSection } from './LifecycleSyncSection';
import { secretLeaveMessage } from './useLifecycleSync';
import './identity.css';

type Props = {
 scope: EnvironmentScope; connection?: IdentityConnection; providers: ProviderCapability[]; providerError: boolean; pending: boolean; error: string;
 onSave: (fields: IdentityFields) => Promise<void>; onCheck: (fields: IdentityFields) => Promise<boolean>;
 onDirectoryCheck: (fields: IdentityFields) => Promise<DirectoryCheck | undefined>; onCancel: () => void;
};
const emptyDirectory = (): DirectorySettings => ({ client_id: '', issuing_client_id: '', client_secret: '', has_secret: false, check_status: 'not_checked', checked_at: null });
const checkHelp = 'Check connection verifies the issuer metadata and signing keys, then reads the directory with the service account and loads the realm clients.\n\nThe directory must contain at least one user. The token subject (sub) must match the user\'s SCIM ID: new associations are checked with a Keycloak example token for the issuing client.\n\nThe check does not verify a real login, the token audience, later mapper changes, or permission to use a tool.';
function SectionHeading({ title, description, help }: { title: string; description: string; help: string }) {
 return <div className="identity-section-heading"><h2>{title} <Help text={help} /></h2><p>{description}</p></div>;
}
export function IdentityConnectionForm({ scope, connection, providers, providerError, pending, error, onSave, onCheck, onDirectoryCheck, onCancel }: Props) {
 const auth = useAuth();
 const [provider, setProvider] = useState(connection?.provider ?? '');
 const [name, setName] = useState(connection?.name ?? '');
 const [issuer, setIssuer] = useState(connection?.issuer ?? '');
 const [audiences, setAudiences] = useState(connection?.audiences ?? ['']);
 const [groups] = useState(connection?.groups_claim ?? '');
 const [enabled, setEnabled] = useState(connection?.enabled ?? true);
 const [directory, setDirectory] = useState<DirectorySettings>(connection?.directory ?? emptyDirectory);
 const [checked, setChecked] = useState(connection?.check_status === 'verified' && connection.directory?.check_status === 'verified');
 // Realm clients from the last passed check. A saved connection shows its stored
 // issuing client until the next check loads the list.
 const [clients, setClients] = useState<{ items: IssuingClient[]; truncated: boolean } | null>(null);
 const [localError, setLocalError] = useState('');
 const fields = (): IdentityFields => ({ provider, name: name.trim(), issuer, audiences, groups_claim: groups, enabled, revision: connection?.revision ?? 0, directory });
 const current = JSON.stringify(fields());
 const [initial] = useState(current);
 usePendingChanges(pending || current !== initial);
 const selected = providers.find(p => p.provider === provider);
 const lockedProvider = !!connection;
 // A revealed lifecycle secret cannot be shown again, so leaving asks first.
 const [secretVisible, setSecretVisible] = useState(false);
 const onSecretVisibleChange = useCallback((visible: boolean) => setSecretVisible(visible), []);
 const [checking, setChecking] = useState(false);
 const leave = () => { if (!secretVisible || window.confirm(secretLeaveMessage)) onCancel(); };
 function changedAuthentication() { setChecked(false); setLocalError(''); }
 // A change to the issuer or the directory credentials invalidates the client list.
 function changedCredentials() { changedAuthentication(); setClients(null); }
 function updateDirectory(next: Partial<DirectorySettings>) { setDirectory(value => ({ ...value, ...next })); changedCredentials(); }
 function validateCheck(): boolean {
  if (!name.trim() || !issuer.trim() || audiences.some(a => !a.trim())) { setLocalError('Enter the connection name, issuer and accepted audience.'); return false; }
  if (!directory.client_id || (!directory.client_secret && !directory.has_secret)) { setLocalError('Enter the directory client ID and client secret.'); return false; }
  return true;
 }
 function validate(): boolean {
  if (!validateCheck()) return false;
  if (provider === 'keycloak' && !directory.issuing_client_id?.trim()) { setLocalError('Check the connection, then choose the token issuing client.'); return false; }
  return true;
 }
 async function checkConnection() {
  if (!validateCheck()) return;
  setChecking(true); setChecked(false);
  try {
   if (!await onCheck(fields())) return;
   const result = await onDirectoryCheck(fields());
   if (!result || result.check_status !== 'verified') return;
   const items = result.issuing_clients ?? [];
   setClients({ items, truncated: !!result.truncated });
   if (!items.some(item => item.client_id === directory.issuing_client_id)) setDirectory(value => ({ ...value, issuing_client_id: '' }));
   setChecked(true);
  } finally { setChecking(false); }
 }
 const clientOptions = clients?.items ?? (directory.issuing_client_id ? [{ client_id: directory.issuing_client_id }] : []);
 return <section className="identity-editor" aria-label={connection ? 'Edit identity provider' : 'Connect identity provider'}>
  <button className="identity-back" type="button" onClick={leave} disabled={pending}><ArrowLeft size={16} />Identity providers</button>
  <header><h1 className="cp-admin-title">{connection ? 'Edit identity provider' : 'Connect identity provider'}</h1><p className="cp-admin-muted">Choose a provider to configure authentication and user access.</p></header>
  {providerError ? <p role="alert" className="cp-admin-notice cp-admin-notice--danger">Provider capabilities are unavailable. Reload and try again.</p> : null}
  <div className="identity-provider-choices" role="group" aria-label="Identity provider">
   {providers.map(item => <button key={item.provider} type="button" className="identity-provider-choice" data-selected={provider === item.provider || undefined} aria-pressed={provider === item.provider} disabled={pending || (lockedProvider && item.provider !== connection?.provider)} onClick={() => { setProvider(item.provider); changedCredentials(); }}>
    {provider === item.provider ? <Check className="identity-provider-tick" size={16} aria-hidden="true" /> : null}
    <img src={`/idp-icons/${item.provider}.svg`} alt="" width="36" height="36" /><strong>{item.name}</strong>{!item.available ? <small>Not available yet</small> : null}
   </button>)}
  </div>
  {provider && selected && !selected.available ? <p className="cp-admin-notice" role="status">{selected.name} is not available yet.</p> : null}
  {selected?.available ? <form className="cp-admin-panel identity-form identity-form-redesign" onSubmit={event => { event.preventDefault(); if (validate()) { void onSave(fields()); } }}>
   <fieldset disabled={pending || checking}>
    <div className="identity-form-section"><SectionHeading title="Connection" description="Identify this connection in your workspace." help="The connection belongs to the selected workspace and environment." /><div className="identity-form-fields"><label className="cp-admin-field">Connection name<input className="cp-admin-input" required maxLength={80} value={name} onChange={e => { setName(e.target.value); changedAuthentication(); }} /></label><small>{auth.workspace?.name} / {auth.environment?.name === 'production' ? 'Production' : 'Sandbox'}</small>
     <label className="cp-admin-choice identity-enable"><input className="cp-admin-switch" type="checkbox" role="switch" checked={enabled} onChange={e => setEnabled(e.target.checked)} /><span className="cp-admin-choice-copy"><strong>Enable connection</strong><small>Accept valid access tokens from this issuer in the selected environment.</small></span></label></div></div>
    <div className="identity-form-section"><SectionHeading title="Request authentication" description="Validate access tokens for your MCP requests." help="The issuer identifies the token issuer. Accepted audiences identify the APIs for which tokens are valid." /><div className="identity-form-fields">
     <label className="cp-admin-field">Issuer URL<input className="cp-admin-input identity-mono" type="url" required maxLength={2048} placeholder="https://sso.example.com/realms/workforce" value={issuer} onChange={e => { setIssuer(e.target.value); changedCredentials(); }} /><small>Use the exact issuer URL published by your identity provider.</small></label>
     <div className="identity-audiences"><span className="identity-field-label">Accepted audiences</span>{audiences.map((audience,index) => <div className="identity-audience-row" key={index}><input className="cp-admin-input identity-mono" aria-label={`Accepted audience ${index + 1}`} required maxLength={2048} value={audience} onChange={e => { setAudiences(values => values.map((value,i) => i === index ? e.target.value : value)); changedAuthentication(); }} placeholder="https://gateway.example.com/mcp" /><button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={audiences.length === 1} aria-label={`Remove audience ${index + 1}`} onClick={() => { setAudiences(values => values.filter((_,i) => i !== index)); changedAuthentication(); }}><X size={16} /></button></div>)}<button className="identity-text-button" type="button" disabled={audiences.length >= 10} onClick={() => { setAudiences(values => [...values,'']); changedAuthentication(); }}><Plus size={15} />Add audience</button><small>The resource identifiers accepted in access tokens.</small></div>
    </div></div>
    <div className="identity-form-section"><SectionHeading title="User directory" description="Read users to associate them with agents." help={"The backend uses this separate service account to read the directory. It does not grant user permissions." + (provider === 'keycloak' ? "\n\nKeycloak administrative access is required: grant this service account the realm-management roles view-users and view-clients, or equivalent permissions. Each new association is checked separately.\n\nKeycloak SCIM may not list every user from external or federated directories, such as LDAP. An empty or incomplete list does not mean those users do not exist in the identity provider." : "")} /><div className="identity-form-fields">
     <div className="identity-two-fields"><label className="cp-admin-field">Client ID<input className="cp-admin-input identity-mono" required maxLength={255} value={directory.client_id} onChange={e => updateDirectory({ client_id: e.target.value })} /><small>{provider === 'keycloak' ? 'The service account client that reads the directory. It needs the Keycloak roles view-users and view-clients.' : 'The service account client that reads the directory.'}</small></label><label className="cp-admin-field">Client secret<input className="cp-admin-input" type="password" autoComplete="new-password" required={!directory.has_secret} maxLength={4096} placeholder={directory.has_secret ? 'Leave blank to keep existing secret' : ''} value={directory.client_secret ?? ''} onChange={e => updateDirectory({ client_secret: e.target.value })} /><small>Stored encrypted. Existing secrets cannot be displayed.</small></label></div>
     {error || localError ? <p className="cp-admin-notice cp-admin-notice--danger" role="alert">{error || localError}</p> : null}
     <div className="identity-inline-check"><button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={checking} onClick={() => void checkConnection()}>{checking ? 'Checking…' : 'Check connection'}</button><Help label="What the check verifies" text={checkHelp} /><small role="status">{checked ? 'Connection verified.' : 'Not checked'}</small></div>
     {provider === 'keycloak' ? <label className="cp-admin-field">Token issuing client<select className="cp-admin-input identity-mono" required disabled={!clients} value={directory.issuing_client_id ?? ''} onChange={e => setDirectory(value => ({ ...value, issuing_client_id: e.target.value }))}>
      <option value="">{clients ? 'Choose a client' : 'Check the connection to load clients'}</option>
      {clientOptions.map(item => <option key={item.client_id} value={item.client_id}>{item.name ? `${item.client_id} — ${item.name}` : item.client_id}</option>)}
     </select><small>{clients?.truncated ? 'Only the first 500 realm clients are listed.' : 'The Keycloak client that issues user access tokens for this integration.'}</small></label> : null}
    </div></div>
    <LifecycleSyncSection scope={scope} connection={connection} onSecretVisibleChange={onSecretVisibleChange} />
   </fieldset>
   <footer className="identity-form-actions"><span /><button className="cp-admin-button cp-admin-button--ghost" type="button" disabled={pending} onClick={leave}>Cancel</button><button className="cp-admin-button" type="submit" disabled={pending}>{pending ? 'Working…' : connection ? 'Save changes' : 'Create connection'}</button></footer>
  </form> : null}
 </section>;
}
