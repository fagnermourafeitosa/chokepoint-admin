import { ArrowRight, Check, KeyRound, MoreHorizontal, Plus, Shield } from 'lucide-react';
import { IntegrationTabs } from '../../../src/features/externalapps/IntegrationTabs';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import '../../../src/features/identity/identity.css';
import '../../../src/features/access/delegation/delegation.css';
import '../../../src/features/mcp/mcp.css';
import '../../../src/features/attention/attention.css';
import { issuer, people } from './data';
import './prototype.css';

// Admin 065 layout prototype: where the People page of a Generic OIDC connection opens from.
// 1. Integrations, Identity providers: a People action on the row of a Generic OIDC connection, with
//    the count of people waiting for approval. 2. Inbox: one item for each connection with pending people.
const pending = people.filter(p => p.status === 'pending').length;

// Access, Integrations, Identity providers.
export function IntegrationsEntryPrototype() {
  return <section aria-label="Identity providers" className="identity-registry">
      <header className="access-page-heading"><div><h1 className="cp-admin-title">Integrations</h1><p className="cp-admin-muted">Connect services to this environment.</p></div><button className="cp-admin-button" type="button"><Plus size={16} />Connect identity provider</button></header>
      <IntegrationTabs current="identity" onTab={() => undefined} />
      <div className="identity-list-title"><h2>Identity providers</h2><span className="cp-admin-muted">2 connections</span></div>
      <div className="cp-admin-table-scroll identity-table-region" role="region" aria-label="Identity connections" tabIndex={0}><table className="cp-admin-table identity-table"><thead><tr><th>Connection</th><th>Accepted audiences</th><th>Status</th><th>Configuration check</th><th className="identity-actions-head">Actions</th></tr></thead><tbody>
        <tr>
          <td><div className="identity-name"><Shield size={22} /><span><strong>Acme workforce</strong><small className="cp-admin-muted">https://id.acme.com/realms/workforce</small></span></div></td>
          <td><div className="identity-audience-values"><code>https://acme.xokepoint.com/mcp</code></div></td>
          <td><span className="mcp-badge" data-tone="success">Enabled</span></td>
          <td><span className="identity-check-result"><Check size={16} aria-hidden="true" />Verified</span></td>
          <td><div className="identity-row-actions"><button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" type="button">Edit</button><details className="identity-menu"><summary aria-label="More actions"><MoreHorizontal size={18} /></summary></details></div></td>
        </tr>
        <tr>
          <td><div className="identity-name"><KeyRound size={22} /><span><strong>Acme login</strong><small className="cp-admin-muted">{issuer} · Generic OIDC</small></span></div></td>
          <td><div className="identity-audience-values"><code>https://acme.xokepoint.com/mcp</code></div></td>
          <td><div className="oidc-status-cell"><span className="mcp-badge" data-tone="success">Enabled</span><span className="mcp-badge" data-tone="warning">{pending} pending approval</span></div></td>
          <td><span className="identity-check-result"><Check size={16} aria-hidden="true" />Verified</span></td>
          <td><div className="identity-row-actions"><button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" type="button">People</button><WaitingBackend spec="106" tip="Opens the people of a connection without a directory; the row counts those waiting for approval." /><button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" type="button">Edit</button><details className="identity-menu"><summary aria-label="More actions"><MoreHorizontal size={18} /></summary></details></div></td>
        </tr>
      </tbody></table></div>
    </section>;
}

// Overview, the Inbox panel.
export function InboxEntryPrototype() {
  return <section className="cp-admin-panel attention-inbox" aria-label="Inbox">
      <header className="attention-inbox-header"><div><span className="attention-kicker">Inbox</span><h2>1 item needs attention</h2></div></header>
      <div className="attention-table" role="table" aria-label="Inbox items">
        <div className="attention-row attention-head" role="row">{['Severity', 'Type', 'Subject', 'Context', 'When', 'Action'].map(v => <span role="columnheader" key={v}>{v}</span>)}</div>
        <div className="attention-row attention-row--open" role="row">
          <span role="cell"><span className="severity-chip severity-chip--medium">Medium</span></span>
          <span role="cell"><span className="attention-tag attention-tag--report-only-review-due">Approval pending</span></span>
          <span role="cell" className="attention-main"><strong>{pending} people waiting for approval</strong><small>They can not log in from a harness until approved.</small></span>
          <span role="cell" className="attention-main attention-context"><code>Acme login</code><small>Generic OIDC · Approved people only</small></span>
          <span role="cell" className="attention-when"><time>Nov 25, 09:12 UTC</time><small className="attention-status-chip">Open</small></span>
          <span role="cell" className="attention-action"><button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" type="button">People<ArrowRight size={14} /></button><WaitingBackend spec="106" tip="One Inbox item for each connection with people waiting for approval, in the Access category; it resolves when nobody is pending." /></span>
        </div>
      </div>
    </section>;
}
