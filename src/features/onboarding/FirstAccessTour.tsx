import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ACTIONS, EVENTS, Joyride, STATUS, type EventData, type Step, type TooltipRenderProps } from 'react-joyride';
import { Check, Copy, X } from 'lucide-react';
import { tourStops, type StopAction } from './tourStops';
import './first-access.css';

// Admin 052: a guided tour (react-joyride 3) through the real screens of the Sandbox. It opens by itself
// once per browser (decision "Start once, in the browser"), in any Sandbox, and "Take the tour" opens it
// again. It knows no name of the sample: a stop whose target is not on the screen is skipped.
const seenKey = 'admin.first-access-tour.seen';

function seen() {
  try { return window.localStorage.getItem(seenKey) === '1'; } catch { return false; }
}

function markSeen() {
  try { window.localStorage.setItem(seenKey, '1'); } catch { /* the tour opens again next time */ }
}

async function waitFor(selector: string, match?: (element: Element) => boolean, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    const found = [...document.querySelectorAll(selector)].find(element => !match || match(element));
    if (found) return found as HTMLElement;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  return undefined;
}

function closeSidePanel() {
  document.querySelector<HTMLElement>('.cp-admin-side-panel-close')?.click();
}

async function agentView(label: string) {
  (await waitFor('.agent-views button', element => element.textContent === label))?.click();
}

// The tour opens the part of the screen that a stop shows: the views of the agent and the side panel of a tool.
const actions: Record<StopAction, () => Promise<void>> = {
  'agent-delegation': async () => { closeSidePanel(); await agentView('Delegation and access'); },
  'tool-rules': async () => {
    await agentView('Delegation and access');
    // The first tool that has a rule ("1 rule", "2 rules").
    (await waitFor('.agent-graph-node', element => /\d+ rules?$/.test(element.textContent ?? ''), 20))?.click();
    await waitFor('.cp-admin-side-panel', undefined, 20);
  },
  'agent-identity': async () => { closeSidePanel(); await agentView('Identity'); },
  'agent-sessions': async () => { closeSidePanel(); await agentView('Harness sessions'); },
};

// An explicit `placement: undefined` breaks react-joyride 3.2.0, so absent keys stay absent.
// The side panel is a modal dialog in the top layer, and the page outside it is inert: on that stop the
// tooltip renders inside the dialog, and the dialog backdrop replaces the tour overlay.
const insidePanel = (action?: StopAction) => action === 'tool-rules';
const steps: Step[] = tourStops.map(({ path: _path, action, code, ...stop }) => ({
  ...stop,
  ...(insidePanel(action) ? { hideOverlay: true } : {}),
  data: { code },
}));

// The command is ready to paste: <MCP URL> becomes the MCP URL that the Harness login card shows.
function TourCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = document.querySelector('[aria-label="Harness login"] .identity-value code')?.textContent;
  const command = url ? code.replace('<MCP URL>', url) : code;
  return <div className="tour-tooltip-code">
    <pre><code>{command}</code></pre>
    <button type="button" className="relation-icon-button tour-tooltip-copy" aria-label="Copy command" onClick={() => { void navigator.clipboard?.writeText(command); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}</button>
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

export function FirstAccessTour({ sandbox }: { sandbox: boolean }) {
  const navigate = useNavigate();
  const [run, setRun] = useState(false);
  const [index, setIndex] = useState(0);

  // Opens the screen of a stop and its part of the screen; returns false when the target is not there.
  async function show(next: number) {
    const { path, action, target } = tourStops[next];
    if (`${window.location.pathname}${window.location.search}` !== path) navigate(path);
    if (action) await actions[action]();
    return target === 'body' || Boolean(await waitFor(target, undefined, 20));
  }

  // Moves to the next stop in a direction, skipping each stop whose target is missing.
  async function go(from: number, step: 1 | -1) {
    for (let next = from; next >= 0 && next < tourStops.length; next += step) {
      if (await show(next)) {
        setIndex(next);
        setRun(true);
        return;
      }
    }
    end();
  }

  function end() {
    setRun(false);
    markSeen();
  }

  useEffect(() => {
    if (sandbox && !seen()) void go(0, 1);
    if (!sandbox) setRun(false);
    // The tour starts by itself only when the Sandbox opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sandbox]);

  function onEvent(data: EventData) {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED || data.action === ACTIONS.CLOSE) {
      end();
      return;
    }
    if (data.type === EVENTS.STEP_AFTER || data.type === EVENTS.TARGET_NOT_FOUND) {
      const step = data.action === ACTIONS.PREV ? -1 : 1;
      void go(data.index + step, step);
    }
  }

  if (!sandbox) return null;
  return <>
    <Joyride
      steps={steps}
      run={run}
      stepIndex={index}
      {...(insidePanel(tourStops[index].action) ? { portalElement: '.cp-admin-side-panel' } : {})}
      continuous
      onEvent={onEvent}
      tooltipComponent={TourTooltip}
      options={{ overlayColor: 'rgba(21, 22, 27, 0.55)', spotlightRadius: 4, zIndex: 120, targetWaitTimeout: 3000, scrollOffset: 100 /* the Admin header is fixed and 75px tall */ }}
    />
    {run ? null : <button type="button" className="cp-admin-button cp-admin-button--secondary first-access-restart" onClick={() => void go(0, 1)}>Take the tour</button>}
  </>;
}
