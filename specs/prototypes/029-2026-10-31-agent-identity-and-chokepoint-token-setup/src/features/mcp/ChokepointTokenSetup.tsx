import { useState } from 'react';
import { Check, CircleHelp, Copy } from 'lucide-react';
import { Tooltip } from '../../components/ui/tooltip/Tooltip';
import { WaitingBackend } from '../access/delegation/WaitingBackend';

// Layout prototype (Admin A2): the Chokepoint token auth type of a custom MCP server (Backend 035).
// The server trusts Chokepoint: it checks each token with the Chokepoint keys. Fixed values only.
const issuer = 'https://chokepoint.acme.example/as/workspace-a/sandbox';

function Help({ text }: { text: string }) {
  return <Tooltip content={text}><CircleHelp size={14} aria-label="Help" /></Tooltip>;
}

function Value({ label, value, help }: { label: string; value: string; help: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="identity-value"><span className="identity-title">{label}<Help text={help} /></span><code>{value || 'Enter the MCP endpoint above'}</code>
    <button type="button" className="relation-icon-button" aria-label={`Copy ${label}`} disabled={!value} onClick={() => { void navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>
  </div>;
}

// compact: the three values only, for the connection dialog. The detail of the server adds the example.
export function ChokepointTokenSetup({ endpoint, compact = false }: { endpoint: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const jwks = `${issuer}/jwks`;
  const snippet = `from fastmcp import FastMCP
from fastmcp.server.auth.providers.jwt import JWTVerifier
from fastmcp.server.dependencies import get_access_token

auth = JWTVerifier(
    jwks_uri="${jwks}",
    issuer="${issuer}",
    audience="${endpoint || 'https://your-server.example/mcp'}",
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
    <div className="relation-field-head"><strong className="identity-title">Authentication: Chokepoint token<Help text="Your server accepts only calls that passed through Chokepoint. Each call brings a short token that says who the person is (sub) and which agent acts (act). Your server checks the token with the Chokepoint public keys. It is the only option: a shared token or no authentication would hide who calls." /></strong><WaitingBackend spec="035" tip="Lets your server know who calls each tool, with a token that only Chokepoint can issue." /></div>
    <p className="cp-admin-muted">Add these three values to your server. You do not change your tools.{compact ? ' The server details show an example.' : ''}</p>
    <Value label="Issuer" value={issuer} help="Who issues the tokens. Your server rejects a token from another issuer." />
    <Value label="JWKS" value={jwks} help="The Chokepoint public keys. Your server uses them to check that a token is real. Keys rotate; read this URL, do not copy the keys." />
    <Value label="Audience" value={endpoint} help="The URL of your server. Each token is issued for one server, so a token for another server is rejected here." />
    {compact ? null : <><details className="identity-more"><summary><span className="identity-title">Example: FastMCP<Help text="The same three values in a FastMCP server. Other frameworks have the same settings for JWT verification." /></span></summary>
      <pre className="identity-code">{snippet}</pre>
      <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => { void navigator.clipboard?.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{copied ? 'Copied' : 'Copy example'}</button>
    </details>
    <p className="cp-admin-muted relation-note">In each tool, the token gives you <code>sub</code> (the person or service) and <code>act.sub</code> (the agent). Use them for your own checks or logs.</p></>}
  </div>;
}
