import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { IntegrationsPage } from './IntegrationsPage';
import { useAuth } from '../../auth/AuthContext';
vi.mock('../../auth/AuthContext', () => ({ useAuth: vi.fn() }));
it('does not expose integration management without a selected authorized context', () => {
 vi.mocked(useAuth).mockReturnValue({ session: null, workspace: undefined, environment: undefined } as ReturnType<typeof useAuth>);
 render(<IntegrationsPage />); expect(screen.getByRole('status')).toHaveTextContent('Select a workspace and environment.');
});
