import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { ToolAnnotations } from './ToolAnnotations';

it('accepts absent annotations without inventing classifications', () => {
  const { container } = render(<ToolAnnotations />);
  expect(container).toBeEmptyDOMElement();
});

it('displays independent supplied MCP hints, including explicit false values', () => {
  render(
    <ToolAnnotations
      annotations={{
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      }}
    />,
  );
  expect(screen.getByText('Can modify')).toBeVisible();
  expect(screen.getByText('Destructive')).toBeVisible();
  expect(screen.getByText('Idempotent')).toBeVisible();
  expect(screen.getByText('Closed world')).toBeVisible();
});

it('does not display write-only hints for a read-only tool or fill missing hints', () => {
  render(
    <ToolAnnotations
      annotations={{ readOnlyHint: true, destructiveHint: true, idempotentHint: true }}
    />,
  );
  expect(screen.getByText('Read-only')).toBeVisible();
  expect(screen.queryByText('Destructive')).not.toBeInTheDocument();
  expect(screen.queryByText('Idempotent')).not.toBeInTheDocument();
  expect(screen.queryByText('Open world')).not.toBeInTheDocument();
});

it('explains annotation meaning on hover and keyboard focus', async () => {
  const user = userEvent.setup();
  render(<ToolAnnotations annotations={{ destructiveHint: false }} />);
  const badge = screen.getByText('Additive');
  await user.hover(badge);
  expect(screen.getByRole('tooltip')).toHaveTextContent('additive changes');
  const tooltip = screen.getByRole('tooltip');
  await user.unhover(badge);
  await user.hover(tooltip);
  expect(tooltip).toBeVisible();
  await user.unhover(tooltip);
  await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  await user.tab();
  expect(screen.getByRole('tooltip')).toHaveTextContent('destructiveHint: false');
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});
