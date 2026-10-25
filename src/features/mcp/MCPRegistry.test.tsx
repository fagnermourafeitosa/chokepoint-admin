import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { MCPRegistry } from './MCPRegistry';
import { mcpApi } from './api';
import { scope } from './test-data';
vi.mock('./api', async original => ({ ...await original<typeof import('./api')>(), mcpApi: { list: vi.fn(), disable: vi.fn() } }));
it('offers MCP registration but no fake IdP registration or delete action', async () => {
 vi.mocked(mcpApi.list).mockResolvedValue({ items: [], next_offset: null });
 render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MCPRegistry scope={scope} /></QueryClientProvider>);
 expect(await screen.findByText('No MCP servers yet')).toBeVisible();
 expect(screen.getByRole('button', { name: 'Connect MCP server' })).toBeEnabled();
 fireEvent.click(screen.getByRole('button', { name: /Identity providers/ }));
 expect(screen.getByText('Identity provider registration is not available yet.')).toBeVisible();
 expect(screen.queryByRole('button', { name: 'Connect MCP server' })).not.toBeInTheDocument();
 expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
});
