import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { HttpError } from '../../../api/http-client';
import type { EnvironmentScope } from '../environment-scope';
import { mcpApi, type MCPServer } from '../../mcp/api';
import { toolArguments } from '../../mcp/resource-api';
import { identityApi, type DirectoryUser } from '../../identity/api';
import { sourceApi } from '../../sources/api';
import { resourceTypesApi } from './api';
import type { Catalog, CatalogBinding, CatalogTool, Directory, Subject } from './model';

// Exhaust each scoped catalog rather than silently omitting records after page one.
async function pages<T>(load: (offset: number) => Promise<{ items: T[]; next_offset: number | null }>) {
  const result: T[] = []; let offset = 0;
  for (;;) { const page = await load(offset); result.push(...page.items); if (page.next_offset === null) return result; if (page.next_offset <= offset) throw new Error('Invalid catalog pagination'); offset = page.next_offset; }
}

// Rule builder types: only scalar arguments can be compared.
const ruleType = (type: string) => (type === 'string' ? 'string' : type === 'integer' || type === 'number' ? 'number' : type === 'boolean' ? 'bool' : undefined);

async function loadCatalog(scope: EnvironmentScope, signal: AbortSignal) {
  const [servers, identities, sources, providers] = await Promise.all([pages(o => mcpApi.list(scope, o, signal)), pages(o => identityApi.list(scope, o, signal)), sourceApi.list(scope, signal), identityApi.providers(scope, signal)]);
  const managed = (s: MCPServer) => s.tools.filter(t => t.selected && t.reviewed && t.change !== 'removed');
  const withTools = servers.filter(s => managed(s).length);
  // One resource types read for each server (Backend 037, Admin 026 Resolved Decision 2).
  const types = await Promise.all(withTools.map(s => resourceTypesApi.list(scope, s.id, signal)));
  const tools: CatalogTool[] = withTools.flatMap((s, i) => managed(s).map(t => {
    const resource = types[i].items.find(r => r.tool === t.name);
    const args = Object.fromEntries(toolArguments(t).flatMap(a => { const type = ruleType(a.type); return type ? [[a.name, type]] : []; }));
    return { serverId: s.id, tool: t.name, args, mapping: resource ? { pointer: resource.argument ? `/${resource.argument}` : '', kind: resource.type } : undefined };
  }));
  const bindings: Record<string, CatalogBinding[]> = {};
  for (const source of sources.items) for (const binding of source.bindings) {
    const v = binding.approved; if (!v) continue;
    (bindings[`${v.server_id}/${v.tool_name}`] ??= []).push({ id: binding.id, source: `${source.name} / ${v.name}`, entity: v.entity, attributes: v.attributes.flatMap(a => { const type = ruleType(a.type); return type ? [{ name: a.name, type }] : []; }) });
  }
  return {
    servers: withTools.map(s => ({ id: s.id, name: s.name, type: s.connection_type === 'enterprise' ? 'enterprise' as const : 'custom' as const })),
    tools, bindings, idps: identities.map(i => ({ id: i.id, name: i.name, enabled: i.enabled, provider: i.provider, groups: !!providers.find(p => p.provider === i.provider)?.groups, harnessLogin: !!i.login?.enabled })),
  };
}

const subject = (u: DirectoryUser): Subject => ({ subject: u.identity.subject, name: u.display_name || u.user_name || u.identity.subject, kind: u.kind });

// Every subject listed now in the directory: all pages of people, then the services (Admin 026 section 5, Select all).
async function loadDirectory(scope: EnvironmentScope, id: string, signal: AbortSignal): Promise<Directory> {
  const people: Subject[] = []; let cursor = '';
  do { const page = await identityApi.users(scope, id, '', cursor, signal); people.push(...page.items.map(subject)); cursor = page.next_cursor ?? ''; } while (cursor);
  try {
    const services = await identityApi.services(scope, id, signal);
    return { subjects: [...people, ...services.items.map(u => ({ ...subject(u), kind: 'service' as const }))], truncated: services.truncated };
  } catch (e) {
    // 501: this identity provider does not list services.
    if (e instanceof HttpError && e.status === 501) return { subjects: people, truncated: false };
    throw e;
  }
}

const combineDirectories = (results: { data?: Directory; isError: boolean }[]) => results.map(r => ({ data: r.data, isError: r.isError }));

type CatalogState = { scope: EnvironmentScope; catalog: Catalog; loading: boolean; error: boolean; retry: () => void; request: (issuer: string) => void; directoryFailed: (issuer: string) => boolean };
const CatalogContext = createContext<CatalogState | null>(null);

export function CatalogProvider({ scope, issuers, children }: { scope: EnvironmentScope; issuers: string[]; children: ReactNode }) {
  const query = useQuery({ queryKey: ['delegation-catalog', scope.userId, scope.tenantId, scope.environmentId], queryFn: ({ signal }) => loadCatalog(scope, signal), retry: false });
  const [extra, setExtra] = useState<string[]>([]);
  const request = useCallback((id: string) => setExtra(v => (v.includes(id) ? v : [...v, id])), []);
  const wanted = useMemo(() => [...new Set([...issuers, ...extra])], [issuers, extra]);
  // combine keeps the result stable between renders, so the catalog and the graph layout are rebuilt only when a directory changes.
  const directories = useQueries({ queries: wanted.map(id => ({ queryKey: ['delegation-directory', scope.userId, scope.tenantId, scope.environmentId, id], queryFn: ({ signal }: { signal: AbortSignal }) => loadDirectory(scope, id, signal), retry: false, staleTime: 60_000 })), combine: combineDirectories });
  const value = useMemo<CatalogState>(() => {
    const byIssuer = new Map(wanted.map((id, i) => [id, directories[i]]));
    const data = query.data;
    return {
      scope,
      catalog: { servers: data?.servers ?? [], tools: data?.tools ?? [], idps: data?.idps ?? [], bindings: (serverId, tool) => data?.bindings[`${serverId}/${tool}`] ?? [], directory: id => byIssuer.get(id)?.data },
      loading: query.isPending, error: query.isError, retry: () => void query.refetch(),
      request,
      directoryFailed: id => !!byIssuer.get(id)?.isError,
    };
  }, [scope, query.data, query.isPending, query.isError, wanted, directories, request]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error('Catalog context required');
  return value;
}
