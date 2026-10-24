import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

it('explains the absence of data with an optional description', () => {
  render(<EmptyState title="No agents yet" description="Agents will appear here." />);
  expect(screen.getByRole('status')).toHaveTextContent('No agents yet');
  expect(screen.getByText('Agents will appear here.')).toBeVisible();
});
