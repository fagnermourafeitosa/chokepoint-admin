import { useState } from 'react';
import { Outlet, Route, Routes, useNavigate } from 'react-router';
import { ACTIONS, EVENTS, Joyride, STATUS, type EventData, type Step, type TooltipRenderProps } from 'react-joyride';
import { Check, Copy, X } from 'lucide-react';
import { OverviewPage } from '../../../src/pages/OverviewPage';
import { InvestigatePage } from '../../../src/pages/InvestigatePage';
import { AccessNavigation } from '../../../src/features/access/components/AccessNavigation';
import { IntegrationsPage } from '../../../src/features/access/pages/IntegrationsPage';
import { ContextSourcesPage } from '../../../src/features/access/pages/ContextSourcesPage';
import { PermissionsPage } from '../../../src/features/access/pages/PermissionsPage';
import '../../../src/features/access/access.css';
import { tourStops, type StopAction } from './data';
import './first-access.css';

// Admin 052 prototype: the first access lands on the filled screens of the Sandbox, and a guided tour
// (react-joyride 3) goes through them. The screens are the real ones, mounted under /prototype/first-access
// so that the tour stays mounted while it moves between them.
const base = '/prototype/first-access';

async function waitFor(selector: string, match?: (element: Element) => boolean) {
  for (let i = 0; i < 40; i++) {
    const found = [...document.querySelectorAll(selector)].find(element => !match || match(element));
    if (found) return found as HTMLElement;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  return undefined;
}

async function closeSidePanel() {
  document.querySelector<HTMLElement>('.cp-admin-side-panel-close')?.click();
}

async function agentView(label: string) {
  (await waitFor('.agent-views button', element => element.textContent === label))?.click();
}

// The tour opens the part of the screen that a stop shows: the views of the agent and the side panel of a tool.
const actions: Record<StopAction, () => Promise<void>> = {
  'agent-delegation': async () => { await closeSidePanel(); await agentView('Delegation and access'); },
  'tool-rules': async () => {
    await agentView('Delegation and access');
    // The first tool node that has a rule ("1 rule", "2 rules").
    (await waitFor('.agent-graph-node', element => /\d+ rules?$/.test(element.textContent ?? '')))?.click();
    await waitFor('.cp-admin-side-panel');
  },
  'agent-identity': async () => { await closeSidePanel(); await agentView('Identity'); },
  'agent-sessions': async () => { await closeSidePanel(); await agentView('Harness sessions'); },
};

// An explicit `placement: undefined` breaks react-joyride 3.2.0 (it does not fall back to the default).
// The side panel is a modal dialog: it is in the top layer, above any z-index, and the page outside it is inert.
// On that stop the tooltip renders inside the dialog, and the dialog backdrop replaces the tour overlay.
const insidePanel = (action?: StopAction) => action === 'tool-rules';
const steps: Step[] = tourStops.map(({ path: _path, action, code, ...stop }) => ({
  ...stop,
  ...(action ? { before: actions[action] } : {}),
  ...(insidePanel(action) ? { hideOverlay: true } : {}),
  data: { code },
}));

// The command is ready to paste: <MCP URL> becomes the MCP URL that the Harness login card shows. The real screen
// reads it from the API; the prototype reads it from the card on the page.
function TourCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = document.querySelector('[aria-label="Harness login"] .identity-value code')?.textContent;
  const command = url ? code.replace('<MCP URL>', url) : code;
  return <div className="tour-tooltip-code">
    <pre><code>{command}</code></pre>
    <button type="button" className="relation-icon-button tour-tooltip-copy" aria-label="Copy command" onClick={() => { void navigator.clipboard?.writeText(command); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>
  </div>;
}

function TourTooltip({ index, size, step, isLastStep, backProps, closeProps, primaryProps, skipProps, tooltipProps }: TooltipRenderProps) {
  return <div {...tooltipProps} className="tour-tooltip">
    <div className="tour-tooltip-header">
      <span className="cp-admin-label">Step {index + 1} of {size}</span>
      <button {...closeProps} className="cp-admin-icon-button tour-tooltip-close"><X size={16} aria-hidden="true" /></button>
    </div>
    {step.title ? <h2 className="tour-tooltip-title">{step.title}</h2> : null}
    <p className="tour-tooltip-body">{step.content}</p>
    {step.data?.code ? <TourCode code={step.data.code} /> : null}
    <div className="tour-tooltip-actions">
      {isLastStep ? <span /> : <button {...skipProps} className="cp-admin-button cp-admin-button--ghost cp-admin-button--small">Skip tour</button>}
      <div className="tour-tooltip-nav">
        {index > 0 ? <button {...backProps} className="cp-admin-button cp-admin-button--secondary cp-admin-button--small">Back</button> : null}
        <button {...primaryProps} className="cp-admin-button cp-admin-button--small">{isLastStep ? 'Done' : 'Next'}</button>
      </div>
    </div>
  </div>;
}

function AccessFrame() {
  return <main id="main-content" className="admin-page cp-admin-container access-page" aria-label="Access" tabIndex={-1}>
    <AccessNavigation />
    <Outlet />
  </main>;
}

export function FirstAccessPrototype() {
  const navigate = useNavigate();
  // The prototype runs the tour on each visit. The real screen runs it once per user.
  const [run, setRun] = useState(true);
  const [index, setIndex] = useState(0);

  async function go(next: number) {
    const { path, action } = tourStops[next];
    navigate(path ? `${base}/${path}` : base);
    // react-joyride resolves portalElement when the step starts: open the panel before the step changes.
    if (insidePanel(action) && action) await actions[action]();
    setIndex(next);
  }

  function onEvent(data: EventData) {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED || data.action === ACTIONS.CLOSE) {
      setRun(false);
      return;
    }
    if (data.type === EVENTS.STEP_AFTER) void go(data.index + (data.action === ACTIONS.PREV ? -1 : 1));
  }

  function restart() {
    void go(0);
    setRun(true);
  }

  return <>
    <Joyride
      steps={steps}
      run={run}
      stepIndex={index}
      {...(insidePanel(tourStops[index].action) ? { portalElement: '.cp-admin-side-panel' } : {})}
      continuous
      onEvent={onEvent}
      tooltipComponent={TourTooltip}
      options={{ overlayColor: 'rgba(21, 22, 27, 0.55)', spotlightRadius: 4, zIndex: 120, targetWaitTimeout: 8000, scrollOffset: 100 /* the Admin header is fixed and 75px tall */ }}
    />
    {run ? null : <button type="button" className="cp-admin-button cp-admin-button--secondary first-access-restart" onClick={restart}>Take the tour</button>}
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route element={<AccessFrame />}>
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="context-sources" element={<ContextSourcesPage />} />
        <Route path="permissions" element={<PermissionsPage />} />
      </Route>
      <Route path="investigate" element={<InvestigatePage />} />
    </Routes>
  </>;
}
