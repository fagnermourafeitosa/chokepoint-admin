import { useState } from 'react';
import { Check, CircleHelp, Copy } from 'lucide-react';
import { Tooltip } from '../../components/ui/tooltip/Tooltip';

// The Chokepoint token auth type of a custom MCP server (Admin 029 section 4, Backend 035 and 040).
// The server trusts Chokepoint: it checks each token with the Chokepoint keys.

function Help({ text }: { text: string }) {
  return <Tooltip content={text}><CircleHelp size={14} aria-label="Help" /></Tooltip>;
}

function Value({ label, value, placeholder, help }: { label: string; value?: string; placeholder: string; help: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="identity-value"><span className="identity-title">{label}<Help text={help} /></span><code>{value || placeholder}</code>
    <button type="button" className="relation-icon-button" aria-label={`Copy ${label}`} disabled={!value} onClick={() => { if (!value) return; void navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>
  </div>;
}

// The audience that the connection dialog shows before the server is saved: the typed endpoint with a
// lower-case scheme and host, no default port, no query and no fragment (Backend 035 Resolved Decision 8).
// The saved server returns the audience of the backend, which the details show.
export function typedAudience(endpoint: string) {
  try {
    const url = new URL(endpoint.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
    // The parser gives "/" to an endpoint without a path; the backend keeps the path as stored.
    const path = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]*(?:[?#]|$)/i.test(endpoint.trim()) ? '' : url.pathname;
    return `${url.protocol}//${url.host}${path}`;
  } catch { return undefined; }
}

export type TrustValues = { issuer?: string; jwksUri?: string; audience?: string };

// compact: the three values only, for the connection dialog. The server details add the example.
export function ChokepointTokenSetup({ issuer, jwksUri, audience, unavailable, compact = false }: TrustValues & { unavailable?: boolean; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const missing = unavailable ? 'Unavailable. Retry later.' : 'Loading…';
  const snippet = `from fastmcp import FastMCP
from fastmcp.server.auth.providers.jwt import JWTVerifier
from fastmcp.server.dependencies import get_access_token

auth = JWTVerifier(
    jwks_uri="${jwksUri ?? ''}",
    issuer="${issuer ?? ''}",
    audience="${audience ?? ''}",
    algorithm="ES256",  # the algorithm Chokepoint signs with
)
mcp = FastMCP("issues", auth=auth)

@mcp.tool
def move_issue(repository: str, issue_number: int, column: str) -> str:
    claims = get_access_token().claims
    person = claims["sub"]          # who delegated
    agent = claims["act"]["sub"]    # which agent acts
    # Chokepoint already checked delegation, tool, resource and rules.
    return f"{agent} moved #{issue_number} in {repository} for {person}"`;
  return <div className="chokepoint-token-setup" data-compact={compact}>
    <div className="relation-field-head"><strong className="identity-title">Authentication: Chokepoint token<Help text="Your server accepts only calls that passed through Chokepoint. Each call brings a short token that says who the person is (sub) and which agent acts (act). Your server checks the token with the Chokepoint public keys. It is the only option: a shared token or no authentication would hide who calls." /></strong></div>
    <p className="cp-admin-muted">Add these three values to your server. You do not change your tools.{compact ? ' The server details show an example.' : ''}</p>
    <Value label="Issuer" value={issuer} placeholder={missing} help="Who issues the tokens. Your server rejects a token from another issuer." />
    <Value label="JWKS" value={jwksUri} placeholder={missing} help="The Chokepoint public keys. Your server uses them to check that a token is real. Keys rotate; read this URL, do not copy the keys." />
    <Value label="Audience" value={audience} placeholder="Enter the MCP endpoint above" help="The URL of your server. Each token is issued for one server, so a token for another server is rejected here." />
    {compact ? null : <><details className="identity-more"><summary><span className="identity-title">Example: FastMCP<Help text="The same three values in a FastMCP server. Other frameworks have the same settings for JWT verification." /></span></summary>
      <pre className="identity-code">{snippet}</pre>
      <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" disabled={!issuer || !jwksUri || !audience} onClick={() => { void navigator.clipboard?.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{copied ? 'Copied' : 'Copy example'}</button>
    </details>
    <p className="cp-admin-muted relation-note">In each tool, the token gives you <code>sub</code> (the person or service) and <code>act.sub</code> (the agent). Use them for your own checks or logs.</p></>}
  </div>;
}
