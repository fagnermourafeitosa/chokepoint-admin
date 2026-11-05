import { useState } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router';
import { Power } from 'lucide-react';
import { AgentIdentity } from '../access/delegation/AgentIdentity';
import { WaitingBackend } from '../access/delegation/WaitingBackend';
import { ChokepointTokenSetup } from '../mcp/ChokepointTokenSetup';
import { ProtoLists, type Filters, type View } from '../investigate/prototype/ProtoLists';
import { ProtoInspector } from '../investigate/prototype/ProtoInspector';
import { ProtoExchangeSignals } from '../investigate/prototype/ProtoSignals';
import '../access/components/agent-details.css';
import '../investigate/investigate.css';
import '../investigate/inspector.css';
import '../investigate/prototype/proto.css';
import '../attention/attention.css';
import '../mcp/mcp.css';
import './prototype.css';

// Layout prototypes of Admin 029, 030 and 031: fixed data, never connected to the backend.
// The real screens stay unchanged; these pages are the visual specification until implementation.
const pages = [
  { path: 'agent', label: 'Agent (029, 031)' },
  { path: 'mcp-server', label: 'Custom MCP server (029)' },
  { path: 'investigate', label: 'Investigate and Inbox (030)' },
] as const;

function AgentPrototype() {
  const [disabled, setDisabled] = useState(false);
  const agentId = 'c61e0a96-18ad-4a42-8aea-882c4a8847d7', name = 'issues-manager';
  return <section className="cp-admin-panel access-agent-details" aria-label="Agent prototype">
    <div className="access-agent-heading"><div className="agent-detail-copy"><div className="access-agent-title"><h2>{name}</h2><span className="mcp-badge" data-tone={disabled ? undefined : 'success'}>{disabled ? 'Disabled' : 'Active'}</span><WaitingBackend spec="032" tip="Turns the agent on or off at once. A disabled agent gets no new token and its next call is rejected." /></div><p className="cp-admin-muted">Acts for the subjects that delegate to it</p></div>
      <div className="agent-detail-actions"><button className={`cp-admin-button cp-admin-button--small ${disabled ? 'cp-admin-button--secondary' : 'cp-admin-button--danger-soft'}`} type="button" onClick={() => setDisabled(v => !v)}><Power size={15} aria-hidden="true" />{disabled ? 'Enable agent' : 'Disable agent'}</button></div></div>
    <AgentIdentity agentId={agentId} agentName={name} disabled={disabled} />
  </section>;
}

function McpServerPrototype() {
  const endpoint = 'https://issues.acme.internal/mcp';
  return <section className="cp-admin-panel mcp-details prototype-stack" aria-label="Custom MCP server prototype">
    <header className="mcp-details-heading"><div><h2>Issues MCP</h2><p className="cp-admin-muted">Custom MCP · {endpoint}</p></div></header>
    <h3 className="prototype-caption">Connection dialog</h3>
    <ChokepointTokenSetup compact endpoint={endpoint} />
    <h3 className="prototype-caption">Server details</h3>
    <ChokepointTokenSetup endpoint={endpoint} />
  </section>;
}

function InvestigatePrototype() {
  const [view, setView] = useState<View>('problems');
  const [filters, setFilters] = useState<Filters>({ text: '', reason: '' });
  const [open, setOpen] = useState<{ kind: 'decision' | 'exchange'; id: string }>();
  return <div className="prototype-stack">
    <section className="cp-admin-panel attention-inbox" aria-label="Inbox prototype"><header className="attention-inbox-header"><div><span className="attention-kicker">Inbox</span><h2>Token exchange signals</h2></div></header><ProtoExchangeSignals /></section>
    {open ? <ProtoInspector kind={open.kind} id={open.id} onBack={() => setOpen(undefined)} /> : <ProtoLists view={view} onView={v => { setView(v); setFilters({ text: '', reason: '' }); }} filters={filters} onFilters={setFilters} onOpen={(kind, id) => setOpen({ kind, id })} />}
  </div>;
}

export function PrototypePage() {
  return <section aria-label="Prototypes" className="prototype-page">
    <header className="access-page-heading"><div><span className="cp-admin-label">LAYOUT PROTOTYPES</span><h1 className="cp-admin-title">Agent delegation screens</h1><p className="cp-admin-muted">Fixed data. These pages are the visual specification of Admin 029, 030 and 031. They do not call the backend.</p></div></header>
    <nav className="prototype-nav" aria-label="Prototype pages">{pages.map(p => <NavLink key={p.path} to={`/prototype/${p.path}`}>{p.label}</NavLink>)}</nav>
    <Routes>
      <Route index element={<Navigate to="agent" replace />} />
      <Route path="agent" element={<AgentPrototype />} />
      <Route path="mcp-server" element={<McpServerPrototype />} />
      <Route path="investigate" element={<InvestigatePrototype />} />
    </Routes>
  </section>;
}
