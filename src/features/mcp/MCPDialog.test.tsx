import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { mcpApi } from './api';
import { MCPDialog } from './MCPDialog';
import { scope, preview } from './test-data';
vi.mock('./api', async original => ({ ...await original<typeof import('./api')>(), mcpApi: { discover: vi.fn(), confirm: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
function open() { render(<MCPDialog scope={scope} onClose={vi.fn()} onRefresh={vi.fn()} onSaved={vi.fn()} />); fireEvent.change(screen.getByLabelText('Server name'), { target: { value: 'Inventory' } }); fireEvent.change(screen.getByLabelText('MCP endpoint'), { target: { value: 'https://inventory.example/mcp' } }); fireEvent.submit(screen.getByRole('button', { name: 'Discover tools' }).closest('form')!); }
it('checks discovered tools by default and blocks registration after deselecting all', async () => {
 vi.mocked(mcpApi.discover).mockResolvedValue(preview); open();
 await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Manage read' })).toBeChecked());
 fireEvent.click(screen.getByRole('checkbox', { name: 'Select all available tools' }));
 expect(screen.getByRole('button', { name: 'Register server' })).toBeDisabled();
});
it('reports empty discovery without registering the server', async () => {
 vi.mocked(mcpApi.discover).mockResolvedValue({ ...preview, tools: [] }); open();
 expect(await screen.findByText(/No tools available/)).toBeVisible();
 expect(screen.getByRole('button', { name: 'Register server' })).toBeDisabled(); expect(mcpApi.confirm).not.toHaveBeenCalled();
});
it('lists stdio as unsupported and does not allow selecting it', () => {
 render(<MCPDialog scope={scope} onClose={vi.fn()} onRefresh={vi.fn()} onSaved={vi.fn()} />);
 expect(screen.getByRole('option', { name: 'stdio — unsupported' })).toBeDisabled();
});
