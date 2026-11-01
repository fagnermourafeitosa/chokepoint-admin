import type { EnvironmentScope } from '../access/environment-scope';
import { useInvestigation } from './useInvestigation';
import { InvestigationToolbar } from './InvestigationToolbar';
import { DecisionLists } from './DecisionLists';
import { DecisionInspector } from './DecisionInspector';
import './investigate.css';
import './inspector.css';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ProtoLists, type Filters, type View } from './prototype/ProtoLists';
import { ProtoInspector } from './prototype/ProtoInspector';
import './prototype/proto.css';
import '../access/delegation/delegation.css';
import '../permissions/permissions.css';
// The live views read the trace API. Only the Token exchanges view is a layout prototype (Admin A3) with fixed data.
export function Investigate({ scope }: { scope: EnvironmentScope }) {
  const [params] = useSearchParams();
  return params.get('view') === 'exchanges' ? <TokenExchanges /> : <InvestigateLive scope={scope} />;
}

function TokenExchanges() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({ text: '', reason: '' });
  const [open, setOpen] = useState<string>();
  return <>
    <header className="trace-page-heading"><span className="attention-kicker">Investigate</span><h1>Find out why a call was denied</h1><p>Start from a problem, inspect the recorded reason and rule, then adjust access.</p></header>
    {open ? <ProtoInspector kind="exchange" id={open} onBack={() => setOpen(undefined)} /> : <ProtoLists view="exchanges" onView={(v: View) => navigate(v === 'decisions' ? '/investigate?view=decisions' : '/investigate')} filters={filters} onFilters={setFilters} onOpen={(_kind, id) => setOpen(id)} />}
  </>;
}

export function InvestigateLive({ scope }: { scope: EnvironmentScope }) {
  const state = useInvestigation(scope);
  return (
    <>
      <header className="trace-page-heading">
        <span className="attention-kicker">Investigate</span>
        <h1>Find out why a call was denied</h1>
        <p>Start from a problem, inspect the recorded reason and rule, then adjust access.</p>
      </header>
      {state.isDetail ? (
        <DecisionInspector scope={scope} state={state} />
      ) : (
        <>
          <section className="cp-admin-panel trace-list">
            <InvestigationToolbar state={state} />
            <DecisionLists state={state} />
          </section>
        </>
      )}
    </>
  );
}
