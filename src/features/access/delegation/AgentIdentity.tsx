import { useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CircleHelp, Copy, Download, KeyRound, TriangleAlert } from 'lucide-react';
import { Tooltip } from '../../../components/ui/tooltip/Tooltip';
import { HttpError } from '../../../api/http-client';
import { agentClientApi, agentClientKey, type AgentClient } from '../agent-client-api';
import type { EnvironmentScope } from '../environment-scope';
import { download, fileName, generateKey, parsePublicKey, type Jwk, type ParsedKey } from './agent-key';
import { HarnessClients } from './HarnessClients';
import './delegation.css';

// The agent as a client of the Chokepoint authorization server (Admin 029, Backend 030 and 040).
// The key pair is created in the browser. The private key goes only to the downloaded file.

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

type Failure = { message: string; conflict: boolean };
function failure(cause: unknown, own: boolean): Failure {
  if (cause instanceof HttpError && cause.status === 409) return { conflict: true, message: 'The key changed in another session. Reload to see the current key.' };
  if (cause instanceof HttpError && cause.status === 400) return { conflict: false, message: own ? 'Chokepoint did not accept this key. Use an EC P-256 key or an RSA key of 2048 bits or more, with a key ID that matches the kid of the JWK.' : 'Chokepoint did not accept the new key. Retry.' };
  return { conflict: false, message: 'Could not register the key. Retry when the service is available.' };
}

function OwnKeyForm({ busy, onSave }: { busy: boolean; onSave: (key: JsonWebKey, kid: string) => void }) {
  const [text, setText] = useState('');
  const [kid, setKid] = useState('');
  const [parsed, setParsed] = useState<ParsedKey>();
  // A PEM is converted asynchronously; only the result of the latest text applies.
  const latest = useRef(0);
  async function change(value: string) {
    setText(value);
    const sequence = ++latest.current;
    const result = await parsePublicKey(value);
    if (sequence === latest.current) setParsed(result);
  }
  const valid = parsed && 'jwk' in parsed ? parsed : undefined;
  return <div className="identity-key-form">
    <label className="relation-field"><span>Public key (JWK or PEM)</span><textarea className="cp-admin-input condition-code" rows={5} spellCheck={false} value={text} disabled={busy} onChange={e => void change(e.target.value)} placeholder={'{ "kty": "EC", "crv": "P-256", "x": "…", "y": "…" }'} /></label>
    {parsed && 'error' in parsed ? <p className="resource-warning"><TriangleAlert size={14} aria-hidden="true" />{parsed.error}</p> : valid ? <p className="rule-sentence"><Check size={14} aria-hidden="true" />Public key · {valid.alg}</p> : null}
    <label className="relation-field"><span className="identity-title">Key ID (kid), optional<Help text="The kid that your agent sends. Leave it empty to use the kid of the JWK or, without one, the RFC 7638 thumbprint of the key." /></span><input className="cp-admin-input" value={kid} disabled={busy} onChange={e => setKid(e.target.value.trim())} placeholder="The kid your agent sends" /></label>
    <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small identity-own-save" disabled={!valid || busy} onClick={() => valid && onSave(valid.jwk, kid)}>Use this key</button>
  </div>;
}

export function AgentIdentity({ scope, agentId, agentName, disabled }: { scope: EnvironmentScope; agentId: string; agentName: string; disabled: boolean }) {
  const cache = useQueryClient();
  const key = agentClientKey(scope, agentId);
  const client = useQuery({ queryKey: key, queryFn: ({ signal }) => agentClientApi.get(scope, agentId, signal), retry: false });
  const [downloaded, setDownloaded] = useState<string>();
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Failure>();

  async function save(register: () => Promise<AgentClient>, own: boolean) {
    setBusy(true); setError(undefined);
    try {
      const next = await register();
      cache.setQueryData(key, next);
      setConfirmRotate(false);
      return next;
    } catch (cause) {
      setError(failure(cause, own));
      return undefined;
    } finally { setBusy(false); }
  }
  // Chokepoint registers the public key first; the file is downloaded only after it accepts it.
  async function generate(current: AgentClient) {
    let privateJwk: Jwk | undefined;
    const next = await save(async () => {
      const generated = await generateKey();
      privateJwk = generated.privateJwk;
      return agentClientApi.saveKey(scope, agentId, generated.publicJwk, generated.kid, current.revision);
    }, false);
    if (!next?.key || !privateJwk) return;
    const name = fileName(agentName);
    download(name, { client_id: next.client_id, issuer: next.issuer, token_endpoint: next.token_endpoint, kid: next.key.kid, alg: 'ES256', private_key: privateJwk });
    setDownloaded(name);
  }
  async function registerOwn(current: AgentClient, jwk: JsonWebKey, kid: string) {
    if (await save(() => agentClientApi.saveKey(scope, agentId, jwk, kid || undefined, current.revision), true)) setDownloaded(undefined);
  }

  const header = <header className="delegation-toolbar"><div className="agent-graph-title"><h3>Identity</h3><Help text="The agent proves who it is to Chokepoint with its own key. Without a key, it can not get a token, so it can not call any tool." /></div></header>;
  if (client.isPending) return <section className="agent-identity" aria-label="Agent identity">{header}<p role="status">Loading the agent identity…</p></section>;
  if (client.isError) return <section className="agent-identity" aria-label="Agent identity">{header}<div role="alert" className="cp-admin-notice" data-tone="danger">Could not load the agent identity. <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => void client.refetch()}>Retry</button></div></section>;
  const current = client.data;
  const active = current.key;
  return <section className="agent-identity" aria-label="Agent identity">
    {header}
    {disabled ? <p className="delegation-readonly">This agent is disabled. It gets no token, and its next call is rejected.</p> : null}

    <section className="identity-card">
      <Title help="The key is how the agent signs in to Chokepoint. Chokepoint keeps only the public part. The private part is in the file you download, and only there.">Key</Title>
      {active ? <div className="identity-key">
        <KeyRound size={18} aria-hidden="true" />
        <div><strong>Active key</strong><small>{active.kid} · {active.alg}</small><small>Created by {active.created_by_name || active.created_by} · {new Date(active.created_at).toLocaleString()}</small></div>
        {!confirmRotate ? <div className="condition-actions">
          <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={busy} onClick={() => { setConfirmRotate(true); setError(undefined); }}>Rotate key</button>
          <Help text="Rotate: creates a new key and downloads a new file. The current key stops working at once. Tokens already issued stay valid until they expire (5 minutes). Use it when the file was lost or exposed." />
        </div> : null}
      </div> : <div className="identity-empty"><p>No key yet. A service can not get a token for this agent. Harness login does not need a key.</p></div>}
      {active && confirmRotate ? <div className="identity-confirm"><p className="resource-warning"><TriangleAlert size={14} aria-hidden="true" />The current key stops working now. Give the new file to the agent at once.</p><div className="condition-actions"><button type="button" className="cp-admin-button cp-admin-button--small" disabled={busy} onClick={() => void generate(current)}><Download size={14} aria-hidden="true" />{busy ? 'Rotating…' : 'Rotate and download'}</button><button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" disabled={busy} onClick={() => setConfirmRotate(false)}>Cancel</button></div></div> : null}
      {!active ? <div className="condition-actions"><button type="button" className="cp-admin-button" disabled={busy} onClick={() => void generate(current)}><Download size={16} aria-hidden="true" />{busy ? 'Generating…' : 'Generate key and download'}</button><Help text="Creates a key pair in your browser. Chokepoint registers the public key. You download one file with the private key and the connection values. Give this file to the agent." /></div> : null}
      {error ? <div role="alert" className="cp-admin-notice" data-tone="danger">{error.message}{error.conflict ? <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => { setError(undefined); setConfirmRotate(false); void client.refetch(); }}>Reload</button> : null}</div> : null}
      {downloaded ? <p className="consent-record identity-downloaded"><Check size={16} aria-hidden="true" /><span><strong>File downloaded: {downloaded}</strong><small>This is the only copy of the private key. Store it like a password. Chokepoint can not show it again.</small></span></p> : null}
    </section>

    <HarnessClients scope={scope} agentId={agentId} agentName={agentName} issuer={current.issuer} />

    <details className="identity-card identity-more">
      <summary><Title help="The values that the file already has. Use them only to configure the agent by hand.">Connection details</Title></summary>
      <CopyValue label="Client ID" value={current.client_id} help="The ID of this agent at the Chokepoint authorization server. The agent sends it in every token request." />
      <CopyValue label="Issuer" value={current.issuer} help="Who issues the Chokepoint tokens of this environment. A token of one environment never works in another." />
      <CopyValue label="Token endpoint" value={current.token_endpoint} help="Where the agent exchanges the token of the person for a Chokepoint token." />
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
      <OwnKeyForm busy={busy} onSave={(jwk, kid) => void registerOwn(current, jwk, kid)} />
    </details>
  </section>;
}
