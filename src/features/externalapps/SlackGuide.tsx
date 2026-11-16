import { ArrowUpRight, Info } from 'lucide-react';
import { CopyButton } from '../../components/ui/copy/CopyButton';
import { slackManifest } from './slackManifest';

// How to create the Slack app (Admin 059 Solution 5.1): closed by default, at the top of the form.
export function SlackGuide({ name }: { name: string }) {
  const manifest = slackManifest(name);
  return <details className="cp-admin-accordion cp-admin-accordion--info ea-guide">
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
          <p>Choosing the channel in Where messages go does not add the app to it. Slack lets the app post only in channels it is a member of, so in the channel type <code>/invite @{name}</code>. Without it, Slack rejects every message to that channel.</p>
          <p className="ea-tip">A group message or a person needs no step: the app starts that conversation itself.</p>
        </li>
      </ol>
    </div>
  </details>;
}
