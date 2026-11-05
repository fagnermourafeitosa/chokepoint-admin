import { useState } from 'react';
import { Ban, Check, KeyRound, Laptop, ShieldCheck, Users } from 'lucide-react';
import { WaitingBackend } from '../../access/delegation/WaitingBackend';
import { consentTools as tools } from './data';
import './harness-login.css';

// Layout prototype (Backend 045): the pages that the Chokepoint authorization server shows to a
// person who logs in from a coding harness. The AS serves them at the issuer origin, without the
// Admin shell. Fixed data; the step bar exists only in this prototype.

type Step = 'idp' | 'agent' | 'consent' | 'done' | 'no-group' | 'blocked';
const steps: [Step, string][] = [['idp', '1 · Choose provider'], ['agent', '2 · Choose agent'], ['consent', '3 · Consent'], ['done', '4 · Done'], ['no-group', 'Refused · no group'], ['blocked', 'Refused · blocked']];

function Brand() {
  return <header className="hl-brand"><img src="/favicon.svg" alt="" /><span>Chokepoint</span><small>Acme · Sandbox</small></header>;
}

function Client() {
  return <p className="hl-client"><Laptop size={16} aria-hidden="true" /><span><strong>Claude Code</strong> on this computer is asking to act for you.</span></p>;
}

export function HarnessLoginPages() {
  const [step, setStep] = useState<Step>('consent');
  return <section className="hl-stage" aria-label="Harness login pages">
    <nav className="hl-steps" aria-label="Prototype steps">{steps.map(([s, label]) => <button key={s} type="button" aria-pressed={step === s} onClick={() => setStep(s)}>{label}</button>)}<WaitingBackend spec="045" tip="Pages served by the authorization server." /></nav>
    <main className="hl-page">
      <Brand />
      {step === 'idp' ? <div className="hl-card">
        <h1>Sign in to continue</h1><Client />
        <p className="hl-muted">Choose how you sign in at Acme.</p>
        <div className="hl-options">
          <button type="button" onClick={() => setStep('agent')}><KeyRound size={18} aria-hidden="true" /><span><strong>Acme employees</strong><small>Keycloak · sso.acme.com</small></span></button>
          <button type="button" onClick={() => setStep('agent')}><KeyRound size={18} aria-hidden="true" /><span><strong>Acme contractors</strong><small>Google Workspace · acme-partners.com</small></span></button>
        </div>
        <p className="hl-foot">Shown only when more than one provider allows harness login.</p>
      </div> : null}

      {step === 'agent' ? <div className="hl-card">
        <h1>Choose how Claude Code works for you</h1><Client />
        <p className="hl-muted">Signed in as <strong>Alice Martins</strong> (alice@acme.com). Your groups give you two options.</p>
        <div className="hl-options">
          <button type="button" onClick={() => setStep('consent')}><Users size={18} aria-hidden="true" /><span><strong>Claude Code — Developers</strong><small>GitHub and Jira · via group developers</small></span></button>
          <button type="button" onClick={() => setStep('consent')}><Users size={18} aria-hidden="true" /><span><strong>Claude Code — SRE</strong><small>PagerDuty, Grafana, GitHub · via group sre</small></span></button>
        </div>
        <p className="hl-foot">Shown only when the person is eligible for more than one agent of this harness.</p>
      </div> : null}

      {step === 'consent' ? <div className="hl-card">
        <h1>Allow Claude Code — Developers to act for you?</h1><Client />
        <p className="hl-muted">Signed in as <strong>Alice Martins</strong> (alice@acme.com) · group developers</p>
        <div className="hl-section"><h2>It will be able to use</h2>
          <ul className="hl-tools">{tools.map(t => <li key={t.server}><strong>{t.server}</strong><span>{t.items.join(' · ')}</span>{t.note ? <small>{t.note}</small> : null}</li>)}</ul>
          <small className="hl-muted">Every call is checked by Chokepoint with the rules your administrator set. You can not change them here.</small>
        </div>
        <div className="hl-section hl-facts">
          <p><ShieldCheck size={16} aria-hidden="true" /><span>Valid for <strong>7 days</strong>, until Nov 10, 2026. Then Claude Code asks you to sign in again.</span></p>
          <p><Laptop size={16} aria-hidden="true" /><span>Only for this computer. Your administrator can revoke it at any time.</span></p>
        </div>
        <div className="hl-actions"><button type="button" className="hl-secondary">Deny</button><button type="button" className="hl-primary" onClick={() => setStep('done')}>Allow</button></div>
      </div> : null}

      {step === 'done' ? <div className="hl-card hl-center">
        <Check size={32} aria-hidden="true" className="hl-ok" />
        <h1>You are connected</h1>
        <p className="hl-muted">Return to Claude Code. You can close this tab.</p>
      </div> : null}

      {step === 'no-group' ? <div className="hl-card hl-center">
        <Ban size={32} aria-hidden="true" className="hl-no" />
        <h1>You can not use Claude Code here</h1>
        <p className="hl-muted">Signed in as <strong>Bruno Lima</strong>. Your account is not in a group that your administrator allowed for Claude Code at Acme.</p>
        <p className="hl-muted">Ask your administrator for access. Reference <code>ax-7f3k</code>.</p>
      </div> : null}

      {step === 'blocked' ? <div className="hl-card hl-center">
        <Ban size={32} aria-hidden="true" className="hl-no" />
        <h1>Access to Claude Code is blocked</h1>
        <p className="hl-muted">Your administrator blocked your access to Claude Code — Developers at Acme. Contact them if you think this is a mistake. Reference <code>ax-9q2m</code>.</p>
      </div> : null}
    </main>
  </section>;
}
