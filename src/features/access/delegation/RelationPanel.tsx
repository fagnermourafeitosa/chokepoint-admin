import { useState, type ReactNode } from 'react';
import { Braces, Clock, Plus, Trash2, X } from 'lucide-react';
import { servers, type Condition, type Doc } from './fixtures';
import type { Selection } from './layout';
import { AddPanel } from './AddPanel';
import { GroupPanel } from './GroupPanel';
import { IdpPanel } from './IdpPanel';
import { ConditionEditor } from './ConditionEditor';
import { WaitingBackend } from './WaitingBackend';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="relation-field"><span>{label}</span><div>{children}</div></div>;
}

function Expiration({ value, onChange }: { value?: string; onChange: (v?: string) => void }) {
  return <Field label="Expires"><input className="cp-admin-input" type="date" value={value ?? ''} onChange={e => onChange(e.target.value || undefined)} aria-label="Expiration date" /><small className="cp-admin-muted">{value ? 'The relation ends on this date. Stored with the relation.' : 'No expiration.'}</small></Field>;
}

function Conditions({ items, onRemove }: { items: Condition[]; onRemove: (id: string) => void }) {
  return <div className="relation-conditions">{items.length ? items.map(c => <article key={c.id} className="relation-condition"><header><Braces size={14} aria-hidden="true" /><strong>{c.name}</strong><button type="button" className="relation-icon-button" aria-label={`Remove ${c.name}`} onClick={() => onRemove(c.id)}><Trash2 size={14} /></button></header><details className="rule-cel"><summary>CEL</summary><code>{c.expression}</code></details><small>Needs: {c.bindings.length ? c.bindings.join(', ') : 'only call arguments'}</small></article>) : <p className="cp-admin-muted">No call conditions on this relation.</p>}</div>;
}

// One "Add condition" entry. The kind decides where the backend stores it.
function AddCondition({ tool, expiration, cel, start, onExpiration, onRule }: { tool: string; expiration: boolean; cel: boolean; start: boolean; onExpiration: () => void; onRule: (c: Condition) => void }) {
  const [step, setStep] = useState<'closed' | 'choose' | 'rule'>(start ? 'choose' : 'closed');
  if (step === 'rule') return <ConditionEditor tool={tool} onCancel={() => setStep('closed')} onSave={c => { onRule(c); setStep('closed'); }} />;
  if (step === 'closed') return <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small relation-add-button" onClick={() => setStep('choose')}><Plus size={14} aria-hidden="true" />Add condition</button>;
  return <div className="relation-add" role="group" aria-label="Condition kind">
    <button type="button" disabled={!expiration} onClick={() => { onExpiration(); setStep('closed'); }}><Clock size={16} aria-hidden="true" /><span><strong>Expiration</strong><small>{expiration ? 'The relation ends on a date. Stored with the relation.' : 'Already set, or not available on this relation.'}</small></span></button>
    <button type="button" disabled={!cel} onClick={() => setStep('rule')}><Braces size={16} aria-hidden="true" /><span><strong>Rule on call data</strong><small>{cel ? 'CEL on call arguments and trusted attributes. Checked on each call.' : 'A rule can not target one person. Add it to a tool or a resource.'}</small></span></button>
    <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => setStep('closed')}>Cancel</button>
  </div>;
}

const inAMonth = () => new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);

type PanelProps = { selected: Selection; onClose: () => void; agentName: string; disabled: boolean; doc: Doc; onChange: (d: Doc) => void; onSelect: (s: Selection) => void; back?: Selection; onBack: () => void };

export function RelationPanel({ selected, onClose, agentName, disabled, doc, onChange, onSelect, back, onBack }: PanelProps) {
  let head: ReactNode = null, body: ReactNode = null;
  const header = (kind: string, title: string, relation?: string) => <header><div><small>{kind}</small><h4>{title}</h4>{relation ? <p className="cp-admin-muted">{relation}</p> : null}</div></header>;
  const start = 'addCondition' in selected && !!selected.addCondition;
  if (selected.type === 'add') {
    body = <AddPanel what={selected.what} agentName={agentName} doc={doc} onChange={onChange} onDone={onClose} />;
  } else if (selected.type === 'idp') {
    body = <IdpPanel doc={doc} issuer={selected.issuer} agentName={agentName} onChange={onChange} onClose={onClose} onSelect={onSelect} />;
  } else if (selected.type === 'group') {
    body = <GroupPanel doc={doc} group={selected.group} groupKey={selected.key} label={selected.label} onSelect={onSelect} />;
  } else if (selected.type === 'agent') {
    head = header('Node', agentName, 'Agent');
    body = <><Field label="Status">{disabled ? 'Disabled. No new tokens; the next call is rejected.' : 'Active'}</Field><Field label="Rules">Rules belong to this agent, never to one person.</Field></>;
  } else if (selected.type === 'delegation') {
    const d = doc.delegations.find(x => x.id === selected.id);
    if (!d) return null;
    const set = (patch: Partial<typeof d>) => onChange({ ...doc, delegations: doc.delegations.map(x => (x.id === d.id ? { ...x, ...patch } : x)) });
    head = header('Delegation', d.name, `${d.name} → ${agentName}`);
    body = <><Field label="Subject"><span className="people-kind-chip" data-kind={d.kind}>{d.kind === 'person' ? 'Person' : 'Service'}</span>{d.subject}<small className="cp-admin-muted">{d.issuer}</small></Field>
      <Field label="Consent">{d.consent.source === 'administrator' ? 'Recorded by an administrator' : 'From the identity provider'}<small className="cp-admin-muted">{d.consent.recordedBy} · {d.consent.recordedAt}</small></Field>
      <Expiration value={d.expiresAt} onChange={v => set({ expiresAt: v })} />
      <AddCondition key={d.id + start} tool="" start={start} expiration={!d.expiresAt} cel={false} onExpiration={() => set({ expiresAt: inAMonth() })} onRule={() => undefined} />
      <footer><button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" onClick={() => { onChange({ ...doc, delegations: doc.delegations.filter(x => x.id !== d.id) }); onClose(); }}><Trash2 size={14} aria-hidden="true" />Remove delegation</button></footer></>;
  } else if (selected.type === 'capability') {
    const c = doc.capabilities.find(x => x.id === selected.id);
    if (!c) return null;
    const set = (patch: Partial<typeof c>) => onChange({ ...doc, capabilities: doc.capabilities.map(x => (x.id === c.id ? { ...x, ...patch } : x)) });
    const server = servers.find(s => s.id === c.serverId)?.name ?? c.serverId;
    head = header('Agent · server · tool', c.tool, `${agentName} · ${server} · ${c.tool}`);
    body = <><Field label="Server">{server}</Field>
      <Field label="Resource mapping">{c.mapping ? <span><code>{c.mapping.pointer}</code> → {c.mapping.kind}</span> : 'None. This tool has no resource check.'}</Field>
      <Expiration value={c.expiresAt} onChange={v => set({ expiresAt: v })} />
      <Field label="Rules for this agent on this server tool"><Conditions items={c.conditions} onRemove={id => set({ conditions: c.conditions.filter(k => k.id !== id) })} /><small className="cp-admin-muted">Every rule must pass. They apply only when {agentName} calls {server} · {c.tool}.</small></Field>
      <AddCondition key={c.id + start} tool={c.tool} start={start} expiration={!c.expiresAt} cel onExpiration={() => set({ expiresAt: inAMonth() })} onRule={k => set({ conditions: [...c.conditions, k] })} />
      <footer><button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" onClick={() => { onChange({ ...doc, capabilities: doc.capabilities.filter(x => x.id !== c.id), }); onClose(); }}><Trash2 size={14} aria-hidden="true" />Remove tool</button></footer></>;
  } else {
    const r = doc.resources.find(x => x.id === selected.id);
    if (!r) return null;
    const server = servers.find(s => s.id === r.serverId)?.name ?? r.serverId;
    const users = doc.capabilities.filter(c => c.serverId === r.serverId && c.mapping?.kind === r.kind);
    head = header('Resource access', r.value, `${agentName} → ${r.kind} ${r.value}`);
    body = <><Field label="Resource">{r.kind} · <code>{r.value}</code><small className="cp-admin-muted">On {server}</small></Field>
      <Field label="Allows these tools to act on it">{users.length ? users.map(c => <span key={c.id}>{c.tool}</span>) : 'No granted tool uses this resource type.'}<small className="cp-admin-muted">A resource is an allow list. Rules go on the agent · server · tool relation.</small></Field>
      <footer><button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" onClick={() => { onChange({ ...doc, resources: doc.resources.filter(x => x.id !== r.id) }); onClose(); }}><Trash2 size={14} aria-hidden="true" />Remove resource</button></footer></>;
  }
  return <aside className="relation-panel" aria-label="Selected relation">
    <button type="button" className="relation-icon-button relation-close" aria-label="Close panel" onClick={onClose}><X size={16} /></button>
    {back?.type === 'group' ? <button type="button" className="rule-switch" onClick={onBack}>← Back to {back.label}</button> : null}
    {head}{selected.type !== 'add' && selected.type !== 'group' && selected.type !== 'idp' ? <WaitingBackend spec="033" tip="Edits this relation of the agent: its expiration and, on a tool, its rules." /> : null}
    {body}
  </aside>;
}
