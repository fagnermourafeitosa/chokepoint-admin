import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { mcpApi } from './api';
import { useMCPForm } from './useMCPForm';
import { scope, preview, server, tool } from './test-data';
vi.mock('./api', async original => ({ ...await original<typeof import('./api')>(), mcpApi: { discover: vi.fn(), confirm: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it('retains existing selections and excludes removed tools from preview selection', async () => {
 vi.mocked(mcpApi.discover).mockResolvedValue({ ...preview, tools: [tool, { ...tool, name: 'gone', change: 'removed' }, { ...tool, name: 'unselected', selected: false }] });
 const { result } = renderHook(() => useMCPForm(scope, server, vi.fn(), vi.fn()));
 await act(() => result.current.discover());
 expect(result.current.selected).toEqual(['read']);
});
it('clears the token after discovery and invalidates preview on connection edits', async () => {
 vi.mocked(mcpApi.discover).mockResolvedValue(preview);
 const { result } = renderHook(() => useMCPForm(scope, undefined, vi.fn(), vi.fn()));
 act(() => { result.current.update('auth_type', 'bearer'); result.current.setToken('private'); });
 await act(() => result.current.discover()); expect(result.current.token).toBe('');
 act(() => result.current.update('endpoint', 'https://other.example/mcp'));
 expect(result.current.preview).toBeUndefined();
});
it('does not enable an empty discovery', async () => {
 vi.mocked(mcpApi.discover).mockResolvedValue({ ...preview, tools: [] });
 const { result } = renderHook(() => useMCPForm(scope, server, vi.fn(), vi.fn()));
 await act(() => result.current.discover()); expect(result.current.enable).toBe(false);
});
it('aborts an outstanding discovery when the form unmounts', async () => {
 vi.mocked(mcpApi.discover).mockImplementation(() => new Promise(() => {}));
 const { result, unmount } = renderHook(() => useMCPForm(scope, undefined, vi.fn(), vi.fn()));
 act(() => { void result.current.discover(); });
 const signal = vi.mocked(mcpApi.discover).mock.calls[0][3]; unmount(); expect(signal.aborted).toBe(true);
});
