import { ChevronRight, Eye, KeyRound, ShieldCheck, TerminalSquare } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCatalog } from './catalog';
import type { Selection } from './layout';
import { idpName, serverName, type Doc } from './model';

// Admin 048: the side panel of the agent node. A summary of the permission document of the
// agent; each row opens the side panel of its part of the graph.

export type AgentView = 'access' | 'identity' | 'sessions';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <section className="relation-field"><span>{label}</span><div>{children}</div></section>;
}

type Props = { agentName: string; reportOnly: boolean; doc: Doc; onSelect: (s: Selection) => void; onView: (v: AgentView) => void };

export function AgentPanel({ agentName, reportOnly, doc, onSelect, onView }: Props) {
  const { catalog } = useCatalog();
  const rules = doc.capabilities.reduce((n, c) => n + c.conditions.length, 0);
  return <aside className="relation-panel agent-summary" aria-label="Selected agent">
    <p className="cp-admin-muted">These permissions apply to every instance of {agentName} and to every subject that delegates to it.</p>

    <Field label="Enforcement">
      <p className="agent-summary-mode">{reportOnly ? <Eye size={15} aria-hidden="true" /> : <ShieldCheck size={15} aria-hidden="true" />}<strong>{reportOnly ? 'Report-only' : 'Enforce'}</strong></p>
      <small>{reportOnly ? 'Calls run. A call the permissions would deny is recorded as would deny.' : 'A call the permissions deny does not run.'}</small>
    </Field>

    <Field label="Who can delegate">
      {doc.scopes.length ? <ul className="agent-summary-list">{doc.scopes.map(s => {
        const dir = catalog.directory(s.issuer);
        const people = doc.delegations.filter(d => d.issuer === s.issuer).length;
        const blocked = doc.blocked.filter(b => b.issuer === s.issuer).length;
        return <li key={s.issuer}><button type="button" onClick={() => onSelect({ type: 'idp', issuer: s.issuer })}>
          <span><strong>{idpName(catalog, s.issuer)}</strong><small>Delegations: {people}{dir ? ` of ${dir.subjects.length} subjects` : ''}{blocked ? ` · ${blocked} blocked` : ''}</small></span><ChevronRight size={15} aria-hidden="true" />
        </button></li>;
      })}</ul> : <p className="cp-admin-muted">No identity provider yet. Nobody can delegate to {agentName}.</p>}
    </Field>

    <Field label="Tools">
      {doc.capabilities.length ? <ul className="agent-summary-list">{doc.capabilities.map(c => {
        const n = c.conditions.length;
        return <li key={c.id}><button type="button" onClick={() => onSelect({ type: 'capability', id: c.id })}>
          <span><strong><code>{c.tool}</code></strong><small>{serverName(catalog, c.serverId)} · {n ? `${n} ${n === 1 ? 'rule' : 'rules'}` : 'no rules'}</small></span><ChevronRight size={15} aria-hidden="true" />
        </button></li>;
      })}</ul> : <p className="cp-admin-muted">No tools yet. {agentName} can not call anything.</p>}
      <small>{doc.capabilities.length} {doc.capabilities.length === 1 ? 'tool' : 'tools'} · {rules} {rules === 1 ? 'rule' : 'rules'} in all. Every rule must pass.</small>
    </Field>

    <Field label="Agent views">
      <div className="agent-summary-views">
        <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" onClick={() => onView('identity')}><KeyRound size={14} aria-hidden="true" />Identity</button>
        <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" onClick={() => onView('sessions')}><TerminalSquare size={14} aria-hidden="true" />Harness sessions</button>
      </div>
    </Field>
  </aside>;
}
