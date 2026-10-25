import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { agentApi, agentKey } from '../agent-api';
import type { AgentScope } from '../agent-api';

export function useAccessData(scope: AgentScope) {
  const client = useQueryClient();
  const key = agentKey(scope);
  const query = useInfiniteQuery({
    queryKey: key,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => agentApi.list(scope, pageParam, signal),
    getNextPageParam: page => page.next_offset ?? undefined,
    retry: false,
  });
  async function refresh() {
    await client.invalidateQueries({ queryKey: key });
  }
  return { ...query, agents: query.data?.pages.flatMap(page => page.items) ?? [], refresh };
}
