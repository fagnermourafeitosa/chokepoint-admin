// The external apps by category, in order (Admin 059 Solution 2 to 4). Slack is the only
// app that exists; the others are shown as under construction and cannot be opened.
export type CatalogApp = { id: string; name: string; description: string; available: boolean };
export type CatalogCategory = { name: string; description: string; apps: CatalogApp[] };

export const catalog: CatalogCategory[] = [
  {
    name: 'Communication',
    description: 'Chat and messaging apps that receive messages.',
    apps: [{ id: 'slack', name: 'Slack', description: 'Sends messages to one channel, group message or person. Reads nothing.', available: true }],
  },
  {
    name: 'Code repositories',
    description: 'Where the code of your teams lives.',
    apps: [
      { id: 'github', name: 'GitHub', description: 'Repositories, issues and pull requests.', available: false },
      { id: 'gitlab', name: 'GitLab', description: 'Repositories, issues and merge requests.', available: false },
    ],
  },
  {
    name: 'Project management',
    description: 'Where your teams plan and track work.',
    apps: [{ id: 'atlassian', name: 'Atlassian', description: 'Jira issues and Confluence pages.', available: false }],
  },
  {
    name: 'Payments',
    description: 'Where your business charges and pays.',
    apps: [{ id: 'stripe', name: 'Stripe', description: 'Customers, charges and refunds.', available: false }],
  },
];
