import { CircleHelp } from 'lucide-react';
import { Tooltip } from '../../../components/ui/tooltip/Tooltip';
import { useMemo, useState, useSyncExternalStore } from 'react';
import type { AgentRecord, AgentScope } from '../agent-api';
import { useAgentGraph } from './useAgentGraph';
import { graphLayout } from './layout';
import { GraphCanvas } from './GraphCanvas';
import { GraphDetails } from './GraphDetails';
import './graph.css';

const narrowQuery = '(max-width: 740px)';
const subscribe = (notify: () => void) => { const media = window.matchMedia(narrowQuery); media.addEventListener('change', notify); return () => media.removeEventListener('change', notify); };
const isNarrow = () => window.matchMedia(narrowQuery).matches;
export function AgentGraph({ agent, scope, onPermissions }: { agent: AgentRecord; scope: AgentScope; onPermissions: () => void }) {
  const compact = useSyncExternalStore(subscribe, isNarrow);
  const data = useAgentGraph(scope, agent.id);
  const [selectedId, setSelected] = useState<string>();
  const published = data.permissions.data?.published;
  const layout = useMemo(() => graphLayout(agent.id, agent.name, published, data.catalog.data ?? [], compact), [agent.id, agent.name, published, data.catalog.data, compact]);
  if (data.permissions.isPending || data.catalog.isPending) return <p role="status" className="access-detail-content">Loading agent connections…</p>;
  if (data.permissions.isError || data.catalog.isError) return <div role="alert" className="access-detail-content"><p>The relationship map is unavailable. No partial graph is shown.</p><button className="cp-admin-button" onClick={() => { void data.permissions.refetch(); void data.catalog.refetch(); }}>Reload graph</button></div>;
  const selected = layout.nodes.find(n => n.id === selectedId);
  return <section className="agent-graph" aria-label="Agent relationships">
    <header className="agent-graph-heading"><div><div className="agent-graph-title"><h3>Agent connections</h3><Tooltip content="These links show this agent’s published MCP permissions. Tool counts describe configured grants. Each call is still checked against the user’s identity, policy conditions and the connected platform’s permissions."><span role="img" aria-label="About agent connections"><CircleHelp size={17} aria-hidden="true" /></span></Tooltip></div><p>Published connections and granted tools.</p></div><span className="mcp-badge">{published?.grants.length ?? 0} MCP connections</span></header>
    {data.permissions.data?.draft ? <p className="agent-graph-notice">A saved permission draft exists. This graph shows the published configuration.</p> : null}
    {!published?.grants.length ? <div className="agent-graph-empty"><p>No published MCP connections yet.</p><button className="cp-admin-button cp-admin-button--secondary" onClick={onPermissions}>Configure agent access</button></div> : null}
    <GraphCanvas key={`${agent.id}:${compact}:${layout.nodes.map(n => n.id).join(',')}`} layout={layout} selected={selected?.id} onSelect={node => setSelected(node.id)} />
    {selected ? <GraphDetails node={selected} published={published} /> : null}
  </section>;
}
