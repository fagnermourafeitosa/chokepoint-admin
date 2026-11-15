import type { ManagedTool, ToolContract } from '../../../src/features/mcp/api';

// Admin 057 prototype data: a rediscovery of the Acme Billing server of the demo instance, after
// Backend 096. Four tools were denied in an earlier review and changed since: they come back to To
// review, last. refund_order is granted to two agents, so it comes first. Fixed data only.

// What Backend 096 adds to each tool: the criticality order (lowest first), the number of agents whose
// published permission grants it, and whether the stored tool was denied before this discovery.
export type ReviewTool = ManagedTool & { review_order: number; granted_agents: number; denied_before?: boolean };

const obj = (properties: Record<string, { type: string; description: string }>, required: string[] = []) => ({ type: 'object', properties, required });
const orderId = obj({ order_id: { type: 'string', description: 'The order ID, for example 1001.' } }, ['order_id']);
const customerId = obj({ customer_id: { type: 'string', description: 'The customer ID.' } }, ['customer_id']);

const c = (name: string, title: string, description: string, annotations: ToolContract['annotations'], inputSchema: unknown): ToolContract => ({ name, title, description, annotations, inputSchema });

export const tools: ReviewTool[] = [
  {
    name: 'refund_order', reviewed: false, change: 'changed', selected: false, enabled: false, review_order: 0, granted_agents: 2,
    previous: c('refund_order', 'Refund order', 'Refunds an order, in full or in part. The amount is in BRL.', { destructiveHint: true, openWorldHint: false }, obj({ order_id: { type: 'string', description: 'The order ID.' }, amount: { type: 'number', description: 'The amount to refund, in BRL.' } }, ['order_id', 'amount'])),
    contract: c('refund_order', 'Refund order', 'Refunds an order, in full or in part. The amount is in BRL. A refund above 1000 BRL also cancels the invoice.', { destructiveHint: true, openWorldHint: false }, obj({ order_id: { type: 'string', description: 'The order ID.' }, amount: { type: 'number', description: 'The amount to refund, in BRL.' } }, ['order_id', 'amount'])),
  },
  { name: 'issue_credit_note', reviewed: false, change: 'new', selected: false, enabled: false, review_order: 5, granted_agents: 0,
    contract: c('issue_credit_note', 'Issue credit note', 'Issues a credit note for an order, to be used in the next purchase.', { readOnlyHint: false, openWorldHint: false }, obj({ order_id: { type: 'string', description: 'The order ID.' }, amount: { type: 'number', description: 'The credit, in BRL.' } }, ['order_id', 'amount'])) },
  { name: 'get_receipt', reviewed: false, change: 'changed', selected: false, enabled: false, review_order: 7, granted_agents: 0,
    previous: c('get_receipt', 'Get receipt', 'Returns the receipt of a paid order.', { readOnlyHint: true, openWorldHint: false }, orderId),
    contract: c('get_receipt', 'Get receipt', 'Returns the receipt of a paid order, as a PDF link valid for one hour.', { readOnlyHint: true, openWorldHint: false }, orderId) },
  { name: 'search_customers', reviewed: false, change: 'new', selected: false, enabled: false, review_order: 7, granted_agents: 0,
    contract: c('search_customers', 'Search customers', 'Finds customers by name or email.', { readOnlyHint: true, openWorldHint: false }, obj({ query: { type: 'string', description: 'A name or an email.' } }, ['query'])) },
  { name: 'delete_customer', reviewed: false, change: 'changed', selected: false, enabled: false, review_order: 8, granted_agents: 0, denied_before: true,
    previous: c('delete_customer', 'Delete customer', 'Deletes a customer and their orders.', { destructiveHint: true }, customerId),
    contract: c('delete_customer', 'Delete customer', 'Deletes a customer and their orders. The deletion cannot be undone.', { destructiveHint: true }, customerId) },
  { name: 'bulk_refund', reviewed: false, change: 'changed', selected: false, enabled: false, review_order: 8, granted_agents: 0, denied_before: true,
    previous: c('bulk_refund', 'Bulk refund', 'Refunds every order of a list.', { destructiveHint: true }, obj({ order_ids: { type: 'array', description: 'The order IDs.' } }, ['order_ids'])),
    contract: c('bulk_refund', 'Bulk refund', 'Refunds every order of a list, at most 50.', { destructiveHint: true }, obj({ order_ids: { type: 'array', description: 'The order IDs, at most 50.' } }, ['order_ids'])) },
  { name: 'update_customer', reviewed: false, change: 'changed', selected: false, enabled: false, review_order: 9, granted_agents: 0, denied_before: true,
    previous: c('update_customer', 'Update customer', 'Changes the name or the email of a customer.', { readOnlyHint: false }, obj({ customer_id: { type: 'string', description: 'The customer ID.' }, email: { type: 'string', description: 'The new email.' } }, ['customer_id'])),
    contract: c('update_customer', 'Update customer', 'Changes the name, the email or the phone of a customer.', { readOnlyHint: false }, obj({ customer_id: { type: 'string', description: 'The customer ID.' }, email: { type: 'string', description: 'The new email.' }, phone: { type: 'string', description: 'The new phone.' } }, ['customer_id'])) },
  { name: 'sync_crm', reviewed: false, change: 'changed', selected: false, enabled: false, review_order: 10, granted_agents: 0, denied_before: true,
    previous: c('sync_crm', 'Sync CRM', 'Reads the customer record from the CRM.', { readOnlyHint: true, openWorldHint: true }, customerId),
    contract: c('sync_crm', 'Sync CRM', 'Reads the customer record from the CRM, with the last ten tickets.', { readOnlyHint: true, openWorldHint: true }, customerId) },
  { name: 'get_order', reviewed: true, change: 'unchanged', selected: true, enabled: true, review_order: 3, granted_agents: 3,
    contract: c('get_order', 'Get order', 'Returns an order by ID, with its items, total and status.', { readOnlyHint: true, openWorldHint: false }, orderId) },
  { name: 'list_orders', reviewed: true, change: 'unchanged', selected: true, enabled: true, review_order: 3, granted_agents: 1,
    contract: c('list_orders', 'List orders', 'Lists the orders of a customer, newest first.', { readOnlyHint: true, openWorldHint: false }, customerId) },
  { name: 'export_orders', reviewed: false, change: 'removed', selected: false, enabled: false, review_order: 7, granted_agents: 0,
    contract: c('export_orders', 'Export orders', 'Exports the orders of a month as CSV.', { readOnlyHint: true, openWorldHint: false }, obj({ month: { type: 'string', description: 'The month, as YYYY-MM.' } }, ['month'])) },
];

export const server = { name: 'Acme Billing', transport: 'streamable-http', info: { instructions: 'Acme billing API for support agents.', serverInfo: { name: 'acme-billing', version: '2.4.0' } } };

// Review history of the server (Backend 096): one immutable event per confirmed review, and one per
// automatic disable. The reviewer is a platform user; the system has none.
export type HistoryDecision = 'approved' | 'denied' | 'change_trusted' | 'kept_disabled' | 'disabled_changed' | 'disabled_removed';
export type HistoryEvent = { id: string; kind: 'review' | 'rediscovery'; revision: number; reviewer?: string; at: string; decisions: { tool: string; decision: HistoryDecision; description: string }[] };

export const history: HistoryEvent[] = [
  { id: 'e4', kind: 'rediscovery', revision: 9, at: '2026-11-15T09:05:00Z', decisions: [
    { tool: 'refund_order', decision: 'disabled_changed', description: tools[0].contract.description! },
    { tool: 'export_orders', decision: 'disabled_removed', description: 'Exports the orders of a month as CSV.' },
  ] },
  { id: 'e3', kind: 'review', revision: 8, reviewer: 'Ana Lima', at: '2026-11-12T16:40:00Z', decisions: [
    { tool: 'refund_order', decision: 'approved', description: 'Refunds an order, in full or in part. The amount is in BRL.' },
    { tool: 'get_receipt', decision: 'approved', description: 'Returns the receipt of a paid order.' },
    { tool: 'delete_customer', decision: 'denied', description: 'Deletes a customer and their orders.' },
    { tool: 'bulk_refund', decision: 'denied', description: 'Refunds every order of a list.' },
    { tool: 'update_customer', decision: 'denied', description: 'Changes the name or the email of a customer.' },
    { tool: 'sync_crm', decision: 'denied', description: 'Reads the customer record from the CRM.' },
  ] },
  { id: 'e2', kind: 'review', revision: 5, reviewer: 'Diego Rocha', at: '2026-11-06T11:15:00Z', decisions: [
    { tool: 'list_orders', decision: 'change_trusted', description: 'Lists the orders of a customer, newest first.' },
  ] },
  { id: 'e1', kind: 'review', revision: 1, reviewer: 'Diego Rocha', at: '2026-11-03T10:12:00Z', decisions: [
    { tool: 'get_order', decision: 'approved', description: 'Returns an order by ID, with its items, total and status.' },
    { tool: 'list_orders', decision: 'approved', description: 'Lists the orders of a customer.' },
    { tool: 'export_orders', decision: 'approved', description: 'Exports the orders of a month as CSV.' },
  ] },
];

// The Custom MCPs of the environment, for the Integrations list (Admin 057): 12 servers, 10 per page.
export type ListedServer = { name: string; transport: string; tools: number; enabled: boolean; reviewRequired?: boolean };
export const servers: ListedServer[] = [
  { name: 'Acme Billing', transport: 'streamable-http', tools: 2, enabled: true, reviewRequired: true },
  { name: 'Acme Issues', transport: 'streamable-http', tools: 5, enabled: true },
  { name: 'Catalog', transport: 'streamable-http', tools: 6, enabled: true },
  { name: 'Customer support RAG', transport: 'streamable-http', tools: 3, enabled: true },
  { name: 'Data warehouse', transport: 'http-sse', tools: 4, enabled: true },
  { name: 'HR records', transport: 'streamable-http', tools: 2, enabled: false },
  { name: 'Inventory', transport: 'streamable-http', tools: 7, enabled: true },
  { name: 'Ledger', transport: 'streamable-http', tools: 3, enabled: true, reviewRequired: true },
  { name: 'Logistics', transport: 'http-sse', tools: 5, enabled: true },
  { name: 'Marketing analytics', transport: 'streamable-http', tools: 2, enabled: true },
  { name: 'Payroll', transport: 'streamable-http', tools: 4, enabled: false },
  { name: 'Ticketing', transport: 'streamable-http', tools: 6, enabled: true },
];
