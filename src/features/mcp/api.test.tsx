import { expect, it, vi, beforeEach } from 'vitest';
import { httpClient, HttpError } from '../../api/http-client';
import { mcpApi, mcpError } from './api';
import { scope, server, preview } from './test-data';
vi.mock('../../api/http-client', async original => ({ ...await original<typeof import('../../api/http-client')>(), httpClient: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
it('sends only preview identity and selected names on confirmation', async () => {
 vi.mocked(httpClient).mockResolvedValue(server);
 const signal = new AbortController().signal;
 await mcpApi.confirm(scope, server.id, preview, ['read'], true, signal);
 expect(httpClient).toHaveBeenCalledWith('/v1/workspaces/tenant-a/environments/sandbox/mcp-servers/server-a/confirm', { method: 'POST', json: { preview_id: 'preview-a', selected_tools: ['read'], enable: true }, signal });
});
it('uses scoped API discovery rather than calling the MCP endpoint', async () => {
 const signal = new AbortController().signal;
 await mcpApi.discover(scope, undefined, { name: 'Inventory', endpoint: server.endpoint, transport: 'streamable-http', auth_type: 'none' }, signal);
 expect(vi.mocked(httpClient).mock.calls[0][0]).toBe('/v1/workspaces/tenant-a/environments/sandbox/mcp-servers/discover');
});
it('sends the revision when disabling without issuing DELETE', async () => {
 const signal = new AbortController().signal; await mcpApi.disable(scope, server, signal);
 expect(httpClient).toHaveBeenCalledWith('/v1/workspaces/tenant-a/environments/sandbox/mcp-servers/server-a/disable', { method: 'POST', json: { revision: 3 }, signal });
});
it('gives a recovery action for stale previews without leaking raw errors', () => {
 expect(mcpError(new HttpError(409))).toContain('discover again');
 expect(mcpError(new Error('private-token'))).not.toContain('private-token');
});
