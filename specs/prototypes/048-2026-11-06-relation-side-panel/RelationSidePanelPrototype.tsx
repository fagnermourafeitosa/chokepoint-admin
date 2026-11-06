import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { ArrowLeft, ArrowRight, List, Network, Server, Wrench, type LucideIcon } from 'lucide-react';
import { useAuth } from '../../../src/features/auth/AuthContext';
import { SourcesPage } from '../../../src/features/sources/SourcesPage';
import { CapabilityPanel } from './CapabilityPanel';
import { AllowedValuesPanel } from './AllowedValuesPanel';
import { AgentPanel, type AgentView } from './AgentPanel';
import { WhoCanDelegatePanel } from './WhoCanDelegatePanel';
import { IdpPanel } from './IdpPanel';
import { AddPanel } from './AddPanel';
import { PrototypeQueries, protoAgentId, protoScope } from './queries';
import { AgentIdentity } from '../../../src/features/access/delegation/AgentIdentity';
import { HarnessSessions } from '../../../src/features/access/delegation/HarnessSessions';
import { ListView } from './ListView';
import { Bot, ChevronLeft, ChevronRight, CircleHelp, Eye, Pencil, Plus, Power, Search, Trash2 } from 'lucide-react';
import { ReportOnlyChip, ReviewOverdueChip } from '../../../src/components/report-only/ReportOnlyChip';
import { QuickIncident } from '../../../src/components/quick-incident/QuickIncident';
import { accessNavigation } from '../../../src/features/access/navigation';
import { SidePanel } from '../../../src/components/ui/side-panel/SidePanel';
import { CatalogContext } from '../../../src/features/access/delegation/catalog';
import { DelegationGraph } from '../../../src/features/access/delegation/DelegationGraph';
import { filterDoc, isFiltered, noFilters, type Filters } from '../../../src/features/access/delegation/FilterBar';
import { FilterBar } from './FilterBar';
import { Tooltip } from '../../../src/components/ui/tooltip/Tooltip';
import { GraphHelp } from './GraphHelp';
import { delegationLayout, type LayoutEdge, type LayoutNode, type Positions, type Selection } from '../../../src/features/access/delegation/layout';
import { idpName, serverName, type Doc } from '../../../src/features/access/delegation/model';
import { PublishBar } from '../../../src/features/access/delegation/PublishBar';
import { RelationPanel } from '../../../src/features/access/delegation/RelationPanel';
import { SectionBar } from './SectionBar';
import { agentName, agents, catalogState, config, initialDoc } from './data';
import '../../../src/features/access/access.css';
import '../../../src/features/access/components/access-navigation.css';
import '../../../src/features/access/components/agent-list.css';
import '../../../src/features/access/components/agent-details.css';
import '../../../src/features/access/components/agent-visual.css';
import '../../../src/features/mcp/mcp.css';
import '../../../src/features/access/delegation/delegation.css';
import './relation-side-panel.css';

// Visual specification of Admin 048: the whole Access screen with fixed data. A click on a node
// or an edge of the Delegation and access graph opens its editor in the side panel on the right
// edge of the window, instead of the column next to the graph.
// title names the panel (Back links); heading, when set, is what the panel header shows.
function panelHead(selected: Selection, doc: Doc): { eyebrow?: string; title: string; heading?: ReactNode } {
  const { catalog } = catalogState;
  if (selected.type === 'capability') {
    const c = doc.capabilities.find(x => x.id === selected.id);
    if (!c) return { title: 'Tool' };
    return { title: c.tool, heading: <span className="proto-panel-path"><span><Bot size={16} aria-hidden="true" />{agentName}</span><ArrowRight size={14} aria-label="calls on" /><span><Server size={16} aria-hidden="true" />{serverName(catalog, c.serverId)}</span><span className="proto-panel-tool"><Wrench size={16} aria-hidden="true" /><code>{c.tool}</code></span></span> };
  }
  if ((selected.type === 'add' && selected.what === 'resource') || selected.type === 'resource') {
    return { eyebrow: `Hierarchy allowed values · ${agentName}`, title: 'Limit a tool to exact values' };
  }
  if (selected.type === 'add') return selected.what === 'delegator' ? { eyebrow: `Who can delegate to ${agentName}`, title: 'Identity providers' } : { eyebrow: agentName, title: 'Manage tools' };
  if (selected.type === 'idp') return { eyebrow: `Who can delegate to ${agentName}`, title: idpName(catalog, selected.issuer) };
  if (selected.type === 'group') return { eyebrow: agentName, title: selected.label };
  return { eyebrow: 'Agent', title: agentName };
}

function Toggle<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string, LucideIcon?][]; onChange: (v: T) => void }) {
  return <div className="delegation-toggle" role="group" aria-label={label}>{options.map(([v, text, Icon]) => Icon
    ? <Tooltip key={v} content={text}><button type="button" className="proto-toggle-icon" aria-label={text} aria-pressed={value === v} onClick={() => onChange(v)}><Icon size={16} aria-hidden="true" /></button></Tooltip>
    : <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{text}</button>)}</div>;
}

type Version = 'draft' | 'published';
type Mode = 'graph' | 'list';
type Block = { id: number; issuer: string; subject: string };

function Editor({ open, version, mode, block, onContextSources, onView }: { open?: string; version: Version; mode: Mode; block?: Block; onContextSources: (id: string) => void; onView: (v: AgentView) => void }) {
  const [doc, setDoc] = useState<Doc>(initialDoc);
  const [selected, setSelected] = useState<Selection | undefined>(() => (open ? { type: 'capability', id: open } : undefined));
  const [positions, setPositions] = useState<Positions>({});
  const [maximized, setMaximized] = useState(false);
  const [filters, setFilters] = useState<Filters>(noFilters);
  useEffect(() => setSelected(undefined), [version]);
  // A Block from Harness sessions goes into the draft, as in the real editor.
  const applied = useRef(0);
  useEffect(() => {
    if (!block || applied.current === block.id) return;
    applied.current = block.id;
    setDoc(d => d.blocked.some(b => b.issuer === block.issuer && b.subject === block.subject) ? d : { ...d, blocked: [...d.blocked, { issuer: block.issuer, subject: block.subject, reason: 'Blocked by administrator' }], delegations: d.delegations.filter(x => !(x.issuer === block.issuer && x.subject === block.subject)) });
  }, [block]);
  const [help, setHelp] = useState(false);
  const view = useMemo(() => (isFiltered(filters) ? filterDoc(doc, filters, catalogState.catalog) : doc), [doc, filters]);
  // Admin 048, only rules: the graph has no allowed values. Each tool shows its rule count.
  const layout = useMemo(() => {
    const plain = { ...view, resources: [], capabilities: view.capabilities.map(c => ({ ...c, mapping: undefined })) };
    const l = delegationLayout(agentName, plain, catalogState.catalog, positions);
    const rules = (id: string) => view.capabilities.find(c => c.id === id)?.conditions.length ?? 0;
    const nodes = l.nodes.filter(n => n.column !== 'resources').map(n => (n.column === 'tools' && n.select.type === 'capability' ? { ...n, subtitle: (k => (k ? `${k} ${k === 1 ? 'rule' : 'rules'}` : 'No rules'))(rules(n.select.id)) } : n));
    // A rule that reads trusted attributes draws an edge from its tool to the context source, labelled with what it reads.
    const used = new Map<string, { binding: string; caps: { id: string; attrs: string[] }[] }>();
    for (const c of view.capabilities) for (const k of c.conditions) for (const b of k.bindings) {
      const attrs = [...k.expression.matchAll(new RegExp(`chokepoint\\["${b}"\\]\\.values\\["([^"]+)"\\]`, 'g'))].map(m => m[1]);
      const u = used.get(b) ?? { binding: b, caps: [] };
      const cap = u.caps.find(x => x.id === c.id) ?? (u.caps.push({ id: c.id, attrs: [] }), u.caps[u.caps.length - 1]);
      cap.attrs = [...new Set([...cap.attrs, ...attrs])];
      used.set(b, u);
    }
    const sources = [...used.values()].map((u, i) => {
      const cap = view.capabilities.find(c => c.id === u.caps[0].id)!;
      const binding = catalogState.catalog.bindings(cap.serverId, cap.tool).find(x => x.id === u.binding);
      const node: LayoutNode = { key: `cs-${u.binding}`, select: { type: 'capability', id: cap.id }, column: 'resources', x: positions[`cs-${u.binding}`]?.x ?? l.colX.resources + 150, y: positions[`cs-${u.binding}`]?.y ?? 62 + i * 94, title: binding?.source ?? u.binding, subtitle: `Context source · ${binding?.entity === 'subject' ? 'subject' : 'object of the call'}` };
      return { u, node };
    });
    const sourceEdges: LayoutEdge[] = sources.flatMap(({ u, node }) => u.caps.flatMap(x => { const from = nodes.find(n => n.select.type === 'capability' && n.select.id === x.id); return from ? [{ key: `ts-${x.id}-${u.binding}`, select: { type: 'capability' as const, id: x.id }, from, to: node, conditions: 0, mapping: x.attrs.join(', ') || 'trusted attributes' }] : []; }));
    return { ...l, width: l.width + (sources.length ? 150 : 0), nodes: [...nodes, ...sources.map(s => s.node)], kinds: [], edges: [...l.edges.filter(e => e.to.column !== 'resources' && e.from.column !== 'resources'), ...sourceEdges] };
  }, [view, positions]);
  const count = (d: Doc) => d.scopes.length + d.capabilities.length;
  const changes = doc === initialDoc ? 0 : 1;
  // A value of the graph opens the side panel of the tool that maps its argument.
  // from: the panel that opened this one (Identity providers, the agent), for the Back link.
  const [from, setFrom] = useState<Selection>();
  const select = (s: Selection, parent?: Selection) => {
    setFrom(parent);
    if (s.type === 'resource' || (s.type === 'group' && s.group === 'resources')) {
      const r = s.type === 'resource' ? doc.resources.find(x => x.id === s.id) : undefined;
      const [serverId, kind] = r ? [r.serverId, r.kind] : (s as { key: string }).key.split('|');
      const cap = doc.capabilities.find(c => c.serverId === serverId && c.mapping?.kind === kind);
      if (cap) { setSelected({ type: 'capability', id: cap.id }); return; }
    }
    setSelected(s);
  };
  const head = selected ? panelHead(selected, doc) : undefined;
  return <section className="delegation-editor" data-maximized={maximized} aria-label="Agent delegation editor">
    <header className="delegation-toolbar">
      <div className="agent-graph-title"><h3>Delegation and access</h3><button type="button" className="delegation-help" onClick={() => setHelp(true)}><CircleHelp size={16} aria-hidden="true" />How this works</button></div>
    </header>
    <FilterBar filters={filters} onChange={setFilters} shown={count(view)} total={count(doc)} doc={doc} />
    <SectionBar doc={doc} selected={selected} onSelect={select} readOnly={version === 'published'} />
    <div className="delegation-body" data-panel={false}>
      {mode === 'graph' ? <DelegationGraph layout={layout} selected={selected} onSelect={select} onMove={(key, x, y) => setPositions(p => ({ ...p, [key]: { x, y } }))} readOnly={version === 'published'} maximized={maximized} onMaximize={() => setMaximized(v => !v)} />
        : <ListView doc={view} source={doc} selected={selected} onSelect={select} onChange={setDoc} readOnly={version === 'published'} />}
    </div>
    {help ? <GraphHelp onClose={() => setHelp(false)} /> : null}
    <PublishBar config={config} changes={changes} busy={false} onPublish={async () => true} onDiscard={() => { setDoc(initialDoc); setSelected(undefined); }} onHistory={() => undefined} />
    {selected && head ? <SidePanel eyebrow={head.eyebrow} title={head.heading ?? head.title} onClose={() => setSelected(undefined)}>
      {from ? <button type="button" className="rule-switch proto-panel-back" onClick={() => { setSelected(from); setFrom(undefined); }}><ArrowLeft size={14} aria-hidden="true" />Back to {panelHead(from, doc).title}</button> : null}
      <fieldset className="relation-side-panel" disabled={version === 'published'}>
        {(selected.type === 'add' && selected.what === 'resource') || selected.type === 'resource'
          ? <AllowedValuesPanel key={selected.type} agentName={agentName} doc={doc} published={initialDoc} initialTool={selected.type === 'resource' ? (() => { const r = doc.resources.find(x => x.id === selected.id); return doc.capabilities.find(c => r && c.serverId === r.serverId && c.mapping?.kind === r.kind)?.id; })() : undefined} onChange={setDoc} />
          : selected.type === 'add' && selected.what === 'delegator'
          ? <WhoCanDelegatePanel agentName={agentName} doc={doc} onSelect={s => select(s, selected)} add={<AddPanel what="delegator" agentName={agentName} doc={doc} onChange={setDoc} onDone={() => setSelected(undefined)} />} />
          : selected.type === 'add'
          ? <aside className="relation-panel" aria-label="Selected relation"><AddPanel what={selected.what} agentName={agentName} doc={doc} onChange={setDoc} onDone={() => setSelected(undefined)} /></aside>
          : selected.type === 'idp'
          ? <aside className="relation-panel" aria-label="Selected relation"><IdpPanel doc={doc} issuer={selected.issuer} agentName={agentName} onChange={setDoc} onClose={() => setSelected(undefined)} onSelect={setSelected} /></aside>
          : selected.type === 'agent'
          ? <AgentPanel agentName={agentName} reportOnly={agents[0].reportOnly} doc={doc} onSelect={s => select(s, selected)} onView={v => { setSelected(undefined); onView(v); }} />
          : selected.type === 'capability'
          ? <CapabilityPanel key={JSON.stringify(selected)} published={initialDoc} id={selected.id} start={!!selected.addCondition} agentName={agentName} doc={doc} onChange={setDoc} onClose={() => setSelected(undefined)} onContextSources={() => onContextSources(selected.id)} />
          : <RelationPanel key={JSON.stringify(selected)} selected={selected} agentName={agentName} doc={doc} onChange={setDoc} onClose={() => setSelected(undefined)} onSelect={setSelected} onBack={() => undefined} />}
      </fieldset>
    </SidePanel> : null}
  </section>;
}

// Context sources, opened from the Add trusted attributes call to action: the real screen, with a
// context banner on top that returns to the side panel of the relation.
function ContextSourcesFromRelation({ relation, onBack }: { relation: string; onBack: () => void }) {
  const auth = useAuth();
  const tool = initialDoc.capabilities.find(c => c.id === relation)?.tool ?? relation;
  const back = `${agentName} · ${tool}`;
  const scope = auth.session && auth.workspace && auth.environment ? { userId: auth.session.user.id, tenantId: auth.workspace.tenant_id, environmentId: auth.environment.id } : undefined;
  return <>
    <div className="cp-admin-notice proto-context-banner" role="status">
      <div><strong>Adding trusted attributes for {back}</strong><span>Add a binding for {serverName(catalogState.catalog, initialDoc.capabilities.find(c => c.id === relation)?.serverId ?? '')} · {tool}, then go back to the rules of this relation.</span></div>
      <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" onClick={onBack}><ArrowLeft size={15} aria-hidden="true" />Back to {back}</button>
    </div>
    {scope ? <SourcesPage scope={scope} /> : <p role="status">Select a workspace and environment.</p>}
  </>;
}

export function RelationSidePanelPrototype() {
  const [params, setParams] = useSearchParams();
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [tab, setTab] = useState<AgentView>('access');
  const [version, setVersion] = useState<Version>('draft');
  const [mode, setMode] = useState<Mode>('graph');
  const [block, setBlock] = useState<Block>();
  const agent = agents[0];
  const relation = params.get('relation') ?? undefined;
  const sources = params.get('view') === 'context-sources' && relation;
  return <CatalogContext.Provider value={catalogState}>
    <main id="main-content" className="admin-page cp-admin-container access-page" aria-label="Access" tabIndex={-1}>
    <nav className="access-navigation" aria-label="Access">
      <div className="access-navigation-links">{accessNavigation.map(({ path, label, Icon }, i) => { const on = sources ? i === 1 : i === 0; return <a key={path} href="#" className={on ? 'active' : undefined} aria-current={on ? 'page' : undefined} onClick={e => e.preventDefault()}><Icon size={16} aria-hidden="true" />{label}</a>; })}</div>
      <QuickIncident />
    </nav>
    {sources ? <ContextSourcesFromRelation relation={relation} onBack={() => setParams({ relation })} /> : <section aria-label="Permissions">
      <div className="access-page-heading">
        <div><span className="cp-admin-label">ACCESS WORKBENCH</span><h1 className="cp-admin-title">Agents</h1><p className="cp-admin-muted">Choose who can delegate to each agent, the tools it can call and the rules of each call.</p></div>
        <button className="cp-admin-button access-primary-action" type="button"><Plus size={18} aria-hidden="true" />New agent</button>
      </div>
      <div className="access-workbench" data-rail={railCollapsed ? 'collapsed' : undefined}>
        <div className="proto-rail-wrap">
            <button type="button" className="access-rail-toggle proto-rail-toggle" aria-expanded={!railCollapsed} aria-label={railCollapsed ? 'Expand agent list' : 'Collapse agent list'} onClick={() => setRailCollapsed(v => !v)}>{railCollapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}</button>
        <aside className="cp-admin-panel access-agent-rail" aria-label="Agents" data-collapsed={railCollapsed}>
          <div className="access-agent-rail-heading">
            <span className="access-agent-rail-label">Agents</span><span className="access-agent-count" aria-label={`${agents.length} agents`}>{agents.length}</span>
          </div>
          <div className="access-agent-search" hidden={railCollapsed}><Search size={16} aria-hidden="true" /><input className="cp-admin-input" type="search" aria-label="Filter loaded agents" placeholder="Filter loaded agents…" /></div>
          <ul className="access-agent-list" aria-label="Agents">{agents.map((a, i) => <li key={a.name}><button className="access-agent-row" type="button" aria-label={a.name} aria-pressed={i === 0}>
            <span className="agent-visual" aria-hidden="true"><Bot size={20} /></span>
            <span className="access-agent-row-copy"><strong>{a.name}</strong><small>{a.description}</small>{a.reportOnly ? <span className="report-only-tags"><ReportOnlyChip />{a.overdue ? <ReviewOverdueChip /> : null}</span> : null}</span>
            {i === 0 ? <ChevronRight size={15} aria-hidden="true" /> : null}
          </button></li>)}</ul>
        </aside></div>
        <section className="cp-admin-panel access-agent-details" aria-label="Selected agent">
          <div className="access-agent-heading"><span className="agent-visual" aria-hidden="true"><Bot size={20} /></span>
            <div className="agent-detail-copy"><div className="access-agent-title"><h2>{agent.name}</h2><span className="mcp-badge" data-tone="success">Active</span></div><p>{agent.description}</p><p className="cp-admin-muted">Acts for the subjects that delegate to it</p></div>
            <div className="agent-detail-actions">
              <span className="agent-detail-actions-group"><span className="agent-mode-action"><button className="cp-admin-button cp-admin-button--small cp-admin-button--ghost agent-report-only-button" type="button"><Eye size={15} aria-hidden="true" />Report-only</button></span><button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" type="button"><Pencil size={15} aria-hidden="true" />Edit</button></span>
              <span className="agent-detail-actions-group"><button className="cp-admin-button cp-admin-button--small cp-admin-button--danger-soft" type="button"><Power size={15} aria-hidden="true" />Disable agent</button><button className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" type="button"><Trash2 size={15} aria-hidden="true" />Delete</button></span>
            </div>
          </div>
          <div className="proto-views-row">
            <div className="cp-admin-inner-tabs agent-views" role="group" aria-label="Agent view">
              {([['access', 'Delegation and access'], ['identity', 'Identity'], ['sessions', 'Harness sessions']] as [AgentView, string][]).map(([v, label]) => <button key={v} type="button" aria-pressed={tab === v} onClick={() => setTab(v)}>{label}</button>)}
            </div>
            {tab === 'access' ? <div className="delegation-toolbar-actions">
              <Toggle label="View" value={mode} onChange={setMode} options={[['graph', 'Graph', Network], ['list', 'List', List]]} />
              <Toggle label="Version" value={version} onChange={setVersion} options={[['draft', 'Draft'], ['published', 'Published']]} />
            </div> : null}
          </div>
          <div hidden={tab !== 'access'}><Editor key={relation ?? 'none'} open={relation} version={version} mode={mode} block={block} onView={setTab} onContextSources={id => setParams({ view: 'context-sources', relation: id })} /></div>
          <PrototypeQueries>
            <div hidden={tab !== 'identity'}><AgentIdentity scope={protoScope} agentId={protoAgentId} agentName={agentName} disabled={false} /></div>
            {tab === 'sessions' ? <HarnessSessions scope={protoScope} agentId={protoAgentId} agentName={agentName} onBlock={(issuer, subject) => { setBlock(v => ({ id: (v?.id ?? 0) + 1, issuer, subject })); }} /> : null}
          </PrototypeQueries>
        </section>
      </div>
    </section>}
    </main>
  </CatalogContext.Provider>;
}
