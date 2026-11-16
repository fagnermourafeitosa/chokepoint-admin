import { useState } from 'react';
import { ArrowUpRight, Info } from 'lucide-react';
import { CopyButton } from '../../../src/components/ui/copy/CopyButton';
import { Notice } from '../../../src/components/ui/notice/Notice';
import { SelectMenu } from '../../../src/components/ui/dropdown/SelectMenu';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import { AccessNavigation } from '../../../src/features/access/components/AccessNavigation';
import '../../../src/features/access/access.css';
import '../../../src/features/mcp/mcp.css';
import '../../../src/features/identity/identity.css';
import { SlackIcon } from './SlackIcon';
import { TourButton } from './TourButton';
import { destinations, isConfigured, manifest, notRequested, scope, scopes, signalChoices, type Destination } from './data';
import './prototype.css';

// Admin 059 prototype: the configuration of the Slack app. Slack only receives messages: one channel, one
// group message or one person, and the app reads nothing (user, 2026-11-15). Fixed data; Save writes nothing.

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div className="identity-section-heading"><h2>{title}</h2><p>{description}</p></div>;
}

export function SlackAppPrototype() {
  const [kind, setKind] = useState<Destination>('channel');
  const destination = destinations.find(d => d.value === kind) ?? destinations[0];
  // A configured app opens in edit: its logo in color, the saved values, the stored token (user, 2026-11-15).
  const configured = isConfigured();
  const [changingToken, setChangingToken] = useState(false);
  return <main id="main-content" className="admin-page cp-admin-container access-page" aria-label="Access" tabIndex={-1}><AccessNavigation /><section className="identity-editor" aria-label={configured ? 'Edit Slack' : 'Configure Slack'}>
    <a className="cp-admin-button cp-admin-button--secondary trace-back ea-back" href="/prototype/external-apps">Back to Integrations</a>
    <header className="ea-app-head"><SlackIcon size={32} color={configured} /><div><h1 className="cp-admin-title">{configured ? 'Edit Slack' : 'Configure Slack'}</h1><p className="cp-admin-muted">Send messages to one Slack channel, group message or person. The app only sends: it reads nothing in Slack.</p></div></header>
    <form className="cp-admin-panel identity-form identity-form-redesign" onSubmit={e => e.preventDefault()}>
      <details className="cp-admin-accordion cp-admin-accordion--info ea-guide">
        <summary><Info size={16} aria-hidden="true" />How to create the Slack app</summary>
        <div>
          <p className="ea-guide-intro">It takes about five minutes and needs a Slack account that can create apps.</p>
          <ol className="ea-steps">
            <li><strong>Create the app from a manifest</strong>
              <p>Open <a className="cp-admin-docs-link" href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer">api.slack.com/apps <ArrowUpRight size={14} aria-hidden="true" /></a>, choose <b>Create New App</b>, then <b>From a manifest</b>, and pick your Slack workspace.</p>
            </li>
            <li><strong>Paste this manifest</strong>
              <p>It asks only for <code>chat:write</code> and <code>mpim:write</code>.</p>
              <pre className="identity-code ea-manifest">{manifest}</pre>
              <div className="ea-row"><CopyButton label="Copy manifest" value={manifest} /></div>
            </li>
            <li><strong>Install the app</strong>
              <p>In <b>Install App</b>, choose <b>Install to Workspace</b>. If your Slack workspace requires approval, a Slack admin approves it first.</p>
            </li>
            <li><strong>Copy the token</strong>
              <p>In <b>OAuth &amp; Permissions</b>, copy the <b>Bot User OAuth Token</b> (it starts with <code>xoxb-</code>) and paste it in App credentials below.</p>
            </li>
            <li><strong>If you send to a channel, add the app to it</strong>
              <p>Choosing the channel in Where messages go does not add the app to it. Slack lets the app post only in channels it is a member of, so in the channel type <code>/invite @Acme alerts</code>. Without it, Slack rejects every message to that channel.</p>
              <p className="ea-tip">A group message or a person needs no step: the app starts that conversation itself.</p>
            </li>
          </ol>
        </div>
      </details>
      <div className="identity-form-section">
        <SectionHeading title="What the app can do in Slack" description="The manifest asks Slack for these two scopes and no other. Your Slack admin sees the same list when approving the app." />
        <div className="identity-form-fields">
          <div className="cp-admin-table-scroll" role="region" aria-label="Slack scopes" tabIndex={0}><table className="cp-admin-table ea-scopes">
            <thead><tr><th>Scope</th><th>Allows</th></tr></thead>
            <tbody>{scopes.map(item => <tr key={item.scope}><td><code>{item.scope}</code></td><td>{item.allows}</td></tr>)}</tbody>
          </table></div>
          <p className="ea-not-requested"><strong>Never requested:</strong> {notRequested}</p>
          <Notice tone="info" title="Nothing is retained">The messages are sent to Slack and not kept here. Nothing is read from Slack, so nothing from Slack is stored.</Notice>
        </div>
      </div>
      <div className="identity-form-section">
        <SectionHeading title="Where messages go" description="One destination for this environment." />
        <div className="identity-form-fields">
          <small className="cp-admin-muted">{scope.workspace} / {scope.environment}</small>
          <label className="cp-admin-field">Send to<SelectMenu block label="Send to" value={kind} onChange={v => setKind(v as Destination)} options={destinations.map(d => ({ value: d.value, label: d.label }))} /></label>
          <label className="cp-admin-field">{destination.field}<input className="cp-admin-input identity-mono" placeholder={destination.placeholder} defaultValue={configured && kind === 'channel' ? 'C08K2M4QF1A' : undefined} /><small>{destination.help}</small></label>
          {kind === 'channel' ? <Notice tone="warning" title="Add the app to this channel in Slack"><span>Choosing the channel here does not add the app to it, and Slack lets the app post only in channels it is a member of. In the channel, type <code>/invite @Acme alerts</code>. Without it, Slack rejects every message to the channel.</span></Notice> : null}
        </div>
      </div>
      <div className="identity-form-section">
        <SectionHeading title="What to send" description="Choose which Inbox signals become a Slack message. Each new signal sends one message with a link to it." />
        <div className="identity-form-fields ea-signals">
          {signalChoices.map(item => <label key={item.type} className="cp-admin-choice"><input className="cp-admin-switch" type="checkbox" role="switch" defaultChecked={item.on} /><span className="cp-admin-choice-copy"><strong>{item.label}</strong><small>{item.description}</small></span></label>)}
          <span className="ea-row"><WaitingBackend spec="098" tip="Stores which Inbox signal types send a Slack message, and sends one message for each new signal of those types." /></span>
        </div>
      </div>
      <div className="identity-form-section ea-credentials">
        <SectionHeading title="App credentials" description="The token of the Slack app that sends the messages." />
        <div className="identity-form-fields">
          <label className="cp-admin-field">Bot User OAuth Token{configured && !changingToken
            ? <span className="identity-secret-row"><input className="cp-admin-input" type="password" disabled value="••••••••••••" aria-label="Stored token" /><button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => setChangingToken(true)}>Change</button></span>
            : <input className="cp-admin-input" type="password" autoComplete="new-password" placeholder="xoxb-…" />}<small>OAuth &amp; Permissions, OAuth Tokens. Stored encrypted. It cannot be displayed after you save.</small></label>
          <div className="identity-inline-check"><button type="button" className="cp-admin-button cp-admin-button--secondary">Send test message</button><WaitingBackend spec="098" tip="Sends one test message to the destination with the token, to check the token, the destination and that the app was added to the channel." /></div>
        </div>
      </div>
      {/* An editor of one item: Cancel and Save on the right (docs/design-system/layouts.md). */}
      <footer className="identity-form-actions ea-footer"><span /><WaitingBackend spec="098" tip="Stores the destination and the encrypted token of the Slack app of this environment." /><a className="cp-admin-button cp-admin-button--ghost" href="/prototype/external-apps">Cancel</a><button className="cp-admin-button" type="submit">Save</button></footer>
    </form>
    <TourButton />
  </section></main>;
}
