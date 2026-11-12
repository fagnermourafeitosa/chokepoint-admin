// The stops of the first-access tour (Admin 052). Each stop shows a part of a real screen of the Sandbox.
// The tour knows no name of the sample: a stop whose target is not on the screen is skipped.

export type StopAction = 'agent-delegation' | 'tool-rules' | 'agent-identity' | 'agent-sessions';

export type TourStop = {
  // Path of the Admin screen, with its query.
  path: string;
  target: string;
  // Distance between the tooltip and its target, in pixels.
  offset?: number;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: StopAction;
  title: string;
  content: string;
  // Commands that the tooltip shows as code.
  code?: string;
};

export const tourStops: TourStop[] = [
  {
    path: '/',
    target: 'body',
    placement: 'center',
    title: 'Your Sandbox is ready',
    content: 'Take a look at its identity providers, MCP servers, context sources, agents, rules and calls.',
  },
  {
    path: '/',
    target: '.admin-environment',
    title: 'Sandbox and Production',
    content: 'Try things in Sandbox. Production is for your real setup.',
  },
  {
    path: '/access/integrations?type=identity',
    target: '.identity-registry',
    placement: 'top',
    title: 'Identity provider',
    content: 'The people of an identity provider delegate to agents, and each agent acts for them.',
  },
  {
    path: '/access/integrations?type=custom',
    target: '.mcp-registry [aria-label="MCP servers table"]',
    placement: 'top',
    title: 'MCP server',
    content: 'The tools of each MCP server are discovered and reviewed before an agent can call them.',
  },
  {
    path: '/access/context-sources',
    target: '.source-manager',
    placement: 'top',
    title: 'Context source',
    content: 'A context source receives the person of the call and returns trusted attributes. Rules read them.',
  },
  {
    path: '/access',
    target: '.access-workbench',
    placement: 'top',
    action: 'agent-delegation',
    title: 'Agent and permissions',
    content: 'Who delegates to the agent and the tools that it can call.',
  },
  {
    path: '/access',
    target: '.cp-admin-side-panel',
    placement: 'left',
    action: 'tool-rules',
    title: 'Rules of a tool',
    content: 'Rules restrict each call of a tool. A rule reads the arguments of the call or a trusted attribute of the person.',
  },
  {
    path: '/access',
    target: '[aria-label="Harness login"]',
    placement: 'top',
    action: 'agent-identity',
    title: 'Claude Code is allowed',
    content: 'Claude Code can log in to this agent. The MCP URL of its server is on this card.',
  },
  {
    path: '/access',
    target: '[aria-label="Harness login"]',
    placement: 'top',
    action: 'agent-identity',
    title: 'Set up Claude Code',
    content: 'Add the server in your terminal. Then open Claude Code, run /mcp and log in with your identity provider.',
    // --client-id sends the Claude Code client metadata URL. Without it, Claude Code tries dynamic client
    // registration, which the platform does not offer (dev-infra/functional-tests/harness-cli.md).
    code: 'claude mcp add --transport http --client-id https://claude.ai/oauth/claude-code-client-metadata agent <MCP URL>',
  },
  {
    path: '/access',
    target: '[aria-label="Harness sessions"]',
    placement: 'top',
    action: 'agent-sessions',
    title: 'Harness sessions',
    content: 'Each person and machine that logged in from Claude Code shows here. You can revoke one machine or block a person.',
  },
  {
    path: '/investigate',
    // The list is taller than the window: the tooltip shows below the title of the list.
    target: '.trace-list-title',
    placement: 'bottom',
    offset: 24,
    title: 'Calls',
    content: 'Each call of an agent, allowed or denied, with the rule that applied. Your calls from Claude Code show here too.',
  },
];
