import { useState } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router';
import { Power } from 'lucide-react';
import { DelegationEditor } from '../access/delegation/DelegationEditor';
import { AgentIdentity } from '../access/delegation/AgentIdentity';
import { WaitingBackend } from '../access/delegation/WaitingBackend';
import { toolCatalog } from '../access/delegation/fixtures';
import { ResourceMapping, type ResourceState } from '../mcp/ResourceMapping';
import { ChokepointTokenSetup } from '../mcp/ChokepointTokenSetup';
import type { ManagedTool } from '../mcp/api';
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

// Layout prototypes of Admin 026, 027, 029 and 030: fixed data, never connected to the backend.
// The real screens stay unchanged; these pages are the visual specification until implementation.
const pages = [
  { path: 'agent', label: 'Agent (026, 029)' },
  { path: 'tools', label: 'Tool review (027)' },
  { path: 'mcp-server', label: 'Custom MCP server (029)' },
  { path: 'investigate', label: 'Investigate and Inbox (030)' },
] as const;

function AgentPrototype() {
  const [disabled, setDisabled] = useState(false);
  const [tab, setTab] = useState<'access' | 'identity'>('access');
  const agentId = 'c61e0a96-18ad-4a42-8aea-882c4a8847d7', name = 'issues-manager';
  return <section className="cp-admin-panel access-agent-details" aria-label="Agent prototype">
    <div className="access-agent-heading"><div className="agent-detail-copy"><div className="access-agent-title"><h2>{name}</h2><span className="mcp-badge" data-tone={disabled ? undefined : 'success'}>{disabled ? 'Disabled' : 'Active'}</span><WaitingBackend spec="032" tip="Turns the agent on or off at once. A disabled agent gets no new token and its next call is rejected." /></div><p className="cp-admin-muted">Acts for the subjects that delegate to it</p></div>
      <div className="agent-detail-actions"><button className={`cp-admin-button cp-admin-button--small ${disabled ? 'cp-admin-button--secondary' : 'cp-admin-button--danger-soft'}`} type="button" onClick={() => setDisabled(v => !v)}><Power size={15} aria-hidden="true" />{disabled ? 'Enable agent' : 'Disable agent'}</button></div></div>
    <div className="access-detail-tabs agent-view-tabs" role="group" aria-label="Agent views"><button type="button" aria-pressed={tab === 'access'} onClick={() => setTab('access')}>Delegation and access</button><button type="button" aria-pressed={tab === 'identity'} onClick={() => setTab('identity')}>Identity</button></div>
    <div hidden={tab !== 'access'}><DelegationEditor agentName={name} disabled={disabled} /></div>
    {tab === 'identity' ? <AgentIdentity agentId={agentId} agentName={name} disabled={disabled} /> : null}
  </section>;
}

function toManaged(t: (typeof toolCatalog)[number]): ManagedTool {
  const properties = Object.fromEntries(Object.entries(t.args).map(([k, type]) => [k, { type }]));
  return { name: t.tool, reviewed: true, change: 'unchanged', selected: true, enabled: true, contract: { name: t.tool, inputSchema: { type: 'object', properties, required: Object.keys(t.args).slice(0, 1) } } } as ManagedTool;
}

function ToolsPrototype() {
  const tools = toolCatalog.filter(t => t.serverId === 'github').slice(0, 4).map(toManaged);
  const [state, setState] = useState<Record<string, ResourceState>>({ merge_pull_request: { active: { pointer: 'repository', kind: 'merge_pull_request_repository' } } });
  const kinds = [...new Set(Object.values(state).flatMap(s => [s.active?.kind, s.draft?.kind]).filter((k): k is string => !!k))];
  return <section className="cp-admin-panel mcp-details" aria-label="Tool review prototype">
    <header className="mcp-details-heading"><div><h2>GitHub</h2><p className="cp-admin-muted">Enterprise MCP · tool review</p></div></header>
    <div className="mcp-tool-list">{tools.map(tool => <article key={tool.name} className="mcp-tool-row">
      <div className="mcp-tool-heading"><div className="mcp-tool-copy"><strong>{tool.name}</strong><code>{tool.name}</code></div><span className="mcp-badge">Enabled</span></div>
      <ResourceMapping tool={tool} state={state[tool.name] ?? {}} kinds={kinds} agents={k => (k === 'merge_pull_request_repository' ? ['issues-manager'] : [])} onChange={s => setState(v => ({ ...v, [tool.name]: s }))} />
    </article>)}</div>
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
    <header className="access-page-heading"><div><span className="cp-admin-label">LAYOUT PROTOTYPES</span><h1 className="cp-admin-title">Agent delegation screens</h1><p className="cp-admin-muted">Fixed data. These pages are the visual specification of Admin 026, 027, 029 and 030. They do not call the backend.</p></div></header>
    <nav className="prototype-nav" aria-label="Prototype pages">{pages.map(p => <NavLink key={p.path} to={`/prototype/${p.path}`}>{p.label}</NavLink>)}</nav>
    <Routes>
      <Route index element={<Navigate to="agent" replace />} />
      <Route path="agent" element={<AgentPrototype />} />
      <Route path="tools" element={<ToolsPrototype />} />
      <Route path="mcp-server" element={<McpServerPrototype />} />
      <Route path="investigate" element={<InvestigatePrototype />} />
    </Routes>
  </section>;
}
