// Admin 059 prototype: fixed data. Not real fields, endpoints or states (specs/prototypes/README.md).

export type AppStatus = 'not-configured' | 'configured' | 'under-construction';
export type ExternalApp = { id: string; name: string; description: string; status: AppStatus; page: string };
export type AppCategory = { name: string; description: string; apps: ExternalApp[] };

// The categories of the External apps tab, in order. Communication is the first (user, 2026-11-15).
export const categories: AppCategory[] = [
  {
    name: 'Communication',
    description: 'Chat and messaging apps that receive messages.',
    apps: [
      { id: 'slack', name: 'Slack', description: 'Sends messages to one channel, group message or person. Reads nothing.', status: 'not-configured', page: '/prototype/external-apps-slack' },
    ],
  },
  // Under construction: shown so the catalog reads as it will be, never clickable (user, 2026-11-15).
  {
    name: 'Code repositories',
    description: 'Where the code of your teams lives.',
    apps: [
      { id: 'github', name: 'GitHub', description: 'Repositories, issues and pull requests.', status: 'under-construction', page: '' },
      { id: 'gitlab', name: 'GitLab', description: 'Repositories, issues and merge requests.', status: 'under-construction', page: '' },
    ],
  },
  {
    name: 'Project management',
    description: 'Where your teams plan and track work.',
    apps: [
      { id: 'atlassian', name: 'Atlassian', description: 'Jira issues and Confluence pages.', status: 'under-construction', page: '' },
    ],
  },
  {
    name: 'Payments',
    description: 'Where your business charges and pays.',
    apps: [
      { id: 'stripe', name: 'Stripe', description: 'Customers, charges and refunds.', status: 'under-construction', page: '' },
    ],
  },
];

// Prototype only: ?configured=1 shows Slack configured (colored logo, edit page).
export const isConfigured = () => new URLSearchParams(window.location.search).get('configured') === '1';

// The workspace and environment that the configuration belongs to.
export const scope = { workspace: 'Acme', environment: 'Production' };

// Slack only receives messages: the administrator picks one channel, one group message or one person, and
// the app reads nothing (user, 2026-11-15). Bot scopes, the minimum to send to those three destinations.
export type SlackScope = { scope: string; allows: string };
export const scopes: SlackScope[] = [
  { scope: 'chat:write', allows: 'Send messages to a channel that the app was added to, and to a person, in the direct message of the app.' },
  { scope: 'mpim:write', allows: 'Start the group message with the chosen people, to send to it.' },
];

// What the manifest never asks for (user, 2026-11-15).
export const notRequested = 'Any read scope: no messages, channel lists, members, user profiles, email addresses or files. The app cannot read anything in Slack.';

export type Destination = 'channel' | 'group' | 'person';
export const destinations: { value: Destination; label: string; field: string; placeholder: string; help: string }[] = [
  { value: 'channel', label: 'Channel · public or private', field: 'Channel ID', placeholder: 'C08K2M4QF1A', help: 'In Slack, open the channel, click its name and copy the Channel ID at the bottom.' },
  { value: 'group', label: 'Group message · up to 8 people', field: 'Member IDs', placeholder: 'U07AB12CD3E, U07FG45HI6J, U07KL78MN9P', help: 'Separate the IDs with commas. In Slack, open each profile, click the three dots and choose Copy member ID.' },
  { value: 'person', label: 'Person · direct message', field: 'Member ID', placeholder: 'U07AB12CD3E', help: 'In Slack, open the profile, click the three dots and choose Copy member ID. The message arrives in the direct message with the app.' },
];

// What is sent: the administrator chooses which Inbox signal types become a Slack message (user, 2026-11-15).
// One message for each new signal, with a link to it in the Admin. The types are the Inbox signal types.
export const signalChoices: { type: string; label: string; description: string; on: boolean }[] = [
  { type: 'requests-denied', label: 'Requests denied', description: 'Calls were denied, grouped by server, tool and agent for each hour.', on: true },
  { type: 'tool-discovery', label: 'Tool discovery', description: 'A discovery found new or changed tools that wait for review.', on: true },
  { type: 'mcpserver_disconnected', label: 'Server disconnected', description: 'An automatic rediscovery could not reach an MCP server.', on: true },
  { type: 'token_exchange_denied', label: 'Token exchange denied', description: 'A token exchange for an agent was denied.', on: false },
  { type: 'report-only-would-deny', label: 'Would deny', description: 'An agent in Report-only made calls that would be denied.', on: false },
  { type: 'report-only-review-due', label: 'Review due', description: 'The review date of an agent in Report-only has passed.', on: false },
];

export const manifest =`display_information:
  name: Acme alerts
  description: Sends messages to one channel, group message or person. Reads nothing.
features:
  app_home:
    home_tab_enabled: false
    messages_tab_enabled: true
    messages_tab_read_only_enabled: true
  bot_user:
    display_name: Acme alerts
    always_online: false
oauth_config:
  scopes:
    bot:
${scopes.map(item => `      - ${item.scope}`).join('\n')}
settings:
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false`;
