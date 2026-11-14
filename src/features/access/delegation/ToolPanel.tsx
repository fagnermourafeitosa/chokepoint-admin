import { useState, type ReactNode } from 'react';
import { ArrowRight, Braces, CircleCheck, CircleHelp, Database, Plus, Trash2 } from 'lucide-react';
import { Tooltip } from '../../../components/ui/tooltip/Tooltip';
import { ConfirmDialog } from '../../../components/ui/dialog/ConfirmDialog';
import { useCatalog } from './catalog';
import { ConditionEditor } from './ConditionEditor';
import { ExpiresField } from './ExpiresField';
import { serverName, withoutCapability, type CatalogBinding, type Condition, type Doc } from './model';
import { celSentence } from './RuleBuilder';

// The editor of one agent · server · tool edge (Admin 048): Expires, Rules with the trusted
// attributes they can read, Add rule and Remove access.

// help: what the field is, so that trusted attributes and rules are not confused.
function Label({ label, help }: { label: string; help?: string }) {
  return <span className="relation-label">{label}{help ? <Tooltip content={help}><CircleHelp size={14} aria-label={`About ${label.toLowerCase()}`} /></Tooltip> : null}</span>;
}

function Field({ label, help, children, name }: { label: string; help?: string; children: ReactNode; name?: string }) {
  return <div className="relation-field" data-field={name}><Label label={label} help={help} /><div>{children}</div></div>;
}

const help = {
  trusted: 'Facts about the subject or the object of the call, read from your context sources when the call arrives, for example the owner of an order. Only a rule can use them; they never allow a call by themselves. They belong to the tool: every agent with a rule on it reads the same attributes.',
  rules: 'CEL conditions on this agent · server · tool, for example amount <= 200 or order_id in ["1001", "1002"]. A rule reads the call arguments and the trusted attributes. Every rule must pass.',
};

// Admin 049: a saved rule reads as the sentence of the rule editor; a rule that can not be read shows its CEL.
function Conditions({ items, published, bindings, tool, onRemove }: { items: Condition[]; published: Condition[]; bindings: CatalogBinding[]; tool: string; onRemove: (id: string) => void }) {
  return <div className="relation-conditions">{items.length ? items.map(c => {
    const sentence = celSentence(c.expression, bindings, c.usage, tool);
    return <article key={c.id} className="relation-condition"><header><Braces size={14} aria-hidden="true" /><strong>{c.name}</strong>{published.some(p => p.id === c.id) ? null : <span className="mcp-badge draft-badge">New in draft</span>}<button type="button" className="relation-icon-button" aria-label={`Remove ${c.name}`} onClick={() => onRemove(c.id)}><Trash2 size={14} /></button></header>
      {sentence ? <p className="rule-sentence rule-sentence--read"><CircleCheck size={14} aria-hidden="true" />Reads as: <strong>{sentence}</strong></p> : <code className="rule-expression">{c.expression}</code>}</article>;
  }) : <p className="cp-admin-muted">No rules.</p>}</div>;
}

// Add rule opens the rule editor at once. The expiration of the tool is its own section (Expires).
function AddRule({ serverId, tool, start, field, onRule }: { serverId: string; tool: string; start: boolean; field?: string; onRule: (c: Condition) => void }) {
  const [open, setOpen] = useState(!!field || start);
  if (open) return <ConditionEditor serverId={serverId} tool={tool} initialField={field} onCancel={() => setOpen(false)} onSave={c => { onRule(c); setOpen(false); }} />;
  return <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small relation-add-button" onClick={() => setOpen(true)}><Plus size={14} aria-hidden="true" />Add rule</button>;
}


type Props = { published: Doc; id: string; start: boolean; agentName: string; doc: Doc; onChange: (d: Doc) => void; onClose: () => void; onContextSources: () => void };

export function ToolPanel({ published, id, start, agentName, doc, onChange, onClose, onContextSources }: Props) {
  const { catalog } = useCatalog();
  const [removing, setRemoving] = useState(false);
  const [ruleOn, setRuleOn] = useState<string>();
  const c = doc.capabilities.find(x => x.id === id);
  if (!c) return null;
  const set = (patch: Partial<typeof c>) => onChange({ ...doc, capabilities: doc.capabilities.map(x => (x.id === c.id ? { ...x, ...patch } : x)) });
  const server = serverName(catalog, c.serverId);
  const bindings = catalog.bindings(c.serverId, c.tool);
  const removal = withoutCapability(doc, c.id);
  return <aside className="relation-panel relation-sections" aria-label="Selected relation">
    <ExpiresField value={c.expiresAt} onChange={v => set({ expiresAt: v })} never={`${agentName} can call ${c.tool} until you remove it.`} ends={`After this day (UTC), ${agentName} can no longer call ${c.tool}. Its calls are denied.`} />
    <Field label="Rules" help={help.rules} name="rules"><Conditions items={c.conditions} bindings={bindings} tool={c.tool} published={published.capabilities.find(x => x.id === c.id)?.conditions ?? []} onRemove={k => set({ conditions: c.conditions.filter(x => x.id !== k) })} />
      <section className="rule-trusted" aria-label="Trusted attributes">
        <ul>
          <li data-field="trusted"><Label label="Trusted attributes" help={help.trusted} />
            {bindings.length ? <ul className="trusted-list">{bindings.map(b => <li key={b.id}><Database size={14} aria-hidden="true" /><span><strong>{b.source}</strong><small>{b.entity === 'subject' ? 'Subject' : 'Object of the call'} · {b.attributes.map(a => a.name).join(', ')}</small></span></li>)}</ul>
              : <small className="cp-admin-muted">None on this tool.</small>}
            <button type="button" className="nav-link" onClick={onContextSources}>Add trusted attributes in Context sources<ArrowRight size={14} aria-hidden="true" /></button>
          </li>
        </ul>
      </section></Field>
    <AddRule key={c.id + start + (ruleOn ?? '')} serverId={c.serverId} tool={c.tool} start={start} field={ruleOn} onRule={k => { set({ conditions: [...c.conditions, k] }); setRuleOn(undefined); }} />
    <footer><button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" onClick={() => setRemoving(true)}><Trash2 size={14} aria-hidden="true" />Remove access</button>
      {removing ? <ConfirmDialog title="Remove access" confirmLabel="Remove access" onClose={() => setRemoving(false)} onConfirm={() => { setRemoving(false); onChange(removal.doc); onClose(); }}><p><strong>{agentName}</strong> can no longer call <strong>{c.tool}</strong>, and its rules on this tool are removed. The tool stays on {server} for other agents. The change goes into the draft.</p></ConfirmDialog> : null}</footer>
  </aside>;
}
