import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, Bot, Braces, CircleCheck, CircleHelp, Code, Database, Plus, Server, Trash2, Wrench } from 'lucide-react';
import { SidePanel } from '../../../src/components/ui/side-panel/SidePanel';
import { SelectMenu } from '../../../src/components/ui/dropdown/SelectMenu';
import { Tooltip } from '../../../src/components/ui/tooltip/Tooltip';
import { ExpiresField } from '../../../src/features/access/delegation/ExpiresField';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import '../../../src/features/access/delegation/delegation.css';
import './limits.css';
import { newRule, saved, tool, type Usage } from './data';
import { LimitClause, limitSentence } from './LimitClause';

// Admin 054 prototype: the side panel of the refunds-assistant · Acme Billing · refund_order edge in
// Access (a copy of src/features/access/delegation/ToolPanel.tsx and ConditionEditor.tsx on
// 2026-11-13, fixed data). A rule can add limit lines that read earlier calls (Backend 087).

const rulesHelp = 'Conditions on this agent · server · tool. A rule reads the call arguments, the trusted attributes and, with a limit, the earlier calls of this agent. Every rule must pass.';
const limitHelp = 'A limit reads the earlier calls of this agent to this tool, in a rolling window of at most 24 hours. A call counts from the moment it is allowed; a failed call does not count. Each agent has its own totals: two agents together can go over the same limit.';

function Label({ label, help }: { label: string; help: string }) {
  return <span className="relation-label">{label}<Tooltip content={help}><CircleHelp size={14} aria-label={`About ${label.toLowerCase()}`} /></Tooltip></span>;
}

export function RuleLimitsPrototype() {
  const navigate = useNavigate();
  const [expires, setExpires] = useState<string>();
  const [name, setName] = useState('Refund calls per customer');
  const [limits, setLimits] = useState<Usage[]>(newRule);
  const sentence = limits.map(limitSentence).join(' AND ');
  const heading = <span className="panel-path"><span><Bot size={16} aria-hidden="true" />refunds-assistant</span><ArrowRight size={14} aria-label="calls on" /><span><Server size={16} aria-hidden="true" />Acme Billing</span><span className="panel-path-tool"><Wrench size={16} aria-hidden="true" /><code>{tool}</code></span></span>;
  const add = () => setLimits([...limits, { id: `u${Date.now()}`, operator: 'sum', argument: 'amount', key: 'customer_id', windowValue: 24, windowUnit: 'hours', compare: 'le', limit: '' }]);
  return (
    <main className="admin-page cp-admin-container" aria-label="Rule limits prototype">
      <SidePanel title={heading} onClose={() => navigate('/prototype')}>
        <fieldset className="relation-side-panel">
          <aside className="relation-panel relation-sections" aria-label="Selected relation">
            <ExpiresField value={expires} onChange={setExpires} never="refunds-assistant can call refund_order until you remove it." ends="After this day (UTC), refunds-assistant can no longer call refund_order. Its calls are denied." />
            <div className="relation-field" data-field="rules"><Label label="Rules" help={rulesHelp} /><div>
              <div className="relation-conditions">
                {saved.map(c => <article key={c.id} className="relation-condition">
                  <header><Braces size={14} aria-hidden="true" /><strong>{c.name}</strong>{c.draft ? <span className="mcp-badge draft-badge">New in draft</span> : null}<button type="button" className="relation-icon-button" aria-label={`Remove ${c.name}`}><Trash2 size={14} /></button></header>
                  <p className="rule-sentence rule-sentence--read"><CircleCheck size={14} aria-hidden="true" />Reads as: <strong>{c.sentence}</strong></p>
                </article>)}
              </div>
              <section className="rule-trusted" aria-label="Trusted attributes">
                <ul><li data-field="trusted"><span className="relation-label">Trusted attributes</span>
                  <ul className="trusted-list"><li><Database size={14} aria-hidden="true" /><span><strong>Acme Employee Directory / Employee profile</strong><small>Subject · refund_limit, team</small></span></li></ul>
                  <button type="button" className="nav-link">Add trusted attributes in Context sources<ArrowRight size={14} aria-hidden="true" /></button>
                </li></ul>
              </section>
            </div></div>

            <div className="condition-editor">
              <label className="relation-field"><span>Name <span className="required-mark" aria-hidden="true">*</span></span><input className="cp-admin-input" required value={name} onChange={e => setName(e.target.value)} maxLength={80} /></label>
              <div className="rule-builder">
                <div className="rule-join">Allow the call when <SelectMenu label="Match" value="all" onChange={() => undefined} options={[{ value: 'all', label: 'all' }, { value: 'any', label: 'any' }]} /> of these are true:</div>
                {limits.map(u => <LimitClause key={u.id} usage={u} onChange={next => setLimits(limits.map(x => (x.id === u.id ? next : x)))} onRemove={() => setLimits(limits.filter(x => x.id !== u.id))} />)}
                <div className="limit-add">
                  <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small"><Plus size={14} aria-hidden="true" />Add a condition</button>
                  <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={add}><Plus size={14} aria-hidden="true" />Add a limit</button>
                  <Tooltip content={limitHelp}><CircleHelp size={14} aria-label="About limits" /></Tooltip>
                  <WaitingBackend spec="087" tip="Reads the earlier calls of this agent: the usage definitions of the rule and the context.chokepoint.usage values." />
                </div>
              </div>
              {sentence ? <p className="rule-sentence rule-sentence--read"><CircleCheck size={14} aria-hidden="true" />Reads as: <strong>{sentence}</strong></p> : null}
              <button type="button" className="rule-switch"><Code size={13} aria-hidden="true" />Edit as CEL (advanced)</button>
              <div className="condition-actions">
                <button type="button" className="cp-admin-button cp-admin-button--small" disabled={!name.trim()}>Add to draft</button>
                <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small">Cancel</button>
              </div>
            </div>
            <footer><button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small"><Trash2 size={14} aria-hidden="true" />Remove access</button></footer>
          </aside>
        </fieldset>
      </SidePanel>
    </main>
  );
}
