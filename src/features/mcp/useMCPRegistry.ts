import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { mcpApi, mcpError, mcpKey } from './api';
import type { MCPServer } from './api';
import type { EnvironmentScope } from '../access/environment-scope';
export function useMCPRegistry(scope: EnvironmentScope, enabled = true) {
 const client = useQueryClient();
 const query = useInfiniteQuery({ enabled, queryKey: mcpKey(scope), initialPageParam: 0, queryFn: ({pageParam, signal}) => mcpApi.list(scope, pageParam, signal), getNextPageParam: last => last.next_offset ?? undefined });
 const [dialog, setDialog] = useState<MCPServer | 'new' | null>(null);
 const [selectedId, setSelectedId] = useState<string>();
 const [search, setSearch] = useState('');
 const [error, setError] = useState('');
 const [pending, setPending] = useState(false);
 const controller = useRef<AbortController | null>(null);
 useEffect(() => () => { controller.current?.abort(); }, []);
 const servers = query.data?.pages.flatMap(page => page.items) ?? [];
 const selected = servers.find(server => server.id === selectedId);
 const refresh = () => Promise.all([
  client.invalidateQueries({ queryKey: mcpKey(scope) }),
  client.invalidateQueries({ queryKey: ['mcp-provider-connection', scope.userId, scope.tenantId, scope.environmentId] }),
  client.invalidateQueries({ queryKey: ['mcp-detail', scope.userId, scope.tenantId, scope.environmentId] }),
  client.invalidateQueries({ queryKey: ['mcp-summaries', scope.userId, scope.tenantId, scope.environmentId] }),
  client.invalidateQueries({ queryKey: ['permission-catalogs', scope.userId, scope.tenantId, scope.environmentId] }),
 ]);
 async function disable(server: MCPServer) {
  const request = new AbortController(); controller.current = request; setPending(true); setError('');
  try { await mcpApi.disable(scope, server, request.signal); await refresh(); }
  catch (e) { if (!request.signal.aborted) { setError(mcpError(e)); void refresh(); } }
  finally { if (!request.signal.aborted) setPending(false); }
 }
 return { ...query, servers: servers.filter(server => `${server.name} ${server.endpoint}`.toLowerCase().includes(search.toLowerCase())), selected, setSelectedId, dialog, setDialog, search, setSearch, error, pending, disable, refresh };
}
