import type { ManagedTool, ToolContract } from '../../../src/features/mcp/api';

// Admin 058 prototype data: the first review of a support server, after Backend 097. Each tool has
// the three levels that the labeler gave from its text (private data, untrusted content, external
// communication), and the source of each level. Fixed data only.

export type Level = 'none' | 'low' | 'high';
export type Leg = 'private_data' | 'untrusted_content' | 'external_communication';
export type LegLevel = { level: Level; source: 'labeler' | 'operator' };
export type TrifectaTool = ManagedTool & { review_order: number; granted_agents: number; denied_before?: boolean; trifecta: Record<Leg, LegLevel> };

const obj = (properties: Record<string, { type: string; description: string }>, required: string[] = []) => ({ type: 'object', properties, required });
const c = (name: string, title: string, description: string, annotations: ToolContract['annotations'], inputSchema: unknown): ToolContract => ({ name, title, description, annotations, inputSchema });
const t = (p: Level, u: Level, e: Level): Record<Leg, LegLevel> => ({ private_data: { level: p, source: 'labeler' }, untrusted_content: { level: u, source: 'labeler' }, external_communication: { level: e, source: 'labeler' } });

export const tools: TrifectaTool[] = [
  { name: 'read_inbox', reviewed: false, change: 'new', selected: false, enabled: false, review_order: 2, granted_agents: 0, trifecta: t('high', 'high', 'none'),
    contract: c('read_inbox', 'Read inbox', 'Returns the latest emails of the support inbox, with sender, subject and body.', { readOnlyHint: true }, obj({ limit: { type: 'integer', description: 'How many emails, at most 50.' } })) },
  { name: 'search_orders', reviewed: false, change: 'new', selected: false, enabled: false, review_order: 3, granted_agents: 0, trifecta: t('high', 'none', 'none'),
    contract: c('search_orders', 'Search orders', 'Finds orders by customer email, with items, total, address and payment status.', { readOnlyHint: true }, obj({ email: { type: 'string', description: 'The customer email.' } }, ['email'])) },
  { name: 'send_email', reviewed: false, change: 'new', selected: false, enabled: false, review_order: 1, granted_agents: 0, trifecta: t('none', 'none', 'high'),
    contract: c('send_email', 'Send email', 'Sends an email from the support address to any recipient.', { readOnlyHint: false, openWorldHint: true }, obj({ to: { type: 'string', description: 'The recipient address.' }, subject: { type: 'string', description: 'The subject.' }, body: { type: 'string', description: 'The body, in plain text.' } }, ['to', 'subject', 'body'])) },
  { name: 'notify_team', reviewed: false, change: 'new', selected: false, enabled: false, review_order: 4, granted_agents: 0, trifecta: t('none', 'none', 'low'),
    contract: c('notify_team', 'Notify team', 'Posts a message in the internal support channel of the team.', { readOnlyHint: false }, obj({ message: { type: 'string', description: 'The message.' } }, ['message'])) },
  { name: 'get_order_status', reviewed: false, change: 'changed', selected: false, enabled: false, review_order: 0, granted_agents: 2, trifecta: t('low', 'none', 'none'),
    previous: c('get_order_status', 'Get order status', 'Returns the status of an order.', { readOnlyHint: true }, obj({ order_id: { type: 'string', description: 'The order ID.' } }, ['order_id'])),
    contract: c('get_order_status', 'Get order status', 'Returns the status of an order and its tracking code.', { readOnlyHint: true }, obj({ order_id: { type: 'string', description: 'The order ID.' } }, ['order_id'])) },
  { name: 'list_macros', reviewed: true, change: 'unchanged', selected: true, enabled: true, review_order: 5, granted_agents: 3, trifecta: t('none', 'none', 'none'),
    contract: c('list_macros', 'List macros', 'Lists the reply templates of the support team.', { readOnlyHint: true }, obj({})) },
];

export const server = { name: 'Acme Support', endpoint: 'https://support.acme.example/mcp', transport: 'streamable-http', info: { instructions: 'Acme support desk: inbox, orders and replies.', serverInfo: { name: 'acme-support', version: '1.3.0' } } };
