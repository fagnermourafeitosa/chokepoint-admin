import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './AppRoutes';
import { createQueryClient } from './providers/query-client';
import { testAgents } from '../features/access/testing/agents';

function renderPreview() {
  const client = createQueryClient();
  for (const environment of ['Sandbox', 'Production']) {
    client.setQueryData(['access', 'visual-preview', environment], {
      agents: testAgents,
      changes: [],
    });
  }
  return render(
    <QueryClientProvider client={client}>
      <AppRoutes />
    </QueryClientProvider>,
  );
}

describe('Access visual preview', () => {
  it('selects agents and filters the real rendered list', async () => {
    window.history.replaceState(null, '', '/access');
    const user = userEvent.setup();
    renderPreview();
    expect(screen.getByRole('heading', { name: 'Engineering Agent' })).toBeVisible();
    expect(screen.getByLabelText('4 agents')).toBeVisible();
    const selected = screen.getByRole('region', { name: 'Selected agent' });
    expect(selected).not.toHaveTextContent('Sandbox');
    expect(selected.querySelector('.access-agent-avatar')).toBeNull();
    expect(
      screen.getByRole('list', { name: 'Agents' }).querySelector('.access-agent-avatar'),
    ).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Finance Agent' }));
    expect(screen.getByRole('heading', { name: 'Finance Agent' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Finance MCP' })).toBeVisible();
    await user.type(screen.getByRole('searchbox', { name: 'Find agent' }), 'unknown');
    expect(screen.getByText('No matching agents')).toBeVisible();
  });

  it('opens both dialogs, creates a local draft and reviews it', async () => {
    window.history.replaceState(null, '', '/access');
    const user = userEvent.setup();
    renderPreview();
    await user.click(screen.getByRole('button', { name: 'Review changes' }));
    let dialog = screen.getByRole('dialog', { name: 'Review changes' });
    expect(within(dialog).getByText('No changes to review')).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'New agent' }));
    dialog = screen.getByRole('dialog', { name: 'New agent' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Agent name' }), 'Inventory Agent');
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Description' }),
      'Inventory tasks',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Create agent' }));
    expect(screen.getByRole('heading', { name: 'Inventory Agent' })).toBeVisible();
    expect(screen.getByText('No tools associated')).toBeVisible();
    expect(screen.getByLabelText('5 agents')).toBeVisible();
    await user.click(screen.getByRole('button', { name: /Review changes/ }));
    dialog = screen.getByRole('dialog', { name: 'Review changes' });
    expect(within(dialog).getByText('New agent: Inventory Agent')).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Apply preview' }));
    await user.click(screen.getByRole('button', { name: 'Review changes' }));
    expect(screen.getByText('No changes to review')).toBeVisible();
  });

  it('tracks tool switches and clears a change when the switch returns to its original value', async () => {
    window.history.replaceState(null, '', '/access');
    const user = userEvent.setup();
    renderPreview();
    const tool = screen.getByRole('switch', { name: 'Enable issues.create' });
    expect(tool).toHaveAttribute('aria-checked', 'false');
    await user.click(tool);
    expect(tool).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('button', { name: /Review changes/ }));
    expect(screen.getByText('Tool access changed')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(tool);
    await user.click(screen.getByRole('button', { name: 'Review changes' }));
    expect(screen.getByText('No changes to review')).toBeVisible();
  });

  it('shows People and isolates preview changes by environment', async () => {
    window.history.replaceState(null, '', '/access');
    const user = userEvent.setup();
    renderPreview();
    await user.click(screen.getByRole('button', { name: 'People 2' }));
    expect(screen.getByText('ana@example.test')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Tools 3' }));
    await user.click(screen.getByRole('switch', { name: 'Enable issues.create' }));
    await user.click(screen.getByLabelText('Select environment: Sandbox'));
    await user.click(screen.getByRole('button', { name: 'Production' }));
    await waitFor(() =>
      expect(screen.getByRole('switch', { name: 'Enable issues.create' })).toHaveAttribute(
        'aria-checked',
        'false',
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Review changes' }));
    expect(screen.getByText('No changes to review')).toBeVisible();
  });
});
