import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { mcpApi } from './api';
import { useMCPRegistry } from './useMCPRegistry';
import { scope, server } from './test-data';
vi.mock('./api', async original => ({ ...await original<typeof import('./api')>(), mcpApi: { list: vi.fn(), disable: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
function setup() { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>; return { ...renderHook(() => useMCPRegistry(scope), { wrapper }), client }; }
it('filters loaded servers by their friendly name', async () => {
 vi.mocked(mcpApi.list).mockResolvedValue({ items: [server], next_offset: null });
 const { result } = setup(); await waitFor(() => expect(result.current.servers).toHaveLength(1));
 act(() => result.current.setSearch('missing')); expect(result.current.servers).toHaveLength(0);
 act(() => result.current.setSearch('INVENTORY')); expect(result.current.servers).toHaveLength(1);
});
it('separates cached records by identity, workspace and environment', async () => {
 vi.mocked(mcpApi.list).mockResolvedValue({ items: [server], next_offset: null });
 const { client, result } = setup(); await waitFor(() => expect(result.current.isSuccess).toBe(true));
 expect(client.getQueryData(['mcp-servers', 'user-a', 'tenant-a', 'sandbox'])).toBeDefined();
 expect(client.getQueryData(['mcp-servers', 'user-a', 'tenant-a', 'production'])).toBeUndefined();
});
