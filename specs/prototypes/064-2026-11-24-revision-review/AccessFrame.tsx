import { useState, type ReactNode } from 'react';
import { Bot, ChevronLeft, ChevronRight, CircleHelp, Eye, Pencil, Plus, Power, Search, Trash2 } from 'lucide-react';
import { AccessNavigation } from '../../../src/features/access/components/AccessNavigation';
import '../../../src/features/access/access.css';
import '../../../src/features/access/components/agent-list.css';
import '../../../src/features/access/components/agent-details.css';
import '../../../src/features/access/components/agent-visual.css';
import { agent, agents } from './data';

// Admin 064 prototype: the Access page around Delegation and access, as the real screen draws it
// (AccessPage, PermissionsPage, AgentList and AgentDetails), with fixed data. Only refunds-assistant
// is open; the other agents, Edit, Report-only, Disable agent and Delete do nothing here.
const visual = <span className="agent-visual" aria-hidden="true"><Bot size={20} /></span>;

export function AccessFrame({ toggles, children }: { toggles: ReactNode; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return <main id="main-content" className="admin-page cp-admin-container access-page" aria-label="Access" tabIndex={-1}>
    <AccessNavigation />
    <section aria-label="Permissions">
      <div className="access-page-heading">
        <div><h1 className="cp-admin-title">Agents</h1><p className="cp-admin-muted">Choose who can delegate to each agent, the tools it can call and the rules of each call.</p></div>
        <button type="button" className="cp-admin-button access-primary-action"><Plus size={18} aria-hidden="true" />New agent</button>
      </div>
      <div className="access-workbench" data-rail={collapsed ? 'collapsed' : undefined}>
        <div><div className="access-rail-wrap">
          <button type="button" className="access-rail-toggle access-rail-toggle--gap" aria-expanded={!collapsed} aria-label={collapsed ? 'Expand agent list' : 'Collapse agent list'} onClick={() => setCollapsed(v => !v)}>
            {collapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}
          </button>
          <aside className="cp-admin-panel access-agent-rail" aria-label="Agents" data-collapsed={collapsed}>
            <div className="access-agent-rail-heading"><span className="access-agent-rail-label">Agents</span><span className="access-agent-count">{agents.length}</span></div>
            <div className="access-agent-search" hidden={collapsed}><Search size={16} aria-hidden="true" /><input className="cp-admin-input" type="search" aria-label="Filter loaded agents" placeholder="Filter loaded agents…" /></div>
            <ul className="access-agent-list" aria-label="Agents">
              {agents.map(a => <li key={a.name}><button type="button" className="access-agent-row" aria-label={a.name} aria-pressed={a.name === agent.name}>
                {visual}<span className="access-agent-row-copy"><strong>{a.name}</strong><small>{a.description}</small></span>
                {a.name === agent.name ? <ChevronRight size={15} aria-hidden="true" /> : null}
              </button></li>)}
            </ul>
          </aside>
        </div></div>
        <section className="cp-admin-panel access-agent-details" aria-label="Selected agent">
          <div className="access-agent-heading">{visual}
            <div className="agent-detail-copy"><div className="access-agent-title"><h2>{agent.name}</h2><span className="mcp-badge" data-tone="success">Active</span></div><p>{agent.description}</p><p className="cp-admin-muted">Acts for the subjects that delegate to it</p></div>
            <div className="agent-detail-actions">
              <span className="agent-detail-actions-group"><span className="agent-mode-action"><button type="button" className="cp-admin-button cp-admin-button--small cp-admin-button--ghost agent-report-only-button"><Eye size={15} aria-hidden="true" />Report-only</button><CircleHelp size={14} aria-label="About Report-only" /></span><button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small"><Pencil size={15} aria-hidden="true" />Edit</button></span>
              <span className="agent-detail-actions-group"><button type="button" className="cp-admin-button cp-admin-button--small cp-admin-button--danger-soft"><Power size={15} aria-hidden="true" />Disable agent</button><button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small"><Trash2 size={15} aria-hidden="true" />Delete</button></span>
            </div>
          </div>
          <div className="agent-views-row">
            <div className="cp-admin-inner-tabs agent-views" role="group" aria-label="Agent view">
              {['Delegation and access', 'Identity', 'Harness sessions'].map((label, i) => <button key={label} type="button" aria-pressed={i === 0}>{label}</button>)}
            </div>
            {toggles}
          </div>
          {children}
        </section>
      </div>
    </section>
  </main>;
}
