import type { MCPServer, ManagedTool, Preview } from './api';
export const scope = { userId: 'user-a', tenantId: 'tenant-a', environmentId: 'sandbox' };
export const tool: ManagedTool = { name: 'read', contract: { name: 'read', description: 'Read inventory', inputSchema: { type: 'object' }, annotations: { readOnlyHint: true, openWorldHint: false } }, change: 'unchanged', selected: true, enabled: true, reviewed: true };
export const server: MCPServer = { id: 'server-a', name: 'Inventory MCP', endpoint: 'https://inventory.example/mcp', transport: 'streamable-http', auth_type: 'none', token_configured: false, enabled: true, revision: 3, server_info: {}, tools: [tool] };
export const preview: Preview = { preview_id: 'preview-a', expires_at: '2099-01-01T00:00:00Z', server_info: {}, tools: [tool], revision: 4 };
