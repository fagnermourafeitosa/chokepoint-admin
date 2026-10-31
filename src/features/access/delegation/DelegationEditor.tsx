import { useEffect, useMemo, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { DelegationGraph } from './DelegationGraph';
import { FilterBar, filterDoc, isFiltered, noFilters, type Filters } from './FilterBar';
import { GraphHelp } from './GraphHelp';
import { initialDoc, type Doc } from './fixtures';
import { delegationLayout, type Positions, type Selection } from './layout';
import { ListView } from './ListView';
import { PublishBar, type PublishState } from './PublishBar';
import { RelationPanel } from './RelationPanel';
import { SectionBar } from './SectionBar';
import { WaitingBackend } from './WaitingBackend';
import '../../mcp/mcp.css';
import '../../permissions/permissions.css';
import './delegation.css';

function Toggle<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return <div className="delegation-toggle" role="group" aria-label={label}>{options.map(([v, text]) => <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{text}</button>)}</div>;
}

// Layout prototype of Admin A1: the agent graph as the editor. Fixed data, kept in memory only.
export function DelegationEditor({ agentName, disabled }: { agentName: string; disabled: boolean }) {
  const [draft, setDraft] = useState<Doc>(initialDoc);
  const [back, setBack] = useState<Selection>();
  const [changes, setChanges] = useState(0);
  const [mode, setMode] = useState<'graph' | 'list'>('graph');
  const [version, setVersion] = useState<'draft' | 'published'>('draft');
  const [positions, setPositions] = useState<Positions>({});
  const [maximized, setMaximized] = useState(false);
  const [help, setHelp] = useState(false);
  const [selected, setSelected] = useState<Selection>();
  const [state, setState] = useState<PublishState>('effective');
  const readOnly = version === 'published';
  const doc = readOnly ? initialDoc : draft;
  const [filters, setFilters] = useState<Filters>(noFilters);
  const view = useMemo(() => (isFiltered(filters) ? filterDoc(doc, filters) : doc), [doc, filters]);
  const count = (d: Doc) => d.scopes.length + d.capabilities.length + d.resources.length;
  const layout = useMemo(() => delegationLayout(agentName, view, positions), [agentName, view, positions]);
  const change = (next: Doc) => { setDraft(next); setChanges(n => n + 1); };
  useEffect(() => {
    if (!maximized) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMaximized(false); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [maximized]);
  return <section className="delegation-editor" data-maximized={maximized} aria-label="Agent delegation editor">
    <header className="delegation-toolbar">
      <div className="agent-graph-title"><h3>Delegation and access</h3><button type="button" className="delegation-help" onClick={() => setHelp(true)}><CircleHelp size={16} aria-hidden="true" />How this works</button><WaitingBackend spec="029–033" tip="Shows and edits who can delegate to this agent, what it can call, where it can act, and the rules of each tool." /></div>
      <div className="delegation-toolbar-actions">
        <Toggle label="View" value={mode} onChange={setMode} options={[['graph', 'Graph'], ['list', 'List']]} />
        <Toggle label="Version" value={version} onChange={v => { setVersion(v); setSelected(undefined); }} options={[['draft', 'Draft'], ['published', 'Published']]} />
        {mode === 'graph' && Object.keys(positions).length ? <button type="button" className="rule-switch" onClick={() => setPositions({})}>Reset layout</button> : null}
      </div>
    </header>
    <FilterBar filters={filters} onChange={setFilters} shown={count(view)} total={count(doc)} doc={doc} />
    <SectionBar doc={doc} selected={selected} onSelect={setSelected} readOnly={readOnly} />
    {readOnly ? <p className="delegation-readonly">You see published revision 3, the configuration that applies now. Switch to Draft to edit.</p> : null}
    <div className="delegation-body" data-panel={!!selected}>
      {mode === 'graph'
        ? <DelegationGraph layout={layout} selected={selected} onSelect={setSelected} onMove={(key, x, y) => setPositions(p => ({ ...p, [key]: { x, y } }))} disabled={disabled} readOnly={readOnly} maximized={maximized} onMaximize={() => setMaximized(v => !v)} />
        : <ListView doc={view} source={doc} selected={selected} onSelect={setSelected} onChange={change} readOnly={readOnly} />}
      {selected ? <fieldset className="delegation-panel-frame" disabled={readOnly}><RelationPanel key={JSON.stringify(selected) + version} selected={selected} agentName={agentName} disabled={disabled} doc={doc} onChange={change} onClose={() => { setSelected(undefined); setBack(undefined); }} onSelect={s => { setBack(selected?.type === 'group' ? selected : undefined); setSelected(s); }} back={back} onBack={() => { setSelected(back); setBack(undefined); }} /></fieldset> : null}
    </div>
    {help ? <GraphHelp onClose={() => setHelp(false)} /> : null}
    <PublishBar state={state} onState={setState} changes={changes} onDiscard={() => { setDraft(initialDoc); setChanges(0); setSelected(undefined); }} />
  </section>;
}
