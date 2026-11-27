import { useState } from 'react';
import { Braces, CircleCheck, CircleHelp, History, Pencil, Plus, Search, Settings2, Trash2, User, Wrench } from 'lucide-react';
import '../../../src/features/mcp/mcp.css';
import '../../../src/features/access/delegation/delegation.css';
import { SelectMenu } from '../../../src/components/ui/dropdown/SelectMenu';
import { EditorToggles, type EditorMode, type EditorVersion } from '../../../src/features/access/delegation/DelegationEditor';
import { AccessFrame } from './AccessFrame';
import { agent, published, scenarios, total, type Kind, type Row } from './data';
import { GraphView } from './GraphView';
import { HistoryPanel } from './HistoryPanel';
import { PublishDialog } from './PublishDialog';
import { ReviewPanel } from './ReviewPanel';
import './prototype.css';

// Admin 064 prototype: the whole Access page with refunds-assistant open on Delegation and access,
// List view, with a draft. Each changed row is marked in the draft, Review & publish opens the review
// panel, and History lists the draft first, with Publish that opens a short confirmation. Today draws the same data as the Admin of today. The scenario
// and screen switches belong to the prototype only; the
// Graph view marks boxes and relations too. Nothing is saved.
const badge: Record<Kind, { tone: string; text: string }> = {
  added: { tone: 'success', text: 'Added' },
  removed: { tone: 'danger', text: 'Removed' },
  changed: { tone: 'warning', text: 'Changed' },
};

// The table of ListView (Who can delegate, Servers and tools) with the change marks of Admin 064.
// today: the Admin of today draws only the state of the version, with no mark and no removed row.
function Section({ title, columns, rows, draft, today }: { title: string; columns: string[]; rows: Row[]; draft: boolean; today: boolean }) {
  const shown = draft ? rows.filter(r => !today || r.kind !== 'removed') : rows.filter(r => r.kind !== 'added');
  const marked = draft && !today;
  return <section className="delegation-list-section"><h4>{title} <span>{shown.filter(r => !marked || r.kind !== 'removed').length}</span></h4>
    {shown.length ? <table className="delegation-list-table"><thead><tr>{columns.map(c => <th key={c} scope="col">{c}</th>)}<th scope="col">Expires</th><th scope="col">Rules</th><th scope="col" aria-label="Actions" /></tr></thead>
      <tbody>{shown.map(r => <tr key={r.label} data-change={marked ? r.kind : undefined}>
        {r.cells.map((c, j) => <td key={j}>{j === 0 ? <span className="rr-cell"><button type="button" className="delegation-list-open">{c}</button>{marked && r.kind ? <span className="mcp-badge" data-tone={badge[r.kind].tone}>{badge[r.kind].text}</span> : null}</span> : c}</td>)}
        <td>—</td>
        <td>{r.rules ? <span className="delegation-list-icon"><Braces size={13} aria-hidden="true" />{r.rules}</span> : '—'}</td>
        <td><div className="delegation-list-actions">
          <button type="button" className="relation-icon-button" aria-label={`Open ${r.label}`}><Pencil size={14} /></button>
          {draft && r.kind !== 'removed' ? <><button type="button" className="relation-icon-button" aria-label={`Add rule to ${r.label}`}><Plus size={14} /></button><button type="button" className="relation-icon-button" aria-label={`Remove ${r.label}`}><Trash2 size={14} /></button></> : null}
        </div></td>
      </tr>)}</tbody></table> : <p className="cp-admin-muted">None.</p>}
  </section>;
}

export function RevisionReviewPrototype() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [mode, setMode] = useState<EditorMode>('graph');
  const [version, setVersion] = useState<EditorVersion>('draft');
  const [hasDraft, setHasDraft] = useState(true);
  const [panel, setPanel] = useState<'review' | 'history' | undefined>();
  // Publish in the history: a short confirmation over the history panel.
  const [confirming, setConfirming] = useState(false);
  // today: the same data in the Admin of today; Proposed: the changes of Admin 064.
  const [today, setToday] = useState(false);
  // The review step of today: the publication bar asks inline, with a note (PublishBar).
  const [inline, setInline] = useState(false);
  const [note, setNote] = useState('');
  const scenario = scenarios.find(s => s.id === scenarioId)!;
  const draft = version === 'draft' && hasDraft;
  const n = hasDraft ? total(scenario.changes) : 0;
  const effective = hasDraft ? agent.effective : agent.effective + 2;
  const counts = draft ? scenario : published;
  const tools = scenario.tools.filter(r => (draft ? r.kind !== 'removed' : r.kind !== 'added')).length;
  const pick = (id: string) => { setScenarioId(id); setHasDraft(true); setVersion('draft'); setInline(false); setPanel(undefined); setConfirming(false); };
  const screen = (t: boolean) => { setToday(t); pick(scenarioId); };

  return <>
    <div className="rr-scenario cp-admin-container">
      <span className="cp-admin-label">Prototype scenario</span>
      <div className="cp-admin-segmented" role="radiogroup" aria-label="Prototype scenario">
        {scenarios.map(s => <label key={s.id} className="cp-admin-segment"><input type="radio" name="rr-scenario" checked={s.id === scenarioId} onChange={() => pick(s.id)} /><span>{s.name}</span></label>)}
      </div>
      <div className="cp-admin-segmented" role="radiogroup" aria-label="Screen">
        <label className="cp-admin-segment"><input type="radio" name="rr-screen" checked={today} onChange={() => screen(true)} /><span>Today</span></label>
        <label className="cp-admin-segment"><input type="radio" name="rr-screen" checked={!today} onChange={() => screen(false)} /><span>Proposed</span></label>
      </div>
    </div>
    <AccessFrame toggles={<EditorToggles mode={mode} version={version} onMode={setMode} onVersion={setVersion} />}>
      <section className="delegation-editor" aria-label="Agent delegation editor">
        <header className="delegation-toolbar">
          <div className="agent-graph-title"><h3>Delegation and access</h3><button type="button" className="delegation-help"><CircleHelp size={16} aria-hidden="true" />How this works</button></div>
        </header>
        <div className="delegation-filters" role="search" aria-label="Filter relations">
          <label className="group-search delegation-filter-text"><Search size={15} aria-hidden="true" /><input className="cp-admin-input" type="search" placeholder="Filter by identity provider, subject or tool" aria-label="Filter text" /></label>
          <SelectMenu label="Server" value="" onChange={() => undefined} options={[{ value: '', label: 'All servers' }, { value: 'billing', label: 'Acme Billing' }]} />
          <SelectMenu label="Tool" value="" onChange={() => undefined} options={[{ value: '', label: 'All tools' }]} />
          <label className="delegation-filter-check"><input type="checkbox" /> With rules</label>
        </div>
        <div className="delegation-sections" role="group" aria-label="Agent sections">
          <div className="delegation-section"><span className="section-count" aria-label={`Subjects who delegate: ${counts.subjects}`}><User size={16} aria-hidden="true" /><strong>{counts.subjects}</strong></span>
            {version === 'draft' ? <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small"><Settings2 size={14} aria-hidden="true" />Manage identity providers<span className="button-count">{counts.providers}</span></button> : null}</div>
          <div className="delegation-section"><span className="section-count" aria-label={`Servers and tools: ${tools}`}><Wrench size={16} aria-hidden="true" /><strong>{tools}</strong></span>
            {version === 'draft' ? <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small"><Settings2 size={14} aria-hidden="true" />Manage tools</button> : null}</div>
        </div>
        {version === 'published' ? <p className="delegation-readonly">You see published revision {effective}. Switch to Draft to edit.</p> : null}
        <div className="delegation-body" data-panel={false}>
          {mode === 'graph' ? <GraphView delegators={scenario.delegators} tools={scenario.tools} draft={draft} marked={!today} /> : <div className="delegation-list">
            <Section title="Who can delegate" columns={['Identity provider', 'Who', 'Kinds', 'Consent']} rows={scenario.delegators} draft={draft} today={today} />
            <Section title="Servers and tools" columns={['Tool', 'Server']} rows={scenario.tools} draft={draft} today={today} />
          </div>}
        </div>
        <div className="delegation-publish" role="region" aria-label="Publication">
          <div className="delegation-publish-state">
            <span>{n ? <><strong>Draft</strong> · {n} unpublished {n === 1 ? 'change' : 'changes'}</> : 'No unpublished changes'}</span>
            <span className="delegation-publish-sep" aria-hidden="true" />
            <span className="mcp-badge" data-tone="success"><CircleCheck size={13} aria-hidden="true" /> Revision {effective} effective</span>
            <button type="button" className="delegation-publish-author" onClick={() => setPanel('history')}>by <strong>Beatriz Nunes</strong> · Nov 12, 14:06 UTC · <em>“Harness login for Finance”</em></button>
            <button type="button" className="rule-switch" onClick={() => setPanel('history')}><History size={14} aria-hidden="true" />History</button>
          </div>
          <div className="delegation-publish-actions">
            {inline ? <>
              <label className="delegation-publish-note"><span className="cp-admin-muted">Publish {n} {n === 1 ? 'change' : 'changes'}? New calls use them once OpenFGA confirms.</span><input className="cp-admin-input" maxLength={500} placeholder="Why this change? (optional)" value={note} onChange={e => setNote(e.target.value)} /></label>
              <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" onClick={() => setInline(false)}>Back</button>
              <button type="button" className="cp-admin-button cp-admin-button--small" onClick={() => { setInline(false); setNote(''); setHasDraft(false); }}>Publish</button>
            </> : <>
              <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={!n} onClick={() => setHasDraft(false)}>Discard draft</button>
              <button type="button" className="cp-admin-button cp-admin-button--small" disabled={!n} onClick={() => (today ? setInline(true) : setPanel('review'))}>Review &amp; publish</button>
            </>}
          </div>
        </div>
      </section>
    </AccessFrame>
    {panel === 'review' ? <ReviewPanel scenario={scenario} onClose={() => setPanel(undefined)} onPublished={() => { setPanel(undefined); setHasDraft(false); }} /> : null}
    {panel === 'history' ? <HistoryPanel scenario={scenario} hasDraft={hasDraft && !today} today={today} onClose={() => setPanel(undefined)} onPublish={() => setConfirming(true)} /> : null}
    {confirming ? <PublishDialog scenario={scenario} onClose={() => setConfirming(false)} onPublished={() => { setConfirming(false); setPanel(undefined); setHasDraft(false); }} /> : null}
  </>;
}
