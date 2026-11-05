import { useState, type ReactNode } from 'react';
import { Check, CircleHelp, Copy, Download, KeyRound, TriangleAlert } from 'lucide-react';
import { Tooltip } from '../../../components/ui/tooltip/Tooltip';
import { currentAdmin } from './fixtures';
import { WaitingBackend } from './WaitingBackend';
import './delegation.css';

// Layout prototype (Admin A2): the agent as a client of the Chokepoint authorization server (Backend 030).
// The key pair is generated in the browser. The private key goes only to the downloaded file; nothing is sent.
type PublicKey = { kid: string; alg: 'ES256' | 'RS256'; addedBy: string; addedAt: string; own?: boolean };

const issuer = 'https://chokepoint.acme.example/as/workspace-a/sandbox';
const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'agent';

function Help({ text }: { text: string }) {
  return <Tooltip content={text}><CircleHelp size={14} aria-label="Help" /></Tooltip>;
}

function Title({ children, help }: { children: ReactNode; help: string }) {
  return <span className="identity-title">{children}<Help text={help} /></span>;
}

function CopyValue({ label, value, help }: { label: string; value: string; help: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="identity-value"><Title help={help}>{label}</Title><code>{value}</code>
    <button type="button" className="relation-icon-button" aria-label={`Copy ${label}`} title="Copy" onClick={() => { void navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>
  </div>;
}

async function generateKey(agentId: string, agentName: string) {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const privateJwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const kid = `${slug(agentName)}-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 6)}`;
  const config = { client_id: agentId, issuer, token_endpoint: `${issuer}/token`, kid, alg: 'ES256', private_key: { ...privateJwk, kid, alg: 'ES256', use: 'sig' } };
  const url = URL.createObjectURL(new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = `${slug(agentName)}.chokepoint.json`; a.click(); URL.revokeObjectURL(url);
  return kid;
}

// Only the format is checked here. The backend validates the key.
function detect(text: string): { alg?: PublicKey['alg']; error?: string } {
  const t = text.trim();
  if (!t) return {};
  if (/PRIVATE KEY/.test(t) || /"d"\s*:/.test(t)) return { error: 'This is a private key. Paste only the public key.' };
  if (t.startsWith('-----BEGIN PUBLIC KEY-----')) return { alg: t.length > 300 ? 'RS256' : 'ES256' };
  try { const k = JSON.parse(t); if (k.kty === 'EC') return { alg: 'ES256' }; if (k.kty === 'RSA') return { alg: 'RS256' }; } catch { /* not JSON */ }
  return { error: 'Paste a public key as a JWK or as PEM (BEGIN PUBLIC KEY).' };
}

function OwnKeyForm({ onSave }: { onSave: (k: PublicKey) => void }) {
  const [text, setText] = useState('');
  const [kid, setKid] = useState('');
  const check = detect(text);
  return <div className="identity-key-form">
    <label className="relation-field"><span>Public key (JWK or PEM)</span><textarea className="cp-admin-input condition-code" rows={5} spellCheck={false} value={text} onChange={e => setText(e.target.value)} placeholder={'{ "kty": "EC", "crv": "P-256", "x": "…", "y": "…" }'} /></label>
    {check.error ? <p className="resource-warning"><TriangleAlert size={14} aria-hidden="true" />{check.error}</p> : check.alg ? <p className="rule-sentence"><Check size={14} aria-hidden="true" />Public key · {check.alg}</p> : null}
    <label className="relation-field"><span>Key ID (kid)</span><input className="cp-admin-input" value={kid} onChange={e => setKid(e.target.value.trim())} placeholder="The kid your agent sends" /></label>
    <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small identity-own-save" disabled={!check.alg || !kid} onClick={() => onSave({ kid, alg: check.alg!, addedBy: currentAdmin, addedAt: now(), own: true })}>Use this key</button>
  </div>;
}

export function AgentIdentity({ agentId, agentName, disabled }: { agentId: string; agentName: string; disabled: boolean }) {
  const [key, setKey] = useState<PublicKey | undefined>({ kid: `${slug(agentName)}-2026-10-31-a1b2`, alg: 'ES256', addedBy: currentAdmin, addedAt: '2026-10-31 09:05 UTC' });
  const [justDownloaded, setJustDownloaded] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  async function generate() {
    const kid = await generateKey(agentId, agentName);
    setKey({ kid, alg: 'ES256', addedBy: currentAdmin, addedAt: now() }); setJustDownloaded(true); setConfirmRotate(false);
  }
  return <section className="agent-identity" aria-label="Agent identity">
    <header className="delegation-toolbar"><div className="agent-graph-title"><h3>Identity</h3><Help text="The agent proves who it is to Chokepoint with its own key. Without a key, it can not get a token, so it can not call any tool." /><WaitingBackend spec="030" tip="Lets the agent prove who it is to the Chokepoint authorization server with its own key." /></div></header>
    {disabled ? <p className="delegation-readonly">This agent is disabled. It gets no token, and its next call is rejected.</p> : null}

    <section className="identity-card">
      <Title help="The key is how the agent signs in to Chokepoint. Chokepoint keeps only the public part. The private part is in the file you download, and only there.">Key</Title>
      {key ? <div className="identity-key">
        <KeyRound size={18} aria-hidden="true" />
        <div><strong>{key.own ? 'Your own public key' : 'Active key'}</strong><small>{key.kid} · {key.alg}</small><small>Created by {key.addedBy} · {key.addedAt}</small></div>
        {!confirmRotate ? <div className="condition-actions">
          <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" onClick={() => setConfirmRotate(true)}>Rotate key</button>
          <Help text="Rotate: creates a new key and downloads a new file. The current key stops working at once. Tokens already issued stay valid until they expire (5 minutes). Use it when the file was lost or exposed." />
        </div> : null}
      </div> : <div className="identity-empty"><p>No key yet. The agent can not get a token.</p></div>}
      {confirmRotate ? <div className="identity-confirm"><p className="resource-warning"><TriangleAlert size={14} aria-hidden="true" />The current key stops working now. Give the new file to the agent at once.</p><div className="condition-actions"><button type="button" className="cp-admin-button cp-admin-button--small" onClick={() => void generate()}><Download size={14} aria-hidden="true" />Rotate and download</button><button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => setConfirmRotate(false)}>Cancel</button></div></div> : null}
      {!key ? <div className="condition-actions"><button type="button" className="cp-admin-button" onClick={() => void generate()}><Download size={16} aria-hidden="true" />Generate key and download</button><Help text="Creates a key pair in your browser. Chokepoint registers the public key. You download one file with the private key and the connection values. Give this file to the agent." /></div> : null}
      {justDownloaded ? <p className="consent-record identity-downloaded"><Check size={16} aria-hidden="true" /><span><strong>File downloaded: {slug(agentName)}.chokepoint.json</strong><small>This is the only copy of the private key. Store it like a password. Chokepoint can not show it again.</small></span></p> : null}
    </section>

    <details className="identity-card identity-more">
      <summary><Title help="The values that the file already has. Use them only to configure the agent by hand.">Connection details</Title></summary>
      <CopyValue label="Client ID" value={agentId} help="The ID of this agent at the Chokepoint authorization server. The agent sends it in every token request." />
      <CopyValue label="Issuer" value={issuer} help="Who issues the Chokepoint tokens of this environment. A token of Sandbox never works in Production." />
      <CopyValue label="Token endpoint" value={`${issuer}/token`} help="Where the agent exchanges the token of the person for a Chokepoint token." />
    </details>

    <details className="identity-card identity-more">
      <summary><Title help="How the agent uses the file. An SDK does these steps for you.">How the agent connects</Title></summary>
      <ol className="identity-steps">
        <li><strong>The person signs in</strong> to the identity provider, as today. The agent gets that token.</li>
        <li><strong>The agent exchanges it</strong> at Chokepoint, signed with the private key of the file. Chokepoint checks the key, the token and the delegation.</li>
        <li><strong>The agent calls the tools</strong> with the Chokepoint token. It is valid for 5 minutes, then the agent exchanges again.</li>
      </ol>
      <p className="cp-admin-muted relation-note">A refused exchange returns <code>invalid_client</code> or <code>invalid_grant</code>. Investigate shows the reason.</p>
    </details>

    <details className="identity-card identity-more">
      <summary><Title help="Advanced. Use a key that your team created and keeps, for example in a vault. Then Chokepoint does not create a file.">Use my own public key</Title></summary>
      <OwnKeyForm onSave={k => { setKey(k); setJustDownloaded(false); }} />
    </details>
  </section>;
}
