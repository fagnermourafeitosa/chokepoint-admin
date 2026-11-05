import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CircleHelp } from 'lucide-react';
import type { AgentScope } from '../agent-api';
import type { AccessTarget } from '../target-context';
import { delegationKey, permissionApi } from './api';
import { CatalogProvider, useCatalog } from './catalog';
import { DelegationGraph } from './DelegationGraph';
import { FilterBar, filterDoc, isFiltered, noFilters, type Filters } from './FilterBar';
import { GraphHelp } from './GraphHelp';
import { capabilityId, type Doc } from './model';
import { delegationLayout, type Positions, type Selection } from './layout';
import { ListView } from './ListView';
import { PublishBar } from './PublishBar';
import { RelationPanel } from './RelationPanel';
import { RevisionHistory } from './RevisionHistory';
import { SectionBar } from './SectionBar';
import { useDelegation } from './useDelegation';
import '../../mcp/mcp.css';
import './delegation.css';

function Toggle<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return <div className="delegation-toggle" role="group" aria-label={label}>{options.map(([v, text]) => <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{text}</button>)}</div>;
}

type Props = { scope: AgentScope; agentId: string; agentName: string; target?: AccessTarget };

// Delegation and access (Admin 026): the agent graph as the editor. The catalog loads the
// directories of the identity providers in the saved document.
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

function Editor({ scope, agentId, agentName, target }: Props) {
  const { catalog, loading, error, retry } = useCatalog();
  const state = useDelegation(scope, agentId, catalog);
  const [back, setBack] = useState<Selection>();
  const [mode, setMode] = useState<'graph' | 'list'>('graph');
  const [version, setVersion] = useState<'draft' | 'published'>('draft');
  const [positions, setPositions] = useState<Positions>({});
  const [maximized, setMaximized] = useState(false);
  const [help, setHelp] = useState(false);
  const [history, setHistory] = useState(false);
  const [selected, setSelected] = useState<Selection | undefined>(() => targetSelection(target, state.draft));
  const [filters, setFilters] = useState<Filters>(noFilters);
  const readOnly = version === 'published';
  const doc: Doc = readOnly ? state.published : state.draft;
  const view = useMemo(() => (isFiltered(filters) ? filterDoc(doc, filters, catalog) : doc), [doc, filters, catalog]);
  const count = (d: Doc) => d.scopes.length + d.capabilities.length + d.resources.length;
  const layout = useMemo(() => delegationLayout(agentName, view, catalog, positions), [agentName, view, catalog, positions]);
  useEffect(() => { const next = targetSelection(target, state.draft); if (next) setSelected(next); }, [target?.serverId, target?.tool, target?.section, target?.connectionId, !!state.config]);
  useEffect(() => {
    if (!maximized) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMaximized(false); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [maximized]);
  if (state.query.isError || error) return <div role="alert" className="cp-admin-notice" data-tone="danger">Could not load the delegation and access of this agent. <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => { void state.reload(); retry(); }}>Retry</button></div>;
  if (!state.config || loading) return <p role="status" className="cp-admin-muted">Loading delegation and access…</p>;
  return <section className="delegation-editor" data-maximized={maximized} aria-label="Agent delegation editor">
    <header className="delegation-toolbar">
      <div className="agent-graph-title"><h3>Delegation and access</h3><button type="button" className="delegation-help" onClick={() => setHelp(true)}><CircleHelp size={16} aria-hidden="true" />How this works</button></div>
      <div className="delegation-toolbar-actions">
        <Toggle label="View" value={mode} onChange={setMode} options={[['graph', 'Graph'], ['list', 'List']]} />
        <Toggle label="Version" value={version} onChange={v => { setVersion(v); setSelected(undefined); }} options={[['draft', 'Draft'], ['published', 'Published']]} />
        {mode === 'graph' && Object.keys(positions).length ? <button type="button" className="rule-switch" onClick={() => setPositions({})}>Reset layout</button> : null}
      </div>
    </header>
    <FilterBar filters={filters} onChange={setFilters} shown={count(view)} total={count(doc)} doc={doc} />
    <SectionBar doc={doc} selected={selected} onSelect={setSelected} readOnly={readOnly} />
    {readOnly ? <p className="delegation-readonly">{state.config.published_revision ? `You see published revision ${state.config.published_revision}. Switch to Draft to edit.` : 'Nothing is published yet. Switch to Draft to edit.'}</p> : null}
    {state.error ? <div role="alert" className="cp-admin-notice" data-tone="danger">{state.error}{state.conflict ? <button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={state.busy} onClick={() => void state.reload()}>Reload</button> : null}</div> : null}
    <div className="delegation-body" data-panel={!!selected}>
      {mode === 'graph'
        ? <DelegationGraph layout={layout} selected={selected} onSelect={setSelected} onMove={(key, x, y) => setPositions(p => ({ ...p, [key]: { x, y } }))} readOnly={readOnly} maximized={maximized} onMaximize={() => setMaximized(v => !v)} />
        : <ListView doc={view} source={doc} selected={selected} onSelect={setSelected} onChange={state.edit} readOnly={readOnly} />}
      {selected ? <fieldset className="delegation-panel-frame" disabled={readOnly || state.busy}><RelationPanel key={JSON.stringify(selected) + version} selected={selected} agentName={agentName} doc={doc} onChange={state.edit} onClose={() => { setSelected(undefined); setBack(undefined); }} onSelect={s => { setBack(selected?.type === 'group' ? selected : undefined); setSelected(s); }} back={back} onBack={() => { setSelected(back); setBack(undefined); }} /></fieldset> : null}
    </div>
    {help ? <GraphHelp onClose={() => setHelp(false)} /> : null}
    <PublishBar config={state.config} changes={state.changes} busy={state.busy} onPublish={state.publish} onDiscard={() => { void state.discard(); setSelected(undefined); }} onHistory={() => setHistory(true)} />
    {history ? <RevisionHistory agentName={agentName} onClose={() => setHistory(false)} /> : null}
  </section>;
}
