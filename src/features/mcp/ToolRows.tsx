import { ToolAnnotations } from '../access/components/ToolAnnotations';
import type { ManagedTool } from './api';
const labels = { new: 'New', changed: 'Changed', removed: 'Removed', unchanged: '' };
export function ToolRows({ tools, selected, onToggle, disabled, serverEnabled = true }: { tools: ManagedTool[]; selected?: string[]; onToggle?: (name: string) => void; disabled?: boolean; serverEnabled?: boolean }) {
 return <div className="mcp-tool-list">{tools.map(tool => <article key={tool.name} className="mcp-tool-row" data-change={tool.change}>
  <div className="mcp-tool-heading">
   {onToggle ? <label className="mcp-tool-select"><input type="checkbox" aria-label={`Manage ${tool.name}`} checked={selected?.includes(tool.name) ?? false} disabled={disabled || tool.change === 'removed'} onChange={() => onToggle(tool.name)} /></label> : null}
   <div className="mcp-tool-copy"><strong>{tool.contract.title || tool.name}</strong><code>{tool.name}</code></div>
   {tool.change !== 'unchanged' ? <span className="mcp-badge" data-tone={tool.change === 'removed' ? 'danger' : 'warning'}>{labels[tool.change]}</span> : null}
   {!onToggle ? <span className="mcp-badge">{serverEnabled && tool.enabled ? 'Enabled' : 'Disabled'}</span> : null}
  </div>
  {tool.contract.description ? <p>{tool.contract.description}</p> : null}
  <ToolAnnotations annotations={tool.contract.annotations} />
  {tool.change === 'changed' || tool.change === 'removed' ? <p className="cp-admin-muted">Disabled{!tool.reviewed ? ' · review required' : ''}{tool.change === 'removed' ? ' · not returned by the server' : ''}.</p> : null}
  <details className="mcp-contract"><summary>{tool.previous ? 'Compare contract and metadata' : 'Contract and metadata'}</summary>
   {tool.previous ? <div><h4>Previous</h4><pre>{JSON.stringify(tool.previous, null, 2)}</pre><h4>Discovered</h4></div> : null}
   <pre>{JSON.stringify(tool.contract, null, 2)}</pre>
  </details>
 </article>)}</div>;
}
