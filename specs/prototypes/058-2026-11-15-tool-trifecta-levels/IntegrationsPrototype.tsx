import { ArrowUpRight, MoreHorizontal, Plus, Server, Users } from 'lucide-react';
import { TracePager } from '../../../src/features/investigate/TraceUI';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import '../../../src/features/mcp/mcp.css';
import '../../../src/features/investigate/investigate.css';
import '../../../src/features/identity/identity.css';
import { TourButton } from './TourButton';
import './prototype.css';

// Admin 058 prototype: the Custom MCPs list of Integrations (Admin 057) with the lethal trifecta of each
// server: how many of its managed tools have, on their own, two or three legs High.
// Review and Discover open the review page of this prototype. Fixed data.

// Each tool is evaluated on its own (user, 2026-11-15): the row counts the tools whose own legs are
// High, never a sum of the legs of different tools.
type RiskyTool = { name: string; high: 2 | 3 };
type Row = { name: string; transport: string; tools: number; enabled: boolean; reviewRequired?: boolean; risky: RiskyTool[] };
const rows: Row[] = [
  { name: 'Acme Support', transport: 'streamable-http', tools: 6, enabled: true, reviewRequired: true, risky: [{ name: 'read_inbox', high: 2 }] },
  { name: 'Acme Mail Relay', transport: 'streamable-http', tools: 5, enabled: true, risky: [{ name: 'forward_thread', high: 3 }, { name: 'reply_all', high: 3 }, { name: 'summarize_inbox', high: 2 }] },
  { name: 'Acme Billing', transport: 'streamable-http', tools: 9, enabled: true, risky: [] },
  { name: 'Acme CRM', transport: 'streamable-http', tools: 7, enabled: true, risky: [{ name: 'sync_crm', high: 2 }, { name: 'import_notes', high: 2 }, { name: 'search_tickets', high: 2 }] },
  { name: 'Docs Search', transport: 'sse', tools: 2, enabled: false, risky: [] },
];

// The public documentation page that explains the lethal trifecta, with screenshots of these screens.
// It does not exist yet; the path is a proposal (Admin 058).
const trifectaDocs = 'https://xokepoint.com/docs/platform/mcp-servers/lethal-trifecta';

const count = (n: number, level: string) => `${n} ${n === 1 ? 'tool is' : 'tools are'} ${level}`;

function Trifecta({ risky, tools }: { risky: RiskyTool[]; tools: number }) {
  // A server without risky tools says so with the count of its tools (user, 2026-11-15).
  if (!risky.length) return <span className="mcp-badge" data-tone="success">{tools} {tools === 1 ? 'tool' : 'tools'} OK</span>;
  const three = risky.filter(t => t.high === 3).length;
  const two = risky.filter(t => t.high === 2).length;
  return <span className="tli-line">
    {three ? <span className="mcp-badge" data-tone="danger">{count(three, 'high')}</span> : null}
    {two ? <span className="mcp-badge" data-tone="warning">{count(two, 'two legs high')}</span> : null}
  </span>;
}

export function TrifectaIntegrationsPrototype() {
  return <section aria-label="Integrations" className="mcp-registry">
    <header className="access-page-heading"><div><h1 className="cp-admin-title">Integrations</h1><p className="cp-admin-muted">Connect custom MCPs and identity providers, then manage agent access.</p></div><button type="button" className="cp-admin-button"><Plus size={16} />Connect custom MCP</button></header>
    <div className="mcp-types" role="group" aria-label="Integration type"><button aria-pressed><Server size={17} />Custom MCPs</button><button aria-pressed={false}><Users size={17} />Identity providers</button></div>
    <div className="mcp-toolbar"><label htmlFor="mcp-search">Find a connection</label><input id="mcp-search" type="search" className="cp-admin-input" placeholder="Search by name or endpoint" /></div>
    <div className="cp-admin-table-scroll identity-table-region" role="region" aria-label="MCP servers table" tabIndex={0}><table className="cp-admin-table mcp-servers">
      <thead><tr><th>Connection</th><th>Managed tools</th><th><a className="cp-admin-docs-link" href={trifectaDocs} target="_blank" rel="noopener noreferrer">Lethal trifecta <ArrowUpRight size={14} aria-hidden="true" /></a> <WaitingBackend spec="097" tip="The managed tools of the server whose own levels have two or three legs High, read from the levels of each tool." /></th><th>Status</th><th className="il-actions-head">Actions</th></tr></thead>
      <tbody>{rows.map(s => <tr key={s.name}>
        <td><span className="il-name"><Server size={24} aria-hidden="true" /><span><strong>{s.name}</strong><small>Custom MCP · {s.transport}</small></span></span></td>
        <td>{s.tools} tools{s.reviewRequired ? <span className="mcp-badge" data-tone="warning">Review required</span> : null}</td>
        <td><Trifecta risky={s.risky} tools={s.tools} /></td>
        <td><label className="cp-admin-choice il-status"><input className="cp-admin-switch" type="checkbox" role="switch" defaultChecked={s.enabled} aria-label={`${s.name} enabled`} />{s.enabled ? 'Enabled' : 'Disabled'}</label></td>
        <td><div className="identity-row-actions il-row-actions">
          <a className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" href="/prototype/tool-trifecta">{s.reviewRequired ? 'Review' : 'Discover'}</a>
          <details className="identity-menu" name="mcp-row-menu"><summary aria-label={`More actions for ${s.name}`}><MoreHorizontal size={18} /></summary><div onClick={e => e.currentTarget.closest('details')?.removeAttribute('open')}>
            <button type="button">Edit connection</button>
            <button type="button">Review history</button>
          </div></details>
        </div></td>
      </tr>)}</tbody>
    </table></div>
    <TourButton />
    <div className="il-pager"><TracePager page={1} size={10} total={rows.length} onPage={() => undefined} /></div>
  </section>;
}
