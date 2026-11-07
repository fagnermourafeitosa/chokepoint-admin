import { useInvestigation } from './useInvestigation';
import { InvestigationToolbar } from './InvestigationToolbar';
import { DecisionLists } from './DecisionLists';
import { DecisionInspector } from './DecisionInspector';
import '../../../src/features/investigate/investigate.css';
import './investigate-layout.css';
import { QuickIncident } from '../../../src/components/quick-incident/QuickIncident';

// Admin 049 prototype: the Investigate list, fixed data (data.ts). Start from a copy of the real
// screen on 2026-11-07; change it here, never in src/.
export function InvestigatePrototype() {
  const state = useInvestigation();
  return (
    <main className="admin-page cp-admin-container" aria-label="Investigate prototype">
      <header className="trace-page-heading quick-incident-row">
        <div>
          <span className="attention-kicker">Investigate</span>
          <h1>Find out why a call was denied</h1>
          <p>Start from a problem, inspect the recorded reason and rule, then adjust access.</p>
        </div>
        <QuickIncident />
      </header>
      {state.isDetail ? (
        <DecisionInspector state={state} />
      ) : (
        <section className="cp-admin-panel trace-list">
          <InvestigationToolbar state={state} />
          <DecisionLists state={state} />
        </section>
      )}
    </main>
  );
}
