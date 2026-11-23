import { useQueries, useQuery } from '@tanstack/react-query';
import { agentApi, type AgentRecord, type AgentScope } from '../access/agent-api';
import type { EnvironmentRecord } from '../auth/AuthContext';
import { barricadeApi, barricadeKey, entityTypesKey } from './barricade-api';

// Admin 063: the data of the PII Policies screens.

export const environmentLabel = (name: string) => (name === 'production' ? 'Production' : 'Sandbox');
// Production first: it is where the agents of the company run.
export const byProduction = (a: EnvironmentRecord, b: EnvironmentRecord) => (a.name === b.name ? 0 : a.name === 'production' ? -1 : 1);
export const environmentsKey = (tenantId: string) => ['account', 'barricade', 'environments', tenantId] as const;

export function useCatalog() {
  return useQuery({ queryKey: entityTypesKey, queryFn: ({ signal }) => barricadeApi.entityTypes(signal), staleTime: Infinity });
}

// Every agent of one environment, all pages, so the table can page and look up names locally.
export function useEnvironmentAgents(scope: AgentScope | undefined) {
  return useQuery({
    queryKey: ['account', 'pii', 'agents', scope?.userId, scope?.tenantId, scope?.environmentId],
    enabled: !!scope,
    queryFn: async ({ signal }) => {
      const all: AgentRecord[] = [];
      for (let offset: number | null = 0; offset !== null;) {
        const page = await agentApi.list(scope!, offset, signal);
        all.push(...page.items);
        offset = page.next_offset;
      }
      return all;
    },
  });
}

export type EnvironmentPii = { id: string; name: string; enabled: boolean | undefined };

// The PII filter of each environment of each workspace (Admin 063, item 14): the Barricade selects
// show it as a dot and the workspaces list as switches. A workspace is on while one of its
// environments is on. The settings share the cache of the Barricade page.
export function useWorkspacesPii(tenantIds: string[]) {
  const environments = useQueries({
    queries: tenantIds.map(tenantId => ({
      queryKey: environmentsKey(tenantId),
      queryFn: ({ signal }: { signal: AbortSignal }) => barricadeApi.environments(tenantId, signal),
    })),
  });
  const pairs = tenantIds.flatMap((tenantId, i) => [...(environments[i]?.data?.items ?? [])].sort(byProduction).map(env => ({ tenantId, env })));
  const settings = useQueries({
    queries: pairs.map(({ tenantId, env }) => ({
      queryKey: barricadeKey(tenantId, env.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => barricadeApi.get(tenantId, env.id, signal),
    })),
  });
  const byTenant = new Map<string, EnvironmentPii[]>();
  pairs.forEach(({ tenantId, env }, i) => {
    const list = byTenant.get(tenantId) ?? [];
    list.push({ id: env.id, name: env.name, enabled: settings[i]?.data?.setting.pii_policies?.enabled });
    byTenant.set(tenantId, list);
  });
  return byTenant;
}

export const workspaceOn = (envs: EnvironmentPii[] | undefined) => !!envs?.some(e => e.enabled);
