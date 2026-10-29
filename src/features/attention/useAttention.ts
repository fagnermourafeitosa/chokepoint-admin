import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { attentionApi, attentionKey } from './api';
import type { Signal, SignalType } from './api';
import { mcpApi, mcpKey } from '../mcp/api';
import type { MCPServer } from '../mcp/api';
import type { EnvironmentScope } from '../access/environment-scope';

// useInbox loads one page of unreviewed signals and the counters. Reviewing a
// signal refreshes both, so the Inbox and the Pending counter always match.
export function useInbox(scope: EnvironmentScope) {
  const client = useQueryClient();
  const [type, setType] = useState<SignalType | 'all'>('all');
  const [page, setPage] = useState(1);
  const list = useQuery({
    queryKey: [...attentionKey(scope), 'list', type, page],
    queryFn: ({ signal }) => attentionApi.list(scope, type, page, signal),
    placeholderData: previous => previous,
  });
  const counts = useQuery({
    queryKey: [...attentionKey(scope), 'counts'],
    queryFn: ({ signal }) => attentionApi.counts(scope, signal),
  });
  // The failure flag lives in the query cache, so it survives the navigation
  // that follows a review click and the Inbox can still show it on return.
  // Its key sits outside attentionKey, so the refresh after a review does not reset it.
  const failedKey = ['attention-review-failed', scope.userId, scope.tenantId, scope.environmentId] as const;
  const reviewFailed = useQuery({ queryKey: failedKey, queryFn: () => false, initialData: false, staleTime: Infinity });
  const lastPage = Math.max(1, Math.ceil((list.data?.total ?? 0) / (list.data?.page_size ?? 5)));
  // A review on the last page can remove that page. Move back to the new last page.
  useEffect(() => { if (list.data && page > lastPage) setPage(lastPage); }, [list.data, page, lastPage]);
  // markReviewed never blocks the caller. A failure sets the flag and the signal stays in the Inbox.
  function markReviewed(signal: Signal) {
    client.setQueryData(failedKey, false);
    void attentionApi.review(scope, signal.id)
      .catch(() => { client.setQueryData(failedKey, true); })
      .finally(() => client.invalidateQueries({ queryKey: attentionKey(scope) }));
  }
  return {
    list, counts, markReviewed, lastPage, page,
    reviewFailed: reviewFailed.data,
    dismissReviewFailed: () => client.setQueryData(failedKey, false),
    type,
    setType: (next: SignalType | 'all') => { setType(next); setPage(1); },
    setPage,
  };
}

const maxServerPages = 50;

// loadAllServers reads every page of the MCP registry list, so the count does not stop at the first page.
async function loadAllServers(scope: EnvironmentScope, signal: AbortSignal): Promise<MCPServer[]> {
  const servers: MCPServer[] = [];
  let offset: number | null = 0;
  for (let i = 0; i < maxServerPages && offset !== null; i++) {
    const next = await mcpApi.list(scope, offset, signal);
    servers.push(...next.items);
    offset = next.next_offset;
  }
  return servers;
}

// useToolsWithoutReview counts managed tools that wait for review. It reads the
// existing MCP registry list and adds no endpoint (Admin 018, Counters).
export function useToolsWithoutReview(scope: EnvironmentScope) {
  return useQuery({
    queryKey: [...mcpKey(scope), 'overview-review-count'],
    queryFn: ({ signal }) => loadAllServers(scope, signal),
    select: servers => servers.flatMap(server => server.tools).filter(tool => !tool.reviewed && tool.change !== 'unchanged').length,
  });
}
