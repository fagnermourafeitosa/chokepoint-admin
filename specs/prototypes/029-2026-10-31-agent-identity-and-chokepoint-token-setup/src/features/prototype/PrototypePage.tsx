import { useState } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router';
import { AgentIdentity } from '../access/delegation/AgentIdentity';
import { ChokepointTokenSetup } from '../mcp/ChokepointTokenSetup';
import '../access/components/agent-details.css';
import '../mcp/mcp.css';
import './prototype.css';

// Layout prototypes of Admin 029: fixed data, never connected to the backend.
// The real screens stay unchanged; these pages are the visual specification until implementation.
const pages = [
  { path: 'agent', label: 'Agent (029)' },
  { path: 'mcp-server', label: 'Custom MCP server (029)' },
] as const;

function AgentPrototype() {
  const agentId = 'c61e0a96-18ad-4a42-8aea-882c4a8847d7', name = 'issues-manager';
  return <section className="cp-admin-panel access-agent-details" aria-label="Agent prototype">
    <div className="access-agent-heading"><div className="agent-detail-copy"><div className="access-agent-title"><h2>{name}</h2></div><p className="cp-admin-muted">Acts for the subjects that delegate to it</p></div></div>
    <AgentIdentity agentId={agentId} agentName={name} disabled={false} />
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

export function PrototypePage() {
  return <section aria-label="Prototypes" className="prototype-page">
    <header className="access-page-heading"><div><span className="cp-admin-label">LAYOUT PROTOTYPES</span><h1 className="cp-admin-title">Agent delegation screens</h1><p className="cp-admin-muted">Fixed data. These pages are the visual specification of Admin 029, 030 and 031. They do not call the backend.</p></div></header>
    <nav className="prototype-nav" aria-label="Prototype pages">{pages.map(p => <NavLink key={p.path} to={`/prototype/${p.path}`}>{p.label}</NavLink>)}</nav>
    <Routes>
      <Route index element={<Navigate to="agent" replace />} />
      <Route path="agent" element={<AgentPrototype />} />
      <Route path="mcp-server" element={<McpServerPrototype />} />
    </Routes>
  </section>;
}
