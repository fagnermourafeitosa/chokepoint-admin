import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, Bot, Braces, CircleCheck, CircleHelp, Database, Plus, Server, Trash2, Wrench } from 'lucide-react';
import { SidePanel } from '../../../src/components/ui/side-panel/SidePanel';
import { Tooltip } from '../../../src/components/ui/tooltip/Tooltip';
import { ExpiresField } from '../../../src/features/access/delegation/ExpiresField';
import '../../../src/features/access/delegation/delegation.css';
import './investigate-layout.css';
import { ruleSentence } from './data';

// Admin 049 prototype: the side panel of the refunds-assistant · Acme Billing · refund_order edge in
// Access (a copy of src/features/access/delegation/ToolPanel.tsx on 2026-11-07, fixed data). Each saved
// rule reads as the sentence of the rule editor; a rule that can not be read shows its CEL.
const rules = [
  { id: 'r1', name: 'Refund up to 500', expression: 'context.chokepoint.arguments["amount"] <= 500' },
  { id: 'r2', name: 'Even amounts only', expression: 'int(context.chokepoint.arguments["amount"]) % 2 == 0', draft: true },
];

const rulesHelp = 'CEL conditions on this agent · server · tool, for example amount <= 200 or order_id in ["1001", "1002"]. A rule reads the call arguments and the trusted attributes. Every rule must pass.';
const trustedHelp = 'Facts about the subject or the object of the call, read from your context sources when the call arrives, for example the owner of an order. Only a rule can use them; they never allow a call by themselves. They belong to the tool: every agent with a rule on it reads the same attributes.';

function Label({ label, help }: { label: string; help: string }) {
  return <span className="relation-label">{label}<Tooltip content={help}><CircleHelp size={14} aria-label={`About ${label.toLowerCase()}`} /></Tooltip></span>;
}

export function RulesPanelPrototype() {
  const navigate = useNavigate();
  const [expires, setExpires] = useState<string>();
  const heading = <span className="panel-path"><span><Bot size={16} aria-hidden="true" />refunds-assistant</span><ArrowRight size={14} aria-label="calls on" /><span><Server size={16} aria-hidden="true" />Acme Billing</span><span className="panel-path-tool"><Wrench size={16} aria-hidden="true" /><code>refund_order</code></span></span>;
  return (
    <main className="admin-page cp-admin-container" aria-label="Rules panel prototype">
      <SidePanel title={heading} onClose={() => navigate('/prototype')}>
        <fieldset className="relation-side-panel">
          <aside className="relation-panel relation-sections" aria-label="Selected relation">
            <ExpiresField value={expires} onChange={setExpires} never="refunds-assistant can call refund_order until you remove it." ends="After this day (UTC), refunds-assistant can no longer call refund_order. Its calls are denied." />
            <div className="relation-field" data-field="rules"><Label label="Rules" help={rulesHelp} /><div>
              <div className="relation-conditions">
                {rules.map(c => {
                  const sentence = ruleSentence[c.expression];
                  return (
                    <article key={c.id} className="relation-condition">
                      <header><Braces size={14} aria-hidden="true" /><strong>{c.name}</strong>{c.draft ? <span className="mcp-badge draft-badge">New in draft</span> : null}<button type="button" className="relation-icon-button" aria-label={`Remove ${c.name}`}><Trash2 size={14} /></button></header>
                      {sentence
                        ? <p className="rule-sentence rule-sentence--read"><CircleCheck size={14} aria-hidden="true" />Reads as: <strong>{sentence}</strong></p>
                        : <code className="rule-expression">{c.expression}</code>}
                    </article>
                  );
                })}
              </div>
              <section className="rule-trusted" aria-label="Trusted attributes">
                <ul>
                  <li data-field="trusted"><Label label="Trusted attributes" help={trustedHelp} />
                    <ul className="trusted-list"><li><Database size={14} aria-hidden="true" /><span><strong>Acme Employee Directory / Employee profile</strong><small>Subject · refund_limit, team</small></span></li></ul>
                    <button type="button" className="nav-link">Add trusted attributes in Context sources<ArrowRight size={14} aria-hidden="true" /></button>
                  </li>
                </ul>
              </section>
            </div></div>
            <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small relation-add-button"><Plus size={14} aria-hidden="true" />Add rule</button>
            <footer><button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small"><Trash2 size={14} aria-hidden="true" />Remove access</button></footer>
          </aside>
        </fieldset>
      </SidePanel>
    </main>
  );
}
