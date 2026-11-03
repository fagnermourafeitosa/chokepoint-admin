import { useState } from 'react';
import { Check, Copy, TriangleAlert } from 'lucide-react';
import type { LoginSettings } from './api';
import { Help } from './Help';

// The harness login client of an identity connection (Admin 036 section 4, Backend 045
// Administration API 1). Chokepoint is a confidential OIDC client of the provider: it sends the
// person to the provider, reads who they are and their groups, then asks for their consent.
export function HarnessLoginSection({ provider, value, stored, groupsCapable, onChange }: {
  provider: string; value: LoginSettings; stored: LoginSettings | null; groupsCapable: boolean; onChange: (next: LoginSettings) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [changingSecret, setChangingSecret] = useState(false);
  const google = provider === 'google';
  const redirect = stored?.redirect_uri ?? '';
  const keepsSecret = !!stored?.has_secret && stored.client_id === value.client_id && !changingSecret;
  return <div className="identity-form-section">
    <div className="identity-section-heading"><h2>Harness login <Help text="People log in from a coding harness (Claude Code, VS Code and similar) through this identity provider. Chokepoint is an OIDC client here: it sends the person to the provider, reads who they are and their groups, then asks for their consent." /></h2>
      <p>Let people log in from a coding harness through this provider.</p></div>
    <div className="identity-form-fields">
      {!groupsCapable ? <p className="cp-admin-notice" role="status"><TriangleAlert size={16} aria-hidden="true" />This provider can not list groups yet, so harness login is not available for it.</p> : <>
        <label className="cp-admin-choice identity-enable"><input className="cp-admin-switch" type="checkbox" role="switch" checked={value.enabled} onChange={e => onChange({ ...value, enabled: e.target.checked })} /><span className="cp-admin-choice-copy"><strong>Allow harness login</strong><small>Each agent then chooses which groups of this provider can log in.</small></span></label>
        {redirect ? <div className="identity-value"><span className="identity-field-label">Redirect URI · register it in {google ? 'Google Cloud' : 'the provider'}</span><code>{redirect}</code>
          <button type="button" className="relation-icon-button" aria-label="Copy redirect URI" onClick={() => { void navigator.clipboard?.writeText(redirect); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check size={14} /> : <Copy size={14} />}</button></div>
          : <p className="cp-admin-muted">Save the connection to get the redirect URI to register in {google ? 'Google Cloud' : 'the provider'}.</p>}
        <div className="identity-two-fields">
          <label className="cp-admin-field">Login client ID<input className="cp-admin-input identity-mono" maxLength={255} required={value.enabled} value={value.client_id} onChange={e => onChange({ ...value, client_id: e.target.value.trim() })} /><small>{google ? 'A Web application OAuth client in Google Cloud.' : 'A confidential OIDC client with the standard flow (authorization code). Not the directory client.'}</small></label>
          <label className="cp-admin-field">Login client secret{keepsSecret
            ? <span className="identity-secret-row"><input className="cp-admin-input" type="password" disabled value="••••••••••••" aria-label="Stored login client secret" /><button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => setChangingSecret(true)}>Change</button></span>
            : <input className="cp-admin-input" type="password" autoComplete="new-password" required={value.enabled} maxLength={4096} value={value.client_secret ?? ''} onChange={e => onChange({ ...value, client_secret: e.target.value })} />}
            <small>Stored encrypted. Existing secrets cannot be displayed.</small></label>
        </div>
        <p className="cp-admin-muted">At each login, Chokepoint reads the groups of the person from the directory, with the {google ? 'service account' : 'directory client'} above. {google ? 'It needs the read-only groups scope of the Directory API (https://www.googleapis.com/auth/admin.directory.group.readonly).' : 'It needs permission to read groups (realm-management roles query-groups and view-users).'} Check connection tells you when it is missing.</p>
      </>}
    </div>
  </div>;
}

// The login settings that a save sends: null removes the client; an empty secret keeps the stored one.
export function loginInput(value: LoginSettings): LoginSettings | null {
  if (!value.enabled && !value.client_id && !value.client_secret) return null;
  return { enabled: value.enabled, client_id: value.client_id, ...(value.client_secret ? { client_secret: value.client_secret } : {}) };
}
export const initialLogin = (stored: LoginSettings | null | undefined): LoginSettings => ({ enabled: !!stored?.enabled, client_id: stored?.client_id ?? '', client_secret: '' });
