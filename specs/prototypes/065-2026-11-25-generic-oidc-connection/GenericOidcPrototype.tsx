import { useState } from 'react';
import { ArrowLeft, Check, Copy, KeyRound, Plus, TriangleAlert, UserRoundSearch, X } from 'lucide-react';
import { Help } from '../../../src/features/identity/Help';
import { SectionHeading } from '../../../src/features/identity/formParts';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import '../../../src/features/identity/identity.css';
import '../../../src/features/access/delegation/delegation.css';
import { audiences as initialAudiences, discovery, issuer as initialIssuer, redirectUri, rejected, workspaceLabel } from './data';
import '../../../src/features/mcp/mcp.css';
import './prototype.css';

// Admin 065 layout prototype: the Generic OIDC card of Connect identity provider and its form.
// Fixed data; no API call. ?state=rejected shows a provider that signs only with a shared secret.
type Discovery = 'none' | 'verified' | 'rejected';
type Eligibility = 'groups' | 'everyone' | 'approved';

const providers = [
  { id: 'keycloak', name: 'Keycloak' }, { id: 'entra', name: 'Microsoft Entra ID' }, { id: 'okta', name: 'Okta' },
];

export function GenericOidcPrototype() {
  const startRejected = new URLSearchParams(window.location.search).get('state') === 'rejected';
  const [issuer, setIssuer] = useState(startRejected ? rejected.issuer : initialIssuer);
  const [read, setRead] = useState<Discovery>(startRejected ? 'rejected' : 'none');
  const [manual, setManual] = useState(false);
  const [headless, setHeadless] = useState(true);
  const [audiences, setAudiences] = useState(initialAudiences);
  const [groupsClaim, setGroupsClaim] = useState('groups');
  const [harness, setHarness] = useState(true);
  const [eligibility, setEligibility] = useState<Eligibility>('groups');
  const [copied, setCopied] = useState(false);
  const readDiscovery = () => setRead(issuer === rejected.issuer ? 'rejected' : 'verified');

  return <section className="identity-editor" aria-label="Connect identity provider">
    <button className="identity-back" type="button"><ArrowLeft size={16} />Identity providers</button>
    <header><h1 className="cp-admin-title">Connect identity provider</h1><p className="cp-admin-muted">Choose a provider to configure authentication and user access.</p></header>
    <div className="identity-provider-groups">
      <div className="identity-provider-choices" role="group" aria-label="Identity provider">
        {providers.map(item => <span key={item.id} className="identity-provider-slot"><button type="button" className="identity-provider-choice" aria-pressed={false}><img src={`/idp-icons/${item.id}.svg`} alt="" width="24" height="24" /><strong>{item.name}</strong></button></span>)}
      </div>
      <div className="identity-provider-category"><span className="identity-field-label">OIDC integrations</span>
        <div className="identity-provider-choices" role="group" aria-label="OIDC integration">
          <span className="identity-provider-slot"><button type="button" className="identity-provider-choice" aria-pressed={false}><img src="/idp-icons/google.svg" alt="" width="24" height="24" /><strong>Google Workspace</strong></button></span>
          <span className="identity-provider-slot"><button type="button" className="identity-provider-choice" data-selected aria-pressed><Check className="identity-provider-tick" size={16} aria-hidden="true" /><KeyRound size={24} aria-hidden="true" /><strong>Generic OIDC</strong></button></span>
        </div>
      </div>
    </div>

    <form className="cp-admin-panel identity-form identity-form-redesign" onSubmit={event => event.preventDefault()}>
      <fieldset>
        <div className="identity-form-section"><SectionHeading title="Connection" description="Identify this connection in your workspace." help="The connection belongs to the selected workspace and environment." /><div className="identity-form-fields">
          <label className="cp-admin-field">Connection name<input className="cp-admin-input" maxLength={80} defaultValue="Acme login" /></label><small>{workspaceLabel}</small>
          <label className="cp-admin-choice identity-enable"><input className="cp-admin-switch" type="checkbox" role="switch" defaultChecked /><span className="cp-admin-choice-copy"><strong>Enable connection</strong><small>Accept people who sign in with this provider in the selected environment.</small></span></label>
        </div></div>

        <div className="identity-form-section"><SectionHeading title="Provider" description="Any OpenID Connect provider that publishes its discovery document and public keys." help={'The platform reads /.well-known/openid-configuration of the issuer, then its public keys (jwks_uri), and verifies the signature of each token with them.\n\nA provider that signs tokens only with a shared secret (HS256), or issues opaque tokens, can not be verified and is refused.'} /><div className="identity-form-fields">
          <label className="cp-admin-field">Issuer URL<input className="cp-admin-input identity-mono" type="url" maxLength={2048} placeholder="https://login.example.com" value={issuer} onChange={e => { setIssuer(e.target.value.trim()); setRead('none'); }} /><small>The exact issuer of the tokens, the iss claim. Without manual endpoints, discovery is read from this address.</small></label>
          <label className="cp-admin-choice identity-enable"><input className="cp-admin-switch" type="checkbox" role="switch" checked={manual} onChange={e => { setManual(e.target.checked); setRead('none'); }} /><span className="cp-admin-choice-copy"><strong>Enter endpoints manually</strong><small>For a server that does not publish /.well-known/openid-configuration.</small></span></label>
          {manual ? <>
            <label className="cp-admin-field">Authorization endpoint<input className="cp-admin-input identity-mono" type="url" maxLength={2048} defaultValue={discovery.authorization_endpoint} /><small>Where people sign in. Needed only for harness login.</small></label>
            <label className="cp-admin-field">Token endpoint<input className="cp-admin-input identity-mono" type="url" maxLength={2048} defaultValue={discovery.token_endpoint} /><small>Where the platform exchanges the sign-in code for the ID token. Needed only for harness login.</small></label>
            <label className="cp-admin-field">Public keys URL (JWKS)<input className="cp-admin-input identity-mono" type="url" maxLength={2048} defaultValue={discovery.jwks_uri} /><small>The keys that verify the signature of each token.</small></label>
          </> : null}
          <div className="identity-inline-check"><button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={readDiscovery}>{manual ? 'Check endpoints' : 'Read discovery'}</button><WaitingBackend spec="106" tip="Reads the discovery document, or the endpoints typed by hand, and the public keys of any OIDC issuer, and refuses a provider without asymmetric signatures." /><small role="status">{read === 'verified' ? (manual ? 'Public keys read.' : 'Discovery read.') : read === 'rejected' ? 'Provider refused.' : manual ? 'Not checked' : 'Not read'}</small></div>
          {read === 'verified' && manual ? <dl className="oidc-discovery">
            <dt>Public keys</dt><dd><code>{discovery.jwks_uri}</code><small>{discovery.keys} keys</small></dd>
            <dt>Key algorithms</dt><dd>{discovery.signing.map(alg => <span key={alg} className="mcp-badge">{alg}</span>)}</dd>
          </dl> : null}
          {read === 'verified' && !manual ? <dl className="oidc-discovery">
            <dt>Authorization endpoint</dt><dd><code>{discovery.authorization_endpoint}</code></dd>
            <dt>Token endpoint</dt><dd><code>{discovery.token_endpoint}</code></dd>
            <dt>Public keys</dt><dd><code>{discovery.jwks_uri}</code><small>{discovery.keys} keys</small></dd>
            <dt>Signing algorithms</dt><dd>{discovery.signing.map(alg => <span key={alg} className="mcp-badge">{alg}</span>)}</dd>
            <dt>Claims</dt><dd>{discovery.claims.map(claim => <code key={claim}>{claim}</code>)}</dd>
          </dl> : null}
          {read === 'rejected' ? <div className="cp-admin-notice cp-admin-notice--danger" role="alert"><TriangleAlert size={18} aria-hidden="true" /><div><strong>This provider can not be verified</strong><span>It signs tokens only with {rejected.signing.join(', ')}, a secret shared with each application. The platform verifies tokens with public keys: enable RS256 or ES256 in the provider and read discovery again.</span></div></div> : null}
        </div></div>

        <div className="identity-form-section"><SectionHeading title="Who is who" description="How the platform tells people apart, and what it shows about them." help={'A person is the pair issuer and sub. The sub never changes, so access stays with the same person.\n\nThe email can change in many providers, and in some the person edits it. It is only shown, never used to identify anyone.'} /><div className="identity-form-fields">
          <div className="identity-value"><span className="identity-field-label">Person identifier</span><code>iss + sub</code></div>
          <div className="identity-two-fields">
            <label className="cp-admin-field">Email claim<input className="cp-admin-input identity-mono" maxLength={64} defaultValue="email" /><small>Shown in the Admin only when email_verified is true.</small></label>
            <label className="cp-admin-field"><span>Groups claim <WaitingBackend spec="106" tip="Reads the groups of a person from a claim of the token, since this provider has no directory." /></span><input className="cp-admin-input identity-mono" maxLength={64} placeholder="groups" value={groupsClaim} onChange={e => setGroupsClaim(e.target.value.trim())} /><small>Optional. A list of strings in the token. Leave it empty if the provider sends no groups.</small></label>
          </div>
          <div className="cp-admin-notice identity-info" role="status"><UserRoundSearch size={18} aria-hidden="true" /><div><strong>No directory</strong><span>This provider has no list of people to read. A person appears in People after the first harness login or token exchange. Group names are typed as they come in the groups claim.</span></div></div>
        </div></div>

        <div className="identity-form-section"><SectionHeading title="Request authentication" description="Let services of yours exchange access tokens of your users for agent tokens." help="Only needed for agents that run without a person at the keyboard: a service of yours sends the access token of a user, and the platform gives the agent a token for that user." /><div className="identity-form-fields">
          <label className="cp-admin-choice identity-enable"><input className="cp-admin-switch" type="checkbox" role="switch" checked={headless} onChange={e => setHeadless(e.target.checked)} /><span className="cp-admin-choice-copy"><strong>Accept tokens from your services</strong><small>Harness login works without it.</small></span></label>
          {headless ? <div className="identity-audiences"><span className="identity-field-label">Accepted audiences</span>{audiences.map((audience, index) => <div className="identity-audience-row" key={index}><input className="cp-admin-input identity-mono" aria-label={`Audience ${index + 1}`} value={audience} onChange={e => setAudiences(audiences.map((value, i) => i === index ? e.target.value : value))} /><button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={audiences.length === 1} aria-label={`Remove audience ${index + 1}`} onClick={() => setAudiences(audiences.filter((_, i) => i !== index))}><X size={16} /></button></div>)}<button className="identity-text-button" type="button" onClick={() => setAudiences([...audiences, ''])}><Plus size={15} />Add audience</button><small>The aud of the access tokens that your services send.</small></div> : null}
        </div></div>

        <div className="identity-form-section"><SectionHeading title="Harness login" description="Let people log in from a coding harness through this provider." help="People log in from a coding harness (Claude Code, Codex and similar) through this provider. The platform sends the person to the provider with the authorization code flow and PKCE, reads who they are from the ID token, then asks for their consent." /><div className="identity-form-fields">
          <label className="cp-admin-choice identity-enable"><input className="cp-admin-switch" type="checkbox" role="switch" checked={harness} onChange={e => setHarness(e.target.checked)} /><span className="cp-admin-choice-copy"><strong>Allow harness login</strong><small>Each person still sees the agent and its tools and consents at login.</small></span></label>
          {harness ? <>
            <fieldset className="cp-admin-choice-group"><legend>Who can log in <WaitingBackend spec="106" tip="Decides who may log in from a harness without a directory: the groups of a token claim, chosen per agent, everyone of this connection, or only people an administrator approved." /></legend>
              <label className="cp-admin-choice"><input type="radio" name="eligibility" checked={eligibility === 'groups'} disabled={!groupsClaim} onChange={() => setEligibility('groups')} /><span className="cp-admin-choice-copy"><strong>People in chosen groups</strong><small>{groupsClaim ? <>Each agent chooses the groups, read from the <code>{groupsClaim}</code> claim.</> : 'Needs a groups claim.'}</small></span></label>
              <label className="cp-admin-choice"><input type="radio" name="eligibility" checked={eligibility === 'everyone'} onChange={() => setEligibility('everyone')} /><span className="cp-admin-choice-copy"><strong>Everyone who signs in with this provider</strong><small>Each agent still limits the tools, resources and rules.</small></span></label>
              <label className="cp-admin-choice"><input type="radio" name="eligibility" checked={eligibility === 'approved'} onChange={() => setEligibility('approved')} /><span className="cp-admin-choice-copy"><strong>Approved people only</strong><small>After the first login, a person waits until you approve them in People. Approved once for this connection.</small></span></label>
            </fieldset>
            {eligibility === 'everyone' ? <div className="cp-admin-notice identity-mapping-warning" role="status"><TriangleAlert size={18} aria-hidden="true" /><div><strong>Anyone with an account can log in</strong><span>If people can create their own account in this provider, they can log in too. Block a person in the agent to stop them.</span></div></div> : null}
            <ol className="lifecycle-steps" aria-label="Register the platform in your login server">
              <li><span className="lifecycle-step-bubble" aria-hidden="true">1</span><div><strong>Register the platform in your login server</strong><span>Once, for everyone who logs in from a harness. The administrator of your OIDC server creates an application for the platform, the same way as for any app that uses your login.</span></div></li>
              <li><span className="lifecycle-step-bubble" aria-hidden="true">2</span><div><strong>Allow this redirect URI</strong><span>Your server sends people back to this address after they sign in. It refuses any address that is not allowed.</span>
                <div className="identity-value oidc-step-value"><code>{redirectUri}</code><button type="button" className="relation-icon-button" aria-label="Copy redirect URI" onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check size={14} /> : <Copy size={14} />}</button></div></div></li>
              <li><span className="lifecycle-step-bubble" aria-hidden="true">3</span><div><strong>Paste the client ID and secret</strong><span>Your server creates them for that application. The client ID tells your server that the request comes from the platform; the secret proves it when the platform receives the sign-in.</span></div></li>
            </ol>
            <div className="identity-two-fields">
              <label className="cp-admin-field">Client ID<input className="cp-admin-input identity-mono" maxLength={255} defaultValue="harness-login" /></label>
              <label className="cp-admin-field">Client secret<input className="cp-admin-input" type="password" autoComplete="new-password" defaultValue="prototype-secret" /><small>Stored encrypted. Existing secrets cannot be displayed.</small></label>
            </div>
            <label className="cp-admin-field"><span>Additional scopes <Help text={'The platform always asks for openid, email and profile.\n\nSome providers add the groups claim only when a scope asks for it. Name that scope here, as your provider documents it.'} /></span><input className="cp-admin-input identity-mono" maxLength={255} placeholder="groups" /><small>Optional, separated by spaces.</small></label>
          </> : null}
        </div></div>
      </fieldset>
      <footer className="identity-form-actions"><span /><button className="cp-admin-button cp-admin-button--ghost" type="button">Cancel</button><button className="cp-admin-button" type="submit" disabled={read !== 'verified'}>Create connection</button></footer>
    </form>
  </section>;
}
