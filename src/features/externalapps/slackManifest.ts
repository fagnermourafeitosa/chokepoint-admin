// The Slack app of Admin 059: a bot with chat:write and mpim:write only, and the Messages
// tab on and read-only, so a person receives messages and cannot reply (Backend 098).
export const slackScopes: { scope: string; allows: string }[] = [
  { scope: 'chat:write', allows: 'Send messages to a channel that the app was added to, and to a person, in the direct message of the app.' },
  { scope: 'mpim:write', allows: 'Start the group message with the chosen people, to send to it.' },
];

export const neverRequested = 'Any read scope: no messages, channel lists, members, user profiles, email addresses or files. The app cannot read anything in Slack.';

// appName is the name of the Slack app: the workspace name and "alerts", at most 35
// characters, the Slack limit for an app name.
export const appName = (workspace: string) => `${workspace.trim() || 'Workspace'} alerts`.slice(0, 35);

const yamlText = (value: string) => JSON.stringify(value);

export function slackManifest(name: string) {
  return `display_information:
  name: ${yamlText(name)}
  description: Sends messages to one channel, group message or person. Reads nothing.
features:
  app_home:
    home_tab_enabled: false
    messages_tab_enabled: true
    messages_tab_read_only_enabled: true
  bot_user:
    display_name: ${yamlText(name)}
    always_online: false
oauth_config:
  scopes:
    bot:
${slackScopes.map(s => `      - ${s.scope}`).join('\n')}
settings:
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false`;
}

// The Inbox signal types that can send a message, with the three on by default (Admin 059).
// Lethal trifecta is the signal of Backend 097, off by default (user, 2026-11-15); Behavior drift too (Admin 060).
export const signalChoices: { type: string; label: string; description: string; on: boolean }[] = [
  { type: 'requests-denied', label: 'Requests denied', description: 'Calls were denied, grouped by server, tool and agent for each hour.', on: true },
  { type: 'tool-discovery', label: 'Tool discovery', description: 'A discovery found new or changed tools that wait for review.', on: true },
  { type: 'mcpserver_disconnected', label: 'Server disconnected', description: 'An automatic rediscovery could not reach an MCP server.', on: true },
  { type: 'token_exchange_denied', label: 'Token exchange denied', description: 'A token exchange for an agent was denied.', on: false },
  { type: 'report-only-would-deny', label: 'Would deny', description: 'An agent in Report-only made calls that would be denied.', on: false },
  { type: 'report-only-review-due', label: 'Review due', description: 'The review date of an agent in Report-only has passed.', on: false },
  { type: 'lethal-trifecta', label: 'Lethal trifecta', description: 'A session of an agent read private data, took in untrusted content and sent data out.', on: false },
  // Backend 099: off by default (Admin 060 decision 7).
  { type: 'behavior-drift', label: 'Behavior drift', description: 'An agent left its usage pattern: a spike, a new tool or a new sequence of calls.', on: false },
];
