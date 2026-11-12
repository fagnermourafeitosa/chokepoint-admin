// Fixed data for the first-access onboarding prototype (Admin 052). Not real fields or endpoints.
// The tour goes through the real screens. On the demo instance, the Acme data stand in for the sample of the Sandbox.

// What the tour does on the screen before a stop shows (see FirstAccess.tsx).
export type StopAction = 'agent-delegation' | 'tool-rules' | 'agent-identity' | 'agent-sessions';

export type TourStop = {
  // Path under /prototype/first-access, with its query.
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
    path: '',
    target: 'body',
    placement: 'center',
    title: 'Your Sandbox is ready',
    content: 'It comes with a sample: an identity provider, an agent, an MCP server, a context source, rules and calls. Explore it before you set up your own.',
  },
  {
    path: '',
    target: '.admin-environment',
    title: 'Sandbox and Production',
    content: 'The sample is in Sandbox. Production is empty, for your own setup.',
  },
  {
    path: 'integrations?type=identity',
    target: '.identity-registry',
    placement: 'top',
    title: 'Identity provider',
    content: 'The sample identity provider has fictitious people. They delegate to the sample agent, and the agent acts for them.',
  },
  {
    path: 'integrations?type=custom',
    target: '.mcp-registry [aria-label="MCP servers table"]',
    placement: 'top',
    title: 'MCP server',
    content: 'The sample MCP server has billing tools, get_order and refund_order. They were discovered and reviewed.',
  },
  {
    path: 'context-sources',
    target: '.source-manager',
    placement: 'top',
    title: 'Context source',
    content: 'The sample context source receives the person of the call and returns a trusted attribute. A rule reads it.',
  },
  {
    path: 'permissions',
    target: '.access-workbench',
    placement: 'top',
    action: 'agent-delegation',
    title: 'Agent and permissions',
    content: 'Who delegates to the sample agent and the tools that it can call.',
  },
  {
    path: 'permissions',
    target: '.cp-admin-side-panel',
    placement: 'left',
    action: 'tool-rules',
    title: 'Rules of a tool',
    content: 'Rules restrict each call of a tool. One rule reads the arguments of the call. The other reads the trusted attribute that the context source returns for the person.',
  },
  {
    path: 'permissions',
    target: '[aria-label="Harness login"]',
    placement: 'top',
    action: 'agent-identity',
    title: 'Claude Code is allowed',
    content: 'Claude Code can log in to the sample agent. Copy the MCP URL of the sample server from this card.',
  },
  {
    path: 'permissions',
    target: '[aria-label="Harness login"]',
    placement: 'top',
    action: 'agent-identity',
    title: 'Set up Claude Code',
    content: 'Add the server in your terminal. Then open Claude Code, run /mcp and log in as one of the sample people, with the password 123.',
    // --client-id sends the Claude Code client metadata URL. Without it, Claude Code tries dynamic client
    // registration, which the platform does not offer (dev-infra/functional-tests/harness-cli.md).
    code: 'claude mcp add --transport http --client-id https://claude.ai/oauth/claude-code-client-metadata sample <MCP URL>',
  },
  {
    path: 'permissions',
    target: '[aria-label="Harness sessions"]',
    placement: 'top',
    action: 'agent-sessions',
    title: 'Harness sessions',
    content: 'Each person and machine that logged in from Claude Code shows here. You can revoke one machine or block a person.',
  },
  {
    path: 'investigate',
    // The list is taller than the window: the tooltip shows below the title of the list.
    target: '.trace-list-title',
    placement: 'bottom',
    offset: 24,
    title: 'Calls',
    content: 'Each call of the sample agent, allowed or denied, with the rule that applied. Your calls from Claude Code show here too.',
  },
];
