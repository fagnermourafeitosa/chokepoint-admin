import type { EnvironmentScope } from '../access/environment-scope';
import { useInvestigation } from './useInvestigation';
import { InvestigationToolbar } from './InvestigationToolbar';
import { DecisionLists } from './DecisionLists';
import { DecisionInspector } from './DecisionInspector';
import './investigate.css';
export function Investigate({ scope }: { scope: EnvironmentScope }) {
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
