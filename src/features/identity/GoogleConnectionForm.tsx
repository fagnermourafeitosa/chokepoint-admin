import { useState } from 'react';
import { ExternalLink, Plus, TriangleAlert, X } from 'lucide-react';
import { usePendingChanges } from '../auth/pending/PendingChanges';
import type { DirectoryCheck, DirectorySettings, IdentityConnection, IdentityFields } from './api';
import { Help } from './Help';
import './identity.css';

const enableApiGuide = 'https://developers.google.com/workspace/guides/enable-apis';
const serviceAccountGuide = 'https://developers.google.com/workspace/guides/create-credentials#service-account';
const delegationGuide = 'https://knowledge.workspace.google.com/admin/apps/control-api-access-with-domain-wide-delegation';
function GuideLink({ href, children }: { href: string; children: string }) {
 return <a href={href} target="_blank" rel="noreferrer">{children} <ExternalLink size={13} aria-hidden="true" /></a>;
}
const googleIssuer = 'https://accounts.google.com';
function SectionHeading({ title, description, help }: { title: string; description: string; help: string }) {
 return <div className="identity-section-heading"><h2>{title} <Help text={help} /></h2><p>{description}</p></div>;
}
type Props = {
 connection?: IdentityConnection; workspaceLabel: string; pending: boolean; error: string;
 onSave: (fields: IdentityFields) => Promise<void>; onCheck: (fields: IdentityFields) => Promise<boolean>;
 onDirectoryCheck: (fields: IdentityFields) => Promise<DirectoryCheck | undefined>; onCancel: () => void;
};
// Early message for a pasted key that cannot be a Google service account key. The backend decides.
function keyLooksValid(text: string): boolean {
 try { const key = JSON.parse(text) as { type?: string; client_email?: string; private_key?: string }; return key.type === 'service_account' && !!key.client_email && !!key.private_key; } catch { return false; }
}
const domainPattern = /^(?=.{3,253}$)([a-z0-9-]+\.)+[a-z0-9-]+$/i;
export function GoogleConnectionForm({ connection, workspaceLabel, pending, error, onSave, onCheck, onDirectoryCheck, onCancel }: Props) {
 const stored = connection?.directory;
 const [name, setName] = useState(connection?.name ?? '');
 const [enabled, setEnabled] = useState(connection?.enabled ?? true);
 const [audiences, setAudiences] = useState(connection?.audiences ?? ['']);
 const [domain, setDomain] = useState(stored?.domain ?? '');
 const [adminEmail, setAdminEmail] = useState(stored?.delegated_admin ?? '');
 const [key, setKey] = useState('');
 // A stored key is shown masked until the administrator chooses to replace it.
 const [changingKey, setChangingKey] = useState(false);
 const [customerId, setCustomerId] = useState(stored?.customer_id ?? '');
 const [checked, setChecked] = useState(connection?.check_status === 'verified' && stored?.check_status === 'verified');
 const [checking, setChecking] = useState(false), [localError, setLocalError] = useState('');
 const hasStoredKey = !!stored?.has_secret && !changingKey;
 const directory = (): DirectorySettings => ({ client_id: '', issuing_client_id: '', client_secret: hasStoredKey ? '' : key, has_secret: !!stored?.has_secret, delegated_admin: adminEmail.trim(), domain: domain.trim().toLowerCase(), customer_id: customerId, check_status: 'not_checked', checked_at: null });
 const fields = (): IdentityFields => ({ provider: 'google', name: name.trim(), issuer: googleIssuer, audiences, groups_claim: '', enabled, revision: connection?.revision ?? 0, directory: directory() });
 const current = JSON.stringify(fields());
 const [initial] = useState(current);
 usePendingChanges(pending || current !== initial);
 // Any change to what the check verified makes the check stale.
 function changed() { setChecked(false); setLocalError(''); }
 function validate(): boolean {
  if (!name.trim() || audiences.some(a => !a.trim())) { setLocalError('Enter the connection name and at least one OAuth client ID.'); return false; }
  if (!domainPattern.test(domain.trim())) { setLocalError('Enter the primary domain, for example example.com.'); return false; }
  if (!/^[^@\s]+@[^@\s]+$/.test(adminEmail.trim())) { setLocalError('Enter the e-mail of the Workspace administrator.'); return false; }
  if (!hasStoredKey && !keyLooksValid(key)) { setLocalError('Paste the JSON key file of a Google service account.'); return false; }
  return true;
 }
 async function checkConnection() {
  if (!validate()) return;
  setChecking(true); setChecked(false);
  try {
   if (!await onCheck(fields())) return;
   const result = await onDirectoryCheck(fields());
   if (!result || result.check_status !== 'verified') return;
   setCustomerId(result.customer_id ?? '');
   setChecked(true);
  } finally { setChecking(false); }
 }
 return <form className="cp-admin-panel identity-form identity-form-redesign" onSubmit={event => { event.preventDefault(); if (validate()) void onSave(fields()); }}>
  <fieldset disabled={pending || checking}>
   <div className="cp-admin-notice identity-mapping-warning" role="status"><TriangleAlert size={18} aria-hidden="true" /><div><strong>User synchronization is not supported</strong><span>Chokepoint does not receive user changes from Google yet. A user who is suspended or deleted in Google keeps access until the access token expires. The user list is read from Google only when you open it.</span></div></div>
   <div className="identity-form-section"><SectionHeading title="Connection" description="Identify this connection in your workspace." help="The connection belongs to the selected workspace and environment." /><div className="identity-form-fields">
    <label className="cp-admin-field">Connection name<input className="cp-admin-input" maxLength={80} required value={name} onChange={e => { setName(e.target.value); changed(); }} /></label><small>{workspaceLabel}</small>
    <label className="cp-admin-choice identity-enable"><input className="cp-admin-switch" type="checkbox" role="switch" checked={enabled} onChange={e => setEnabled(e.target.checked)} /><span className="cp-admin-choice-copy"><strong>Enable connection</strong><small>Accept valid Google ID tokens from this organization in the selected environment.</small></span></label>
   </div></div>
   <div className="identity-form-section"><SectionHeading title="Request authentication" description="Validate Google ID tokens for your MCP requests." help="Google signs ID tokens with the issuer below. The audience is your OAuth client ID. The primary domain is checked against the hd claim, so only your organization is accepted." /><div className="identity-form-fields">
    <label className="cp-admin-field">Issuer URL<input className="cp-admin-input identity-mono" readOnly value={googleIssuer} /><small>Fixed. Google publishes one issuer for all Workspace organizations.</small></label>
    <div className="identity-audiences"><span className="identity-field-label">OAuth client IDs (audiences)</span>{audiences.map((audience, index) => <div className="identity-audience-row" key={index}><input className="cp-admin-input identity-mono" aria-label={`OAuth client ID ${index + 1}`} maxLength={2048} value={audience} placeholder="123456789-abc.apps.googleusercontent.com" onChange={e => { setAudiences(values => values.map((value, i) => i === index ? e.target.value : value)); changed(); }} /><button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={audiences.length === 1} aria-label={`Remove client ID ${index + 1}`} onClick={() => { setAudiences(values => values.filter((_, i) => i !== index)); changed(); }}><X size={16} /></button></div>)}<button className="identity-text-button" type="button" disabled={audiences.length >= 10} onClick={() => { setAudiences(values => [...values, '']); changed(); }}><Plus size={15} />Add client ID</button><small>The Google OAuth client IDs that issue ID tokens for your users. The ID token of the signed-in user is the request credential. A client ID used only for Chokepoint is recommended, not required.</small></div>
    <label className="cp-admin-field">Primary domain<input className="cp-admin-input identity-mono" maxLength={253} placeholder="example.com" value={domain} onChange={e => { setDomain(e.target.value); changed(); }} /><small>Only tokens whose hd claim equals this domain are accepted. The e-mail domain alone is not enough. Your Google OAuth client must send the hd parameter in its sign-in request; without it Google leaves the claim out and Chokepoint rejects the token.</small></label>
   </div></div>
   <div className="identity-form-section"><SectionHeading title="User directory" description="Read users to associate them with agents." help={"The backend reads the Google Admin SDK Directory API with a service account that has domain-wide delegation. It does not grant user permissions.\n\nIn Google Admin: Security, API controls, Domain-wide delegation. Authorize the service account client ID with the scope https://www.googleapis.com/auth/admin.directory.user.readonly."} /><div className="identity-form-fields">
    <ol className="lifecycle-steps" aria-label="Prepare Google Workspace for Chokepoint">
     <li><span className="lifecycle-step-bubble" aria-hidden="true">1</span><div><strong>Enable the Admin SDK API</strong><span>In the Google Cloud console, select or create a project. Enable the Admin SDK API (<code>admin.googleapis.com</code>) in it.</span><GuideLink href={enableApiGuide}>Google guide: enable APIs</GuideLink></div></li>
     <li><span className="lifecycle-step-bubble" aria-hidden="true">2</span><div><strong>Create a service account</strong><span>In the same project, go to IAM and Admin, Service accounts. Create an account, then add a JSON key under Keys. Copy the account Client ID from its advanced settings.</span><GuideLink href={serviceAccountGuide}>Google guide: create a service account and key</GuideLink></div></li>
     <li><span className="lifecycle-step-bubble" aria-hidden="true">3</span><div><strong>Authorize domain-wide delegation</strong><span>In the Google Admin console, a Super Admin goes to Security, Access and data control, API controls, Manage Domain Wide Delegation. Add the Client ID with the scope <code>https://www.googleapis.com/auth/admin.directory.user.readonly</code>. A change can take up to 24 hours.</span><GuideLink href={delegationGuide}>Google guide: domain-wide delegation</GuideLink></div></li>
     <li><span className="lifecycle-step-bubble" aria-hidden="true">4</span><div><strong>Paste the key and the administrator</strong><span>Enter the key below and the e-mail of the Workspace administrator that the service account acts as.</span></div></li>
    </ol>
    <label className="cp-admin-field">Delegated admin e-mail<input className="cp-admin-input" type="email" maxLength={254} placeholder="admin@example.com" value={adminEmail} onChange={e => { setAdminEmail(e.target.value); changed(); }} /><small>A Workspace administrator that the service account impersonates to read users.</small></label>
    {hasStoredKey
     ? <label className="cp-admin-field">Service account key<span className="identity-secret-row"><input className="cp-admin-input" type="password" disabled value="••••••••••••" aria-label="Stored service account key" /><button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => { setChangingKey(true); changed(); }}>Change</button></span><small>Stored encrypted. Existing keys cannot be displayed.</small></label>
     : <label className="cp-admin-field">Service account key (JSON)<textarea className="cp-admin-input identity-mono" rows={6} autoComplete="off" spellCheck={false} placeholder='{"type": "service_account", …}' value={key} onChange={e => { setKey(e.target.value); changed(); }} /><small>Stored encrypted. Existing keys cannot be displayed.</small></label>}
    {connection ? <div className="cp-admin-notice identity-mapping-warning" role="status"><TriangleAlert size={18} aria-hidden="true" /><div><strong>Changing the Google organization</strong><span>If you change the key or the administrator to another Google organization, the people associated before belong to the previous organization. If you also change the primary domain, they lose access. Chokepoint does not block the change.</span></div></div> : null}
    {error || localError ? <p className="cp-admin-notice cp-admin-notice--danger" role="alert">{error || localError}</p> : null}
    <div className="identity-inline-check"><button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={checking} onClick={() => void checkConnection()}>{checking ? 'Checking…' : 'Check connection'}</button><Help label="What the check verifies" text={'Check connection reads the Google OpenID Connect metadata and signing keys, exchanges a token for the service account as the delegated administrator, and reads one user. It stores the Google account (customer) ID.\n\nIt does not verify a real login, the token audience or the hd claim of a real token.'} /><small role="status">{checked ? 'Connection verified.' : 'Not checked'}</small>{checked && customerId ? <small>Google account <code>{customerId}</code></small> : null}</div>
   </div></div>
  </fieldset>
  <footer className="identity-form-actions"><span /><button className="cp-admin-button cp-admin-button--ghost" type="button" disabled={pending} onClick={onCancel}>Cancel</button><button className="cp-admin-button" type="submit" disabled={pending}>{pending ? 'Working…' : connection ? 'Save changes' : 'Create connection'}</button></footer>
 </form>;
}
