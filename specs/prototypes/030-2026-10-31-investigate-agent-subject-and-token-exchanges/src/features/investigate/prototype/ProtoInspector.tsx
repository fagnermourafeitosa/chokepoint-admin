import { useState } from 'react';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Link } from 'react-router';
import { WaitingBackend } from '../../access/delegation/WaitingBackend';
import { decisions, denyText, exchanges, exchangeText, stepLabel, type Decision, type Exchange, type ExchangeReason, type StepState } from './fixtures';

const stateText: Record<StepState, string> = { passed: 'Passed', failed: 'Failed', not_applicable: 'Not applicable', not_evaluated: 'Not evaluated' };

function action(d: Decision): { label: string; to: string } | undefined {
  switch (d.reason) {
    case 'no_delegation': return { label: `Let ${d.subject.name} delegate to ${d.agent}`, to: '/access' };
    case 'no_grant': return { label: `Add ${d.server} · ${d.tool} to ${d.agent}`, to: '/access' };
    case 'no_resource': return { label: `Allow ${d.resource?.value} for ${d.tool}`, to: '/access' };
    case 'condition': return { label: 'Open the rule', to: '/access' };
    case 'tool_not_reviewed': return { label: 'Review the tool', to: '/access/integrations?type=custom' };
    default: return undefined;
  }
}

const exchangeAction: Record<ExchangeReason, { label: string; to: string; hint: string }> = {
  invalid_client: { label: 'Open the agent identity', to: '/access', hint: 'If the file is old or exposed, rotate the key and give the new file to the agent.' },
  subject_token_expired: { label: 'Open the identity provider', to: '/access/integrations?type=identity', hint: 'Check if the provider disabled this user. If not, the agent must renew the token of the user.' },
  subject_token_invalid: { label: 'Open the identity provider', to: '/access/integrations?type=identity', hint: 'Check the issuer and the accepted audiences of the connection, and the token the agent sends.' },
  subject_connection_disabled: { label: 'Open the identity provider', to: '/access/integrations?type=identity', hint: 'An administrator disabled this connection. Enable it if its users must use agents again.' },
  no_delegation: { label: 'Open who can delegate', to: '/access', hint: 'Select this subject in the identity provider of the agent if it must use the agent.' },
};


// The occurrences of the window, one row each, like the live breakdown. Times are spread between first and last.
function times(first: string, last: string, count: number) {
  const a = Date.parse(first.replace(' ', 'T') + 'Z'), b = Date.parse(last.replace(' ', 'T') + 'Z');
  return Array.from({ length: count }, (_, i) => new Date(b - (count > 1 ? ((b - a) * i) / (count - 1) : 0)).toISOString().slice(0, 16).replace('T', ' '));
}

const pageSize = 6;
const hourWindow = (t: string) => `${t.slice(0, 13)}:00 – ${t.slice(0, 11)}${String(Number(t.slice(11, 13)) + 1).padStart(2, '0')}:00 UTC`;

// The occurrences of the problem, always visible and paged, like the live breakdown. A click shows that occurrence.
function Breakdown({ title, at, selected, onSelect, who, result }: { title: string; at: string[]; selected: number; onSelect: (i: number) => void; who: string; result: string }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(at.length / pageSize));
  return <section className="trace-breakdown"><h3>{title} · {at.length}</h3>
    <div className="trace-breakdown-list">{at.slice(page * pageSize, page * pageSize + pageSize).map((t, k) => { const i = page * pageSize + k; return <button key={i} type="button" className={i === selected ? 'is-selected' : undefined} onClick={() => onSelect(i)}>
      <code>{t} UTC</code><span>{who}</span><span>{result}</span>
    </button>; })}</div>
    <div className="trace-pager"><span>{at.length} records</span><button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button><span>{page + 1} / {pages}</span><button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}>Next</button></div>
  </section>;
}

function RepeatBox({ count, sameText, outcome, first, last }: { count: number; sameText: string; outcome: string; first: string; last: string }) {
  return <section className="trace-repetition">
    <h3>Repeated in this window</h3>
    <p>{sameText}</p>
    <strong>{count} {outcome}</strong>
    <small>Window {hourWindow(last)}</small>
    <small>First {first} UTC</small>
    <small>Last {last} UTC</small>
  </section>;
}

function Back({ onBack }: { onBack: () => void }) {
  return <button className="cp-admin-button cp-admin-button--secondary trace-back" onClick={onBack}><ArrowLeft size={15} aria-hidden="true" />Back to the list</button>;
}

function Header({ kicker, id, at, ok, okText, failText, title, text }: { kicker: string; id: string; at: string; ok: boolean; okText: string; failText: string; title: string; text: string }) {
  return <>
    <header className="trace-inspector-header"><span className="proto-kicker"><span className="attention-kicker">{kicker}</span><WaitingBackend spec="034" tip="Explains this record with the agent, the subject and the relations that decided." /></span><code>{id} · {at} UTC</code></header>
    <div className="trace-title"><span className={`trace-outcome trace-outcome-large ${ok ? 'trace-allow' : 'trace-deny'}`}>{ok ? <Check size={19} /> : <X size={19} />}{ok ? okText : failText}</span><h2>{title}</h2><p>{text}</p></div>
  </>;
}

function DecisionDetail({ d, onBack }: { d: Decision; onBack: () => void }) {
  const next = action(d);
  const [selected, setSelected] = useState(0);
  return <><Back onBack={onBack} /><article className="cp-admin-panel trace-inspector">
    <Header kicker="Decision inspector" id={selected ? `${d.id}-${selected}` : d.id} at={times(d.first, d.at, d.count)[selected]} ok={d.permit} okText="Allowed" failText="Denied" title={d.tool} text={d.reason ? denyText[d.reason] : 'Every check passed.'} />
    <p className="proto-who"><strong>{d.agent}</strong> acted for <strong>{d.subject.name}</strong> ({d.subject.kind === 'person' ? 'Person' : 'Service'} · {d.subject.issuer})</p>
    <ol className="trace-path proto-path" aria-label="Authorization path">{d.steps.map(s => <li key={s.key} data-state={s.state} tabIndex={0}>
      <span className="trace-path-dot" /><strong>{stepLabel[s.key]}</strong><small>{stateText[s.state]}</small><span className="proto-relation">{s.relation}</span>
    </li>)}</ol>
    <div className="trace-detail-columns">
      <section className="trace-rule">
        <h3>Rules of {d.agent} · {d.server} · {d.tool}</h3>
        {d.rules.length ? d.rules.map(r => <div key={r.name} className="trace-policy proto-rule">
          <strong>{r.name}</strong>
          <small>{r.result === undefined ? 'Not evaluated: an earlier check failed.' : r.result ? 'Passed' : 'Failed'}{r.bindings.length ? ` · reads ${r.bindings.join(', ')}` : ' · reads call arguments only'}</small>
          <details className="rule-cel"><summary>CEL</summary><code>{r.expression}</code></details>
        </div>) : <p className="cp-admin-muted">No rule on this tool.</p>}
        <p className="cp-admin-muted relation-note">Values of the call and of the attribute sources are never recorded.</p>
        {next ? <div className="trace-actions"><Link className="cp-admin-button" to={next.to}>{next.label}</Link></div> : null}
      </section>
      <RepeatBox count={d.count} sameText="Same agent, subject, server, tool and result." outcome={d.permit ? 'allowed' : 'denied'} first={d.first} last={d.at}  />
    </div>
    <Breakdown title="Decisions in this problem" at={times(d.first, d.at, d.count)} selected={selected} onSelect={setSelected} who={d.subject.name} result={d.permit ? 'Allowed' : `Denied · ${d.reason}`} />
    <dl className="trace-facts">
      {[['Agent', d.agent], ['On behalf of', `${d.subject.name} (${d.subject.subject})`], ['Identity provider', d.subject.issuer], ['Server', d.server], ['Tool', d.tool], ['Resource', d.resource ? `${d.resource.type} › ${d.resource.value}` : 'No resource check'], ['Decided at (UTC)', d.at]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
    </dl>
  </article></>;
}

function ExchangeDetail({ x, onBack }: { x: Exchange; onBack: () => void }) {
  const next = x.reason ? exchangeAction[x.reason] : undefined;
  const [selected, setSelected] = useState(0);
  return <><Back onBack={onBack} /><article className="cp-admin-panel trace-inspector">
    <Header kicker="Token exchange" id={selected ? `${x.id}-${selected}` : x.id} at={times(x.first, x.at, x.count)[selected]} ok={x.issued} okText="Issued" failText="Refused" title={x.agent} text={x.reason ? exchangeText[x.reason] : 'Chokepoint issued a token for 5 minutes.'} />
    <div className="trace-detail-columns">
      <section className="trace-rule">
        <h3>{x.issued ? 'What happened' : 'What to check'}</h3>
        {next ? <><p>{next.hint}</p><div className="trace-actions"><Link className="cp-admin-button" to={next.to}>{next.label}</Link></div></> : <p>The agent proved its key, the token of the subject was valid and the subject delegated to the agent.</p>}
      </section>
      <RepeatBox count={x.count} sameText={`Same agent${x.subject ? ', subject' : ''} and reason.`} outcome={x.issued ? 'issued' : 'refused'} first={x.first} last={x.at}  />
    </div>
    <Breakdown title="Exchanges in this problem" at={times(x.first, x.at, x.count)} selected={selected} onSelect={setSelected} who={x.subject ? x.subject.name : 'Subject not verified'} result={x.issued ? 'Issued' : `Refused · ${x.reason}`} />
    <dl className="trace-facts">
      {[['Agent', x.agent], ['Subject', x.subject ? `${x.subject.name} (${x.subject.subject})` : 'Not verified: the token signature was not valid'], ['Identity provider', x.subject?.issuer ?? '—'], ['Reason', x.reason ?? '—'], ['Returned to the agent', x.issued ? 'A Chokepoint token for 5 minutes' : x.reason === 'invalid_client' ? 'invalid_client' : 'invalid_grant'], ['At (UTC)', x.at]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
    </dl>
  </article></>;
}

export function ProtoInspector({ kind, id, onBack }: { kind: 'decision' | 'exchange'; id: string; onBack: () => void }) {
  if (kind === 'decision') { const d = decisions.find(x => x.id === id); return d ? <DecisionDetail d={d} onBack={onBack} /> : null; }
  const x = exchanges.find(e => e.id === id);
  return x ? <ExchangeDetail x={x} onBack={onBack} /> : null;
}
