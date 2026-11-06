import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Bot, CircleHelp, List, Network, Server, Wrench, type LucideIcon } from 'lucide-react';
import { SidePanel } from '../../../components/ui/side-panel/SidePanel';
import { Tooltip } from '../../../components/ui/tooltip/Tooltip';
import type { AgentScope } from '../agent-api';
import type { AccessTarget } from '../target-context';
import { delegationKey, permissionApi } from './api';
import { CatalogProvider, useCatalog } from './catalog';
import { AddPanel } from './AddPanel';
import { AgentPanel, type AgentView } from './AgentPanel';
import { DelegationGraph } from './DelegationGraph';
import { FilterBar, filterDoc, isFiltered, noFilters, type Filters } from './FilterBar';
import { GraphHelp } from './GraphHelp';
import { GroupPanel } from './GroupPanel';
import { IdentityProvidersPanel } from './IdentityProvidersPanel';
import { IdpPanel } from './IdpPanel';
import { capabilityId, harnessWithoutGroups, idpName, serverName, type Catalog, type Doc } from './model';
import { delegationLayout, type LayoutEdge, type LayoutNode, type Positions, type Selection } from './layout';
import { ListView } from './ListView';
import { PublishBar } from './PublishBar';
import { RevisionHistory } from './RevisionHistory';
import { SectionBar } from './SectionBar';
import { ToolPanel } from './ToolPanel';
import { useDelegation } from './useDelegation';
import '../../mcp/mcp.css';
import './delegation.css';

export type EditorMode = 'graph' | 'list';
export type EditorVersion = 'draft' | 'published';

function Toggle<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string, LucideIcon?][]; onChange: (v: T) => void }) {
  return <div className="delegation-toggle" role="group" aria-label={label}>{options.map(([v, text, Icon]) => Icon
    ? <Tooltip key={v} content={text}><button type="button" className="toggle-icon" aria-label={text} aria-pressed={value === v} onClick={() => onChange(v)}><Icon size={16} aria-hidden="true" /></button></Tooltip>
    : <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{text}</button>)}</div>;
}

// The Graph / List and Draft / Published toggles, on the row of the agent views (Admin 048).
export function EditorToggles({ mode, version, onMode, onVersion }: { mode: EditorMode; version: EditorVersion; onMode: (m: EditorMode) => void; onVersion: (v: EditorVersion) => void }) {
  return <div className="delegation-toolbar-actions">
    <Toggle label="View" value={mode} onChange={onMode} options={[['graph', 'Graph', Network], ['list', 'List', List]]} />
    <Toggle label="Version" value={version} onChange={onVersion} options={[['draft', 'Draft'], ['published', 'Published']]} />
  </div>;
}

// A block asked from the Harness sessions view (Admin 036 section 3, point 5). The editor adds it to
// its local draft, so unsaved edits are kept; id changes for each request.
export type BlockRequest = { id: number; issuer: string; subject: string };
type Props = { scope: AgentScope; agentId: string; agentName: string; reportOnly: boolean; mode: EditorMode; version: EditorVersion; onView: (v: AgentView) => void; target?: AccessTarget; block?: BlockRequest };

// Delegation and access (Admin 026, 048): the agent graph as the editor; the editor of the selected
// node or edge opens in the side panel. The catalog loads the directories of the identity providers.
export function DelegationEditor(props: Props) {
  const query = useQuery({ queryKey: delegationKey(props.scope, props.agentId), queryFn: ({ signal }) => permissionApi.get(props.scope, props.agentId, signal), retry: false, refetchInterval: q => (q.state.data?.reconciliation.state === 'pending' ? 5000 : false) });
  const saved = query.data?.draft ?? query.data?.published;
  const issuers = useMemo(() => [...new Set([...(saved?.scopes ?? []), ...(query.data?.published?.scopes ?? [])].map(s => s.identity_connection_id))], [saved, query.data?.published]);
  return <CatalogProvider scope={props.scope} issuers={issuers}><Editor {...props} /></CatalogProvider>;
}

// targetSelection opens the place of a fix from Investigate (Admin 030): the
// identity provider of a subject, the tool of a capability, or the panel that
// adds a tool the agent does not have yet.
function targetSelection(target: AccessTarget | undefined, doc: Doc): Selection | undefined {
  if (!target) return undefined;
  if (target.section === 'people') return target.connectionId ? { type: 'idp', issuer: target.connectionId } : { type: 'add', what: 'delegator' };
  if (!target.serverId || !target.tool) return undefined;
  const id = capabilityId(target.serverId, target.tool);
  if (doc.capabilities.some(c => c.id === id)) return { type: 'capability', id };
  return target.section === 'grants' ? { type: 'add', what: 'tool' } : undefined;
}

// title names the panel (Back links); heading, when set, is what the panel header shows.
function panelHead(selected: Selection, doc: Doc, catalog: Catalog, agentName: string): { eyebrow?: string; title: string; heading?: ReactNode } {
  if (selected.type === 'capability') {
    const c = doc.capabilities.find(x => x.id === selected.id);
    if (!c) return { title: 'Tool' };
    return { title: c.tool, heading: <span className="panel-path"><span><Bot size={16} aria-hidden="true" />{agentName}</span><ArrowRight size={14} aria-label="calls on" /><span><Server size={16} aria-hidden="true" />{serverName(catalog, c.serverId)}</span><span className="panel-path-tool"><Wrench size={16} aria-hidden="true" /><code>{c.tool}</code></span></span> };
  }
  if (selected.type === 'add') return selected.what === 'delegator' ? { eyebrow: `Who can delegate to ${agentName}`, title: 'Identity providers' } : { eyebrow: agentName, title: 'Manage tools' };
  if (selected.type === 'idp') return { eyebrow: `Who can delegate to ${agentName}`, title: idpName(catalog, selected.issuer) };
  if (selected.type === 'group') return { eyebrow: agentName, title: selected.label };
  return { eyebrow: 'Agent', title: agentName };
}

// The graph of Admin 048: no allowed values; a tool shows its rule count, and a rule that reads
// trusted attributes draws an edge from its tool to the context source, labelled with what it reads.
function rulesLayout(agentName: string, view: Doc, catalog: Catalog, positions: Positions) {
  const plain = { ...view, resources: [], capabilities: view.capabilities.map(c => ({ ...c, mapping: undefined })) };
  const l = delegationLayout(agentName, plain, catalog, positions);
  const rules = (id: string) => view.capabilities.find(c => c.id === id)?.conditions.length ?? 0;
  const nodes = l.nodes.filter(n => n.column !== 'resources').map(n => (n.column === 'tools' && n.select.type === 'capability' ? { ...n, subtitle: (k => (k ? `${k} ${k === 1 ? 'rule' : 'rules'}` : 'No rules'))(rules(n.select.id)) } : n));
  const used = new Map<string, { id: string; attrs: string[] }[]>();
  for (const c of view.capabilities) for (const k of c.conditions) for (const b of k.bindings) {
    const id = b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const attrs = [...k.expression.matchAll(new RegExp(`chokepoint\\["${id}"\\]\\.values\\["([^"]+)"\\]`, 'g'))].map(m => m[1]);
    const caps = used.get(b) ?? [];
    const cap = caps.find(x => x.id === c.id) ?? (caps.push({ id: c.id, attrs: [] }), caps[caps.length - 1]);
    cap.attrs = [...new Set([...cap.attrs, ...attrs])];
    used.set(b, caps);
  }
  const sources = [...used.entries()].map(([binding, caps], i) => {
    const cap = view.capabilities.find(c => c.id === caps[0].id)!;
    const found = catalog.bindings(cap.serverId, cap.tool).find(x => x.id === binding);
    const key = `cs-${binding}`;
    const node: LayoutNode = { key, select: { type: 'capability', id: cap.id }, column: 'resources', x: positions[key]?.x ?? l.colX.resources + 150, y: positions[key]?.y ?? 62 + i * 94, title: found?.source ?? binding, subtitle: `Context source · ${found?.entity === 'subject' ? 'subject' : 'object of the call'}` };
    return { binding, caps, node };
  });
  const edges: LayoutEdge[] = sources.flatMap(({ binding, caps, node }) => caps.flatMap(x => {
    const from = nodes.find(n => n.select.type === 'capability' && n.select.id === x.id);
    return from ? [{ key: `ts-${x.id}-${binding}`, select: { type: 'capability' as const, id: x.id }, from, to: node, conditions: 0, mapping: x.attrs.join(', ') || 'trusted attributes' }] : [];
  }));
  return { ...l, width: l.width + (sources.length ? 150 : 0), nodes: [...nodes, ...sources.map(s => s.node)], kinds: [], edges: [...l.edges.filter(e => e.to.column !== 'resources' && e.from.column !== 'resources'), ...edges] };
}

function Editor({ scope, agentId, agentName, reportOnly, mode, version, onView, target, block }: Props) {
  const { catalog, loading, error, retry } = useCatalog();
  const state = useDelegation(scope, agentId, catalog);
  const navigate = useNavigate();
  // from: the panel that opened this one (the Identity providers list, the agent, a group), for Back.
  const [from, setFrom] = useState<Selection>();
  const [positions, setPositions] = useState<Positions>({});
  const [maximized, setMaximized] = useState(false);
  const [help, setHelp] = useState(false);
  const [history, setHistory] = useState(false);
  const [selected, setSelected] = useState<Selection | undefined>(() => targetSelection(target, state.draft));
  const [filters, setFilters] = useState<Filters>(noFilters);
  const readOnly = version === 'published';
  const doc: Doc = readOnly ? state.published : state.draft;
  const view = useMemo(() => (isFiltered(filters) ? filterDoc(doc, filters, catalog) : doc), [doc, filters, catalog]);
  const count = (d: Doc) => d.scopes.length + d.capabilities.length;
  const layout = useMemo(() => rulesLayout(agentName, view, catalog, positions), [agentName, view, catalog, positions]);
  const select = (s: Selection, parent?: Selection) => { setFrom(parent); setSelected(s); };
  const close = () => { setSelected(undefined); setFrom(undefined); };
  // A version switch closes the panel; the first run is skipped, so a panel opened by a URL target stays.
  const firstVersion = useRef(true);
  useEffect(() => { if (firstVersion.current) { firstVersion.current = false; return; } close(); }, [version]);
  useEffect(() => { const next = targetSelection(target, state.draft); if (next) setSelected(next); }, [target?.serverId, target?.tool, target?.section, target?.connectionId, !!state.config]);
  // Open the rule shows the rule: scroll once to the rules field (a condition) of the open panel (Admin 045).
  const panel = useRef<HTMLFieldSetElement>(null);
  const scrolled = useRef<string | undefined>(undefined);
  const targetKey = target ? JSON.stringify(target) : undefined;
  useEffect(() => {
    if (!targetKey || !selected || !state.config || scrolled.current === targetKey || !panel.current) return;
    scrolled.current = targetKey;
    const node = target?.section === 'policies' && panel.current.querySelector('[data-field="rules"]');
    if (node) node.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [targetKey, selected, state.config]);
  const appliedBlock = useRef(0);
  useEffect(() => {
    if (!block || !state.config || appliedBlock.current === block.id) return;
    appliedBlock.current = block.id;
    const draft = state.draft;
    if (draft.blocked.some(b => b.issuer === block.issuer && b.subject === block.subject)) return;
    state.edit({ ...draft, blocked: [...draft.blocked, { issuer: block.issuer, subject: block.subject, reason: 'Blocked by administrator' }], delegations: draft.delegations.filter(d => !(d.issuer === block.issuer && d.subject === block.subject)) });
  }, [block, state]);
  useEffect(() => {
    if (!maximized) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMaximized(false); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [maximized]);
  if (state.query.isError || error) return <div role="alert" className="cp-admin-notice" data-tone="danger">Could not load the delegation and access of this agent. <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => { void state.reload(); retry(); }}>Retry</button></div>;
  if (!state.config || loading) return <p role="status" className="cp-admin-muted">Loading delegation and access…</p>;
  const head = selected ? panelHead(selected, doc, catalog, agentName) : undefined;
  // Add trusted attributes leaves for Context sources with the tool, so that its page can return here.
  const toContextSources = (id: string) => {
    const c = doc.capabilities.find(x => x.id === id);
    if (!c) return;
    navigate(`/access/context-sources?${new URLSearchParams({ agent_id: agentId, agent_name: agentName, server_id: c.serverId, tool: c.tool })}`);
  };
  return <section className="delegation-editor" data-maximized={maximized} aria-label="Agent delegation editor">
    <header className="delegation-toolbar">
      <div className="agent-graph-title"><h3>Delegation and access</h3><button type="button" className="delegation-help" onClick={() => setHelp(true)}><CircleHelp size={16} aria-hidden="true" />How this works</button></div>
      {mode === 'graph' && Object.keys(positions).length ? <div className="delegation-toolbar-actions"><button type="button" className="rule-switch" onClick={() => setPositions({})}>Reset layout</button></div> : null}
    </header>
    <FilterBar filters={filters} onChange={setFilters} shown={count(view)} total={count(doc)} doc={doc} />
    <SectionBar doc={doc} selected={selected} onSelect={s => select(s)} readOnly={readOnly} />
    {readOnly ? <p className="delegation-readonly">{state.config.published_revision ? `You see published revision ${state.config.published_revision}. Switch to Draft to edit.` : 'Nothing is published yet. Switch to Draft to edit.'}</p> : null}
    {state.error ? <div role="alert" className="cp-admin-notice" data-tone="danger">{state.error}{state.conflict ? <button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={state.busy} onClick={() => void state.reload()}>Reload</button> : null}</div> : null}
    <div className="delegation-body" data-panel={false}>
      {mode === 'graph'
        ? <DelegationGraph layout={layout} selected={selected} onSelect={s => select(s)} onMove={(key, x, y) => setPositions(p => ({ ...p, [key]: { x, y } }))} readOnly={readOnly} maximized={maximized} onMaximize={() => setMaximized(v => !v)} />
        : <ListView doc={view} source={doc} selected={selected} onSelect={s => select(s)} onChange={state.edit} readOnly={readOnly} />}
    </div>
    {help ? <GraphHelp onClose={() => setHelp(false)} /> : null}
    <PublishBar config={state.config} changes={state.changes} busy={state.busy} blocker={harnessWithoutGroups(state.draft) ? 'Harness login is on without a group. Choose at least one group, or turn it off.' : undefined} onPublish={state.publish} onDiscard={() => { void state.discard(); close(); }} onHistory={() => setHistory(true)} />
    {history ? <RevisionHistory scope={scope} agentId={agentId} agentName={agentName} onClose={() => setHistory(false)} /> : null}
    {selected && head ? <SidePanel eyebrow={head.eyebrow} title={head.heading ?? head.title} onClose={close}>
      {from ? <button type="button" className="rule-switch panel-back" onClick={() => { setSelected(from); setFrom(undefined); }}><ArrowLeft size={14} aria-hidden="true" />Back to {panelHead(from, doc, catalog, agentName).title}</button> : null}
      <fieldset ref={panel} key={JSON.stringify(selected) + version} className="relation-side-panel" disabled={readOnly || state.busy}>
        {selected.type === 'capability'
          ? <ToolPanel published={state.published} id={selected.id} start={!!selected.addCondition} agentName={agentName} doc={doc} onChange={state.edit} onClose={close} onContextSources={() => toContextSources(selected.id)} />
          : selected.type === 'agent'
          ? <AgentPanel agentName={agentName} reportOnly={reportOnly} doc={doc} onSelect={s => select(s, selected)} onView={v => { close(); onView(v); }} />
          : selected.type === 'add' && selected.what === 'delegator'
          ? <IdentityProvidersPanel agentName={agentName} doc={doc} onSelect={s => select(s, selected)} add={<AddPanel what="delegator" agentName={agentName} doc={doc} onChange={state.edit} onDone={close} />} />
          : selected.type === 'add'
          ? <aside className="relation-panel" aria-label="Selected relation"><AddPanel what={selected.what} agentName={agentName} doc={doc} onChange={state.edit} onDone={close} /></aside>
          : selected.type === 'idp'
          ? <aside className="relation-panel" aria-label="Selected relation"><IdpPanel doc={doc} issuer={selected.issuer} agentName={agentName} onChange={state.edit} onClose={close} onSelect={s => select(s, selected)} /></aside>
          : selected.type === 'group'
          ? <aside className="relation-panel" aria-label="Selected relation"><GroupPanel doc={doc} group={selected.group} groupKey={selected.key} label={selected.label} onSelect={s => select(s, selected)} /></aside>
          : null}
      </fieldset>
    </SidePanel> : null}
  </section>;
}
