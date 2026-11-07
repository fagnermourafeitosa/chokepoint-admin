import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { EnvironmentScope } from '../access/environment-scope';
import { approvedBindings } from '../access/delegation/catalog';
import { celSentence } from '../access/delegation/RuleBuilder';
import type { CatalogBinding } from '../access/delegation/model';
import { sourceApi } from '../sources/api';

// Admin 049 item 14: Investigate reads only the context sources, for the names of the trusted
// attributes of a failed rule. A rule that reads one stays CEL until they load, or if they fail.
type Bindings = (serverId: string, tool: string) => CatalogBinding[];
const none: Bindings = () => [];
const BindingsContext = createContext<Bindings>(none);

export function RuleBindingsProvider({ scope, children }: { scope: EnvironmentScope; children: ReactNode }) {
  const query = useQuery({ queryKey: ['rule-bindings', scope.userId, scope.tenantId, scope.environmentId], queryFn: ({ signal }) => sourceApi.list(scope, signal), retry: false });
  const value = useMemo<Bindings>(() => {
    const bindings = approvedBindings(query.data?.items ?? []);
    return (serverId, tool) => bindings[`${serverId}/${tool}`] ?? [];
  }, [query.data]);
  return <BindingsContext.Provider value={value}>{children}</BindingsContext.Provider>;
}

// The failed rule read as the sentence of the rule editor, or undefined when its CEL can not be read.
export function useRuleSentence(expression: string | null | undefined, serverId: string, tool: string) {
  const bindings = useContext(BindingsContext);
  return expression ? celSentence(expression, bindings(serverId, tool)) : undefined;
}
