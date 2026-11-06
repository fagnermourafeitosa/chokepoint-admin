import { useState, type ReactNode } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { useCatalog } from '../../../src/features/access/delegation/catalog';
import type { Selection } from '../../../src/features/access/delegation/layout';
import { idpName, type Doc } from '../../../src/features/access/delegation/model';

// Admin 048 prototype: Manage identity providers, when the agent has none or several. Each row opens
// the panel of one identity provider; Add identity provider shows the real add form below.

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <section className="relation-field"><span>{label}</span><div>{children}</div></section>;
}

type Props = { agentName: string; doc: Doc; onSelect: (s: Selection) => void; add: ReactNode };

export function WhoCanDelegatePanel({ agentName, doc, onSelect, add }: Props) {
  const { catalog } = useCatalog();
  const [adding, setAdding] = useState(doc.scopes.length === 0);
  const free = catalog.idps.filter(i => i.enabled && !doc.scopes.some(s => s.issuer === i.id));
  const total = doc.delegations.length;
  return <aside className="relation-panel agent-summary" aria-label="Who can delegate">
    <p className="cp-admin-muted">{total} {total === 1 ? 'subject delegates' : 'subjects delegate'} to {agentName} from {doc.scopes.length} {doc.scopes.length === 1 ? 'identity provider' : 'identity providers'}.</p>
    <Field label="Identity providers">
      {doc.scopes.length ? <ul className="agent-summary-list">{doc.scopes.map(s => {
        const dir = catalog.directory(s.issuer);
        const n = doc.delegations.filter(d => d.issuer === s.issuer).length;
        const blocked = doc.blocked.filter(b => b.issuer === s.issuer).length;
        const kinds = s.kinds.map(k => (k === 'person' ? 'People' : 'Services')).join(', ');
        return <li key={s.issuer}><button type="button" onClick={() => onSelect({ type: 'idp', issuer: s.issuer })}>
          <span><strong>{idpName(catalog, s.issuer)}</strong><small>{kinds} · Delegations: {n}{dir ? ` of ${dir.subjects.filter(x => s.kinds.includes(x.kind)).length}` : ''}{blocked ? ` · ${blocked} blocked` : ''}</small></span><ChevronRight size={15} aria-hidden="true" />
        </button></li>;
      })}</ul> : <p className="cp-admin-muted">None yet. Nobody can delegate to {agentName}.</p>}
      {free.length ? null : <small>Every enabled identity provider is in this list. Connect another in Identity providers.</small>}
    </Field>
    {free.length && !adding ? <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small relation-add-button" onClick={() => setAdding(true)}><Plus size={14} aria-hidden="true" />Add identity provider</button> : null}
    {free.length && adding ? add : null}
  </aside>;
}
