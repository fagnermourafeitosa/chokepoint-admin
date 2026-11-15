import { useEffect, useRef, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { mcpApi, mcpError, mcpKey, pageSize } from './api';
import type { MCPServer } from './api';
import type { EnvironmentScope } from '../access/environment-scope';

// The Custom MCPs list (Admin 057): pages of 10 with the pager of the Admin lists, and a search by
// name or endpoint that the backend runs over every server (Backend 096, decision 14).
export function useMCPRegistry(scope: EnvironmentScope, enabled = true) {
 const client = useQueryClient();
 const [page, setPage] = useState(1);
 const [search, setSearchValue] = useState('');
 const [query, setQuery] = useState('');
 // The search is sent after a short pause in typing, not on every key.
 useEffect(() => { const id = setTimeout(() => setQuery(search.trim()), 250); return () => clearTimeout(id); }, [search]);
 useEffect(() => { setPage(1); }, [query]);
 const list = useQuery({ enabled, queryKey: [...mcpKey(scope), page, query], queryFn: ({ signal }) => mcpApi.page(scope, (page - 1) * pageSize, query, signal), placeholderData: keepPreviousData });
 const [dialog, setDialog] = useState<MCPServer | 'new' | null>(null);
 const [error, setError] = useState('');
 const [pending, setPending] = useState(false);
 const controller = useRef<AbortController | null>(null);
 useEffect(() => () => { controller.current?.abort(); }, []);
 const refresh = () => Promise.all([
  client.invalidateQueries({ queryKey: mcpKey(scope) }),
  client.invalidateQueries({ queryKey: ['mcp-detail', scope.userId, scope.tenantId, scope.environmentId] }),
  client.invalidateQueries({ queryKey: ['mcp-summaries', scope.userId, scope.tenantId, scope.environmentId] }),
  client.invalidateQueries({ queryKey: ['permission-catalogs', scope.userId, scope.tenantId, scope.environmentId] }),
 ]);
 async function disable(server: MCPServer) {
  const request = new AbortController(); controller.current = request; setPending(true); setError('');
  try { await mcpApi.disable(scope, server, request.signal); await refresh(); return true; }
  catch (e) { if (!request.signal.aborted) { setError(mcpError(e)); void refresh(); } return false; }
  finally { if (!request.signal.aborted) setPending(false); }
 }
 return { ...list, servers: list.data?.items ?? [], total: list.data?.total ?? 0, page, setPage, dialog, setDialog, search, setSearch: setSearchValue, searching: query !== '', error, pending, disable, refresh };
}
