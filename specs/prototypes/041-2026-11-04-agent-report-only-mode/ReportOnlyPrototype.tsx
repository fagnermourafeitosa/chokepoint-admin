import { useState } from 'react';
import '../../../src/features/access/components/agent-list.css';
import '../../../src/features/access/components/agent-details.css';
import '../../../src/features/access/delegation/delegation.css';
import '../../../src/features/mcp/mcp.css';
import '../../../src/features/investigate/investigate.css';
import '../../../src/features/investigate/inspector.css';
import '../../../src/features/attention/attention.css';
import '../../../src/features/overview/overview.css';
import './report-only.css';
import { ReportOnlyBanner, type BannerState } from './ReportOnlyBanner';
import { AccessScreen } from './AccessScreen';
import { InboxScreen, InvestigateScreen } from './TraceScreens';
import { HistoryPanel, OverviewScreen } from './OverviewHistory';

type Screen = 'overview' | 'access' | 'investigate' | 'inbox';
const screens: { key: Screen; label: string }[] = [{ key: 'overview', label: 'Overview' }, { key: 'access', label: 'Access' }, { key: 'investigate', label: 'Investigate' }, { key: 'inbox', label: 'Inbox' }];

// Visual specification of the agent Report-only mode (Admin 041). Fixed data; screens are added one at a time.
export function ReportOnlyPrototype() {
  const [banner, setBanner] = useState<BannerState>('active');
  const [environment, setEnvironment] = useState<'production' | 'sandbox'>('production');
  const [hidden, setHidden] = useState(false);
  const [screen, setScreen] = useState<Screen>('access');
  // Opening the report sets the filters of Investigate; the key remounts it with them.
  const [report, setReport] = useState(0);
  const [history, setHistory] = useState(false);
  return <section className="prototype-page report-only-prototype" aria-label="Report-only prototype">
    <div className="report-only-controls" aria-label="Prototype controls">
      <span className="cp-admin-label">Prototype · Admin 041</span>
      <nav className="report-only-screens" aria-label="Prototype screens">{screens.map(s => <button key={s.key} type="button" aria-pressed={screen === s.key} onClick={() => { setScreen(s.key); setReport(0); }}>{s.label}</button>)}</nav>
      <button type="button" className="rule-switch" onClick={() => setEnvironment(e => e === 'production' ? 'sandbox' : 'production')}>Environment: {environment}</button>
      <button type="button" className="rule-switch" onClick={() => setBanner(b => b === 'active' ? 'quiet' : 'active')}>Banner: {banner === 'active' ? 'would-deny calls' : 'quiet for 7 days'}</button>
      {hidden ? <button type="button" className="rule-switch" onClick={() => setHidden(false)}>Show banner again</button> : null}
    </div>
    {hidden ? null : <ReportOnlyBanner environment={environment} state={banner} onView={() => { if (banner === 'active') { setScreen('investigate'); setReport(r => r + 1); } else setScreen('access'); }} onDismiss={() => setHidden(true)} />}
    {screen === 'overview' ? <OverviewScreen onReport={() => { setScreen('investigate'); setReport(r => r + 1); }} />
      : screen === 'access' ? <AccessScreen onHistory={() => setHistory(true)} />
      : screen === 'investigate' ? <InvestigateScreen key={report} fromBanner={report > 0} />
        : <InboxScreen onOpen={item => { if (item.kind === 'review-due') setScreen('access'); else if (item.kind === 'report-only') { setScreen('investigate'); setReport(r => r + 1); } }} />}
    {history ? <HistoryPanel agentName="refunds-assistant" onClose={() => setHistory(false)} /> : null}
  </section>;
}
