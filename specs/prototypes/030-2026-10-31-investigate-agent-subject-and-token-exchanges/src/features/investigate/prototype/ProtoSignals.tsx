import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { WaitingBackend } from '../../access/delegation/WaitingBackend';
import { exchanges, exchangeText } from './fixtures';

// Layout prototype (Admin A3): the signals and the overview rows grouped by the verified agent (Backend 034).

// Denied token exchanges become one signal for each agent, reason and UTC hour; expired and invalid tokens also by subject.
export function ProtoExchangeSignals() {
  const navigate = useNavigate();
  const items = exchanges.filter(x => !x.issued && x.count > 1);
  return <div className="attention-table proto-signals" role="table" aria-label="Token exchange signals">
    {items.map(x => <div key={x.id} className="attention-row attention-row--open" role="row">
      <span role="cell"><span className="attention-tag proto-tag">Token exchange denied</span></span>
      <span role="cell" className="attention-main"><strong>{x.count} refused exchanges</strong><small>{exchangeText[x.reason!]}</small></span>
      <span role="cell" className="attention-main attention-context"><code>{x.agent}</code><small>{x.subject ? `for ${x.subject.name} · ${x.subject.issuer}` : x.reason}</small></span>
      <span role="cell" className="attention-when"><time>{x.at} UTC</time><WaitingBackend spec="034" tip="Raises one item when an agent keeps failing to get a token, so a leaked key or a disabled user shows up." /></span>
      <span role="cell" className="attention-action"><button className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => navigate('/prototype/investigate')}>Investigate<ArrowRight size={14} /></button></span>
    </div>)}
  </div>;
}
