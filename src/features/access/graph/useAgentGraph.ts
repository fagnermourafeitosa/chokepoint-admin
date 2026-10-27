import { useQuery } from '@tanstack/react-query';
import type { AgentScope } from '../agent-api';
import { permissionApi, permissionKey } from '../../permissions/api';
import { enterpriseApi, type ConnectionSummary } from '../../mcp/enterprise/api';

// Exhaust the lightweight catalog; a failed page makes the graph unavailable.
async function connections(scope: AgentScope, signal: AbortSignal) {
  const items: ConnectionSummary[] = [];
  let offset = 0;
  for (;;) {
    const page = await enterpriseApi.summaries(scope, offset, signal);
    items.push(...page.items);
    if (page.next_offset === null) return items;
    if (page.next_offset <= offset || page.next_offset > 1_000_000) throw new Error('Incomplete connection catalog');
    offset = page.next_offset;
  }
}
export function useAgentGraph(scope: AgentScope, agentId: string) {
  const permissions = useQuery({ queryKey: permissionKey(scope, agentId), queryFn: ({ signal }) => permissionApi.get(scope, agentId, signal), retry: false });
  const catalog = useQuery({ queryKey: ['mcp-summaries', scope.userId, scope.tenantId, scope.environmentId], queryFn: ({ signal }) => connections(scope, signal), retry: false });
  return { permissions, catalog };
}
