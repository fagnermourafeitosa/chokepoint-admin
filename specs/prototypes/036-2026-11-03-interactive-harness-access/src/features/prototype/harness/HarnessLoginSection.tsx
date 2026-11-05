import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { WaitingBackend } from '../../access/delegation/WaitingBackend';
import { Help } from '../../identity/Help';
import { redirectUri } from './data';
import '../../identity/identity.css';
import '../../access/delegation/delegation.css';
import './harness.css';

// Layout prototype (Backend 045): the OIDC client that Chokepoint uses to log people in from a
// coding harness. Local state only; nothing is saved.
export function HarnessLoginSection({ provider }: { provider: string }) {
  const [on, setOn] = useState(true);
  const [clientId, setClientId] = useState('chokepoint-harness-login');
  const [secret, setSecret] = useState('');
  const [copied, setCopied] = useState(false);
  const redirect = redirectUri;
  const google = provider === 'google';
  return <div className="identity-form-section">
    <div className="identity-section-heading"><h2>Harness login <Help text="People log in from a coding harness (Claude Code, Cursor, Codex) through this identity provider. Chokepoint is an OIDC client here: it sends the person to the provider, reads who they are and their groups, then asks for their consent." /></h2>
      <p>Let people log in from a coding harness through this provider. <WaitingBackend spec="045" tip="Login client of the identity connection." /></p></div>
    <div className="identity-form-fields">
      <label className="cp-admin-choice identity-enable"><input className="cp-admin-switch" type="checkbox" role="switch" checked={on} onChange={e => setOn(e.target.checked)} /><span className="cp-admin-choice-copy"><strong>Allow harness login</strong><small>Each agent then chooses which groups of this provider can log in.</small></span></label>
      {on ? <>
        <div className="identity-value"><span className="identity-field-label">Redirect URI · register it in {google ? 'Google Cloud' : 'the provider'}</span><code>{redirect}</code>
          <button type="button" className="relation-icon-button" aria-label="Copy redirect URI" onClick={() => { void navigator.clipboard?.writeText(redirect); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check size={14} /> : <Copy size={14} />}</button></div>
        <div className="identity-two-fields">
          <label className="cp-admin-field">Login client ID<input className="cp-admin-input identity-mono" value={clientId} onChange={e => setClientId(e.target.value)} /><small>{google ? 'A Web application OAuth client in Google Cloud.' : 'A confidential OIDC client with the standard flow (authorization code). Not the directory client.'}</small></label>
          <label className="cp-admin-field">Login client secret<input className="cp-admin-input" type="password" autoComplete="new-password" value={secret} onChange={e => setSecret(e.target.value)} /><small>Stored encrypted. Existing secrets cannot be displayed.</small></label>
        </div>
        <p className="cp-admin-muted">At each login, Chokepoint reads the groups of the person from the directory, with the {google ? 'service account' : 'directory client'} above. {google ? 'It needs the read-only groups scope of the Directory API.' : 'It needs permission to read groups.'} Check connection tells you when it is missing.</p>
      </> : null}
    </div>
  </div>;
}
