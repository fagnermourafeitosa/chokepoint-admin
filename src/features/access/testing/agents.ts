import type { AgentSummary } from '../types';

// Test-only representative records; never imported by application code.
export const testAgents: readonly AgentSummary[] = [
  {
    id: 'preview-engineering',
    name: 'Engineering Agent',
    description: 'Repository and issue automation',
    status: 'active',
    tools: [
      {
        id: 'github.repositories.list',
        name: 'repositories.list',
        server: 'GitHub MCP',
        description: 'List organization repositories',
        annotations: { readOnlyHint: true, openWorldHint: false },
        enabled: true,
      },
      {
        id: 'github.issues.create',
        name: 'issues.create',
        server: 'GitHub MCP',
        description: 'Create an issue',
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true,
        },
        enabled: false,
      },
      {
        id: 'docs.documents.search',
        name: 'documents.search',
        server: 'Documentation MCP',
        description: 'Search internal documentation',
        enabled: true,
      },
    ],
    people: [
      { id: 'preview-ana', name: 'Ana Costa', email: 'ana@example.test', assigned: true },
      { id: 'preview-pedro', name: 'Pedro Lima', email: 'pedro@example.test', assigned: false },
    ],
  },
  {
    id: 'preview-finance',
    name: 'Finance Agent',
    description: 'Payments and account workflows',
    status: 'active',
    tools: [
      {
        id: 'finance.accounts.get_balance',
        name: 'accounts.get_balance',
        server: 'Finance MCP',
        description: 'Read account balances',
        annotations: { readOnlyHint: true, openWorldHint: false },
        enabled: true,
      },
      {
        id: 'finance.payments.refund',
        name: 'payments.refund',
        server: 'Finance MCP',
        description: 'Refund a payment',
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true,
        },
        enabled: false,
      },
    ],
    people: [{ id: 'preview-ana', name: 'Ana Costa', email: 'ana@example.test', assigned: true }],
  },
  {
    id: 'preview-support',
    name: 'Support Agent',
    description: 'Customer support and tickets',
    status: 'draft',
    tools: [],
    people: [],
  },
  {
    id: 'preview-research',
    name: 'Research Agent',
    description: 'Internal document retrieval',
    status: 'active',
    tools: [],
    people: [],
  },
];
