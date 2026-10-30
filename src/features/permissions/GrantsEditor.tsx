import type { AccessTarget } from '../access/target-context';
import type { MCPServer } from '../mcp/api';
import type { Grant } from './api';

export function GrantsEditor({ grants, servers, disabled, target, onChange }: { grants: Grant[]; servers: MCPServer[]; disabled: boolean; target?: AccessTarget; onChange: (grants: Grant[]) => void }) {
  function serverAccess(serverId: string, enabled: boolean) { onChange(enabled ? [...grants, { server_id: serverId, tools: [] }] : grants.filter(g => g.server_id !== serverId)); }
  function toolAccess(serverId: string, name: string, enabled: boolean) { onChange(grants.map(g => g.server_id === serverId ? { ...g, tools: enabled ? [...g.tools, name] : g.tools.filter(t => t !== name) } : g)); }
  return <section aria-label="Server and tool permissions"><h3>Explicit server and tool access</h3><p className="cp-admin-muted">Both are required. Enabling a server does not grant its tools or tools discovered later.</p>
    {servers.map(server => {
      const grant = grants.find(g => g.server_id === server.id);
      return <section className="permission-server" key={server.id}><header><label><input type="checkbox" checked={!!grant} disabled={disabled || (!server.enabled && !grant)} onChange={e => serverAccess(server.id, e.target.checked)} /> <strong>{server.name}</strong> · Server access</label><span className="cp-admin-muted">{server.enabled ? 'Enabled in catalog' : 'Unavailable in catalog'}</span></header>
        <div className="permission-tools">{server.tools.filter(t => t.change !== 'removed' || grant?.tools.includes(t.name)).map(tool => <label key={tool.name} tabIndex={target?.serverId === server.id && target?.tool === tool.name ? -1 : undefined} data-context-target={target?.serverId === server.id && target?.tool === tool.name}><input type="checkbox" checked={grant?.tools.includes(tool.name) ?? false} disabled={disabled || !grant || ((!server.enabled || !tool.enabled || !tool.reviewed || !tool.selected) && !grant.tools.includes(tool.name))} onChange={e => toolAccess(server.id, tool.name, e.target.checked)} /><code>{tool.name}</code><small>{tool.enabled && tool.reviewed && tool.selected ? '' : 'Unavailable; remove or review the catalog'}</small></label>)}
          {grant?.tools.filter(name => !server.tools.some(t => t.name === name)).map(name => <label key={name} tabIndex={target?.serverId === server.id && target?.tool === name ? -1 : undefined} data-context-target={target?.serverId === server.id && target?.tool === name}><input type="checkbox" checked disabled={disabled} onChange={() => toolAccess(server.id, name, false)} /><code>{name}</code><small>Missing from catalog</small></label>)}
          {!server.tools.length ? <p>No reviewed tools. Server access alone cannot execute a tool.</p> : null}</div>
      </section>;
    })}
    {grants.filter(g => !servers.some(s => s.id === g.server_id)).map(g => <div className="permission-server" key={g.server_id}><p>Unavailable server <code>{g.server_id}</code></p><button disabled={disabled} className="cp-admin-button cp-admin-button--ghost" onClick={() => serverAccess(g.server_id, false)}>Remove server permission and its tools</button></div>)}
    {!servers.length ? <p>No MCP servers registered in this environment. Add and review a server under Integrations.</p> : null}
  </section>;
}
