import { ExternalLink } from 'lucide-react';

const register = 'https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app';
const permissions = 'https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app';

// This explains the platform's one-time setup without collecting deployment secrets.
export function GitHubSetupGuide({ callback }: { callback: string }) {
  return <details className="github-setup-guide">
    <summary>How to set up GitHub</summary>
    <p>Register your customer’s GitHub App, then save its credentials below. This configuration belongs only to the selected workspace and environment.</p>
    <ol className="github-setup-steps">
      <li><div><h4>Register your GitHub App</h4><p>In GitHub, open Settings → Developer settings → GitHub Apps → New GitHub App. Use an app owned by your GitHub account or organization.</p><a href={register} target="_blank" rel="noreferrer">GitHub registration guide <ExternalLink size={13} aria-hidden="true" /></a></div></li>
      <li><div><h4>Set the callback and permissions</h4><p>Set the user authorization callback to the URL below. Keep user token expiration enabled. Select only the permissions required by the tools you want to use.</p><code className="github-setup-value">{callback}</code><p>This integration does not receive GitHub webhooks; leave webhook delivery inactive.</p><a href={permissions} target="_blank" rel="noreferrer">Choose GitHub App permissions <ExternalLink size={13} aria-hidden="true" /></a></div></li>
      <li><div><h4>Save your app credentials</h4><p>From the app settings, copy the <strong>Client ID</strong> (not the App ID) and generate a client secret. Enter both values in the application form below. The secret is encrypted and is never displayed after saving.</p><p>No API restart is required.</p></div></li>
      <li><div><h4>Install, connect and review</h4><p>Install the app on the GitHub account or organization whose repositories you want to access. Then return here, click <strong>Connect GitHub</strong>, authorize your account and review the discovered tools.</p></div></li>
    </ol>
  </details>;
}
