import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ToolRows } from './ToolRows';
import { tool } from './test-data';
it('renders changed contracts, metadata and disabled review state', () => {
 render(<ToolRows tools={[{ ...tool, change: 'changed', reviewed: false, enabled: false, previous: { ...tool.contract, description: 'Old description' } }]} />);
 expect(screen.getByText('Changed')).toBeVisible(); expect(screen.getByText('Read-only')).toBeVisible();
 expect(screen.getByText(/Disabled · review required/)).toBeVisible();
 fireEvent.click(screen.getByText('Compare contract and metadata'));
 expect(screen.getByText('Previous')).toBeVisible(); expect(screen.getByText(/Old description/)).toBeVisible();
});
it('prevents selection of removed tools', () => {
 const toggle = vi.fn(); render(<ToolRows tools={[{ ...tool, change: 'removed' }]} selected={[]} onToggle={toggle} />);
 expect(screen.getByRole('checkbox', { name: 'Manage read' })).toBeDisabled();
 expect(screen.getByText('Removed')).toBeVisible();
});
it('does not present reviewed removals as pending review', () => {
 render(<ToolRows tools={[{ ...tool, change: 'removed', enabled: false, reviewed: true }]} />);
 expect(screen.queryByText(/review required/)).not.toBeInTheDocument();
});
