import type { EnvironmentScope } from '../access/environment-scope';
import { useInvestigation } from './useInvestigation';
import { InvestigationToolbar } from './InvestigationToolbar';
import { DecisionLists } from './DecisionLists';
import { DecisionInspector } from './DecisionInspector';
import './investigate.css';
import { QuickIncident } from '../../components/quick-incident/QuickIncident';
import { RuleBindingsProvider } from './useRuleSentence';

export function Investigate({ scope }: { scope: EnvironmentScope }) {
  const state = useInvestigation(scope);
  // Admin 049 item 6: the decision detail has no page title; its bar holds Back and Quick incident.
  const decisionDetail = state.isDetail && !state.exchangeId;
  return (
    <RuleBindingsProvider scope={scope}>
      {decisionDetail ? null : (
        <header className="trace-page-heading quick-incident-row">
          <div>
            <h1>Find out why a call was denied</h1>
            <p>Start from a problem, inspect the recorded reason and rule, then adjust access.</p>
          </div>
          <QuickIncident />
        </header>
      )}
      {state.isDetail ? (
        <DecisionInspector scope={scope} state={state} />
      ) : (
        <section className="cp-admin-panel trace-list">
          <InvestigationToolbar state={state} />
          <DecisionLists state={state} />
        </section>
      )}
    </RuleBindingsProvider>
  );
}
