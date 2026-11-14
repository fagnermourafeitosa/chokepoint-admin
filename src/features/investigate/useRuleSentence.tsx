import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { EnvironmentScope } from '../access/environment-scope';
import { permissionApi } from '../access/delegation/api';
import { approvedBindings } from '../access/delegation/catalog';
import { usageFromRecord } from '../access/delegation/usage';
import { celSentence } from '../access/delegation/RuleBuilder';
import type { CatalogBinding } from '../access/delegation/model';
import { sourceApi } from '../sources/api';

// Admin 049 item 14: Investigate reads only the context sources, for the names of the trusted
// attributes of a failed rule. A rule that reads one stays CEL until they load, or if they fail.
type Bindings = (serverId: string, tool: string) => CatalogBinding[];
const none: Bindings = () => [];
const BindingsContext = createContext<Bindings>(none);
const ScopeContext = createContext<EnvironmentScope | undefined>(undefined);

export function RuleBindingsProvider({ scope, children }: { scope: EnvironmentScope; children: ReactNode }) {
  const query = useQuery({ queryKey: ['rule-bindings', scope.userId, scope.tenantId, scope.environmentId], queryFn: ({ signal }) => sourceApi.list(scope, signal), retry: false });
  const value = useMemo<Bindings>(() => {
    const bindings = approvedBindings(query.data?.items ?? []);
    return (serverId, tool) => bindings[`${serverId}/${tool}`] ?? [];
  }, [query.data]);
  return <ScopeContext.Provider value={scope}><BindingsContext.Provider value={value}>{children}</BindingsContext.Provider></ScopeContext.Provider>;
}

// The failed rule read as the sentence of the rule editor, or undefined when its CEL can not be read.
// Admin 054: a rule with limits reads context.chokepoint.usage["<id>"], and the record of the call
// keeps only the id of each limit. Its definition comes from the permission revision that evaluated
// the call (revision) or, without one, from the published document of the agent. While it loads,
// or when the limit is no longer there, the rule shows its CEL.
export function useRuleSentence(expression: string | null | undefined, serverId: string, tool: string, agentId?: string, revision?: number | null) {
  const bindings = useContext(BindingsContext);
  const scope = useContext(ScopeContext);
  const readsUsage = !!expression && expression.includes('chokepoint.usage[');
  const usage = useQuery({
    queryKey: ['rule-usage', scope?.userId, scope?.tenantId, scope?.environmentId, agentId, revision ?? 'published'],
    queryFn: async ({ signal }) => {
      const document = revision != null
        ? (await permissionApi.revision(scope!, agentId!, revision, signal)).document
        : (await permissionApi.get(scope!, agentId!, signal)).published;
      return (document?.conditions ?? []).flatMap(c => (c.usage ?? []).map(usageFromRecord));
    },
    enabled: readsUsage && !!scope && !!agentId,
    retry: false,
    staleTime: 60_000,
  });
  return expression ? celSentence(expression, bindings(serverId, tool), usage.data ?? [], tool) : undefined;
}
