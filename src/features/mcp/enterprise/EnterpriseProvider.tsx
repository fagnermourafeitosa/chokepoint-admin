import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, KeyRound } from 'lucide-react';
import { ProviderMark } from '../ProviderMark';
import type { MCPServer } from '../api';
import { enterpriseApi, type Provider } from './api';
import { GitHubApplication } from './GitHubApplication';
import type { useEnterpriseConnection } from './useEnterpriseConnection';

type Props = { provider: Provider; state: ReturnType<typeof useEnterpriseConnection>; pending: boolean; onSelect: (id: string) => void; onDisable: (server: MCPServer) => void };
export function EnterpriseProvider({ provider, state, pending, onSelect, onDisable }: Props) {
  const [configuration, setConfiguration] = useState(false);
  const { scope } = state;
  const query = useQuery({ queryKey: ['mcp-provider-connection', scope.userId, scope.tenantId, scope.environmentId, provider.id], queryFn: ({ signal }) => enterpriseApi.connection(scope, provider.id, signal), retry: false });
  const connection = query.data?.connection;
  const busy = pending || state.busy || query.isPending || query.isError;
  const connectButton = <button className="cp-admin-button" disabled={busy || !provider.available} onClick={() => void state.connect(provider.id, connection ?? undefined)}>{state.busy ? 'Opening authorization…' : connection ? 'Reconnect & review' : `Connect ${provider.name}`}<ArrowUpRight size={16} aria-hidden="true" /></button>;
  return <>
    <article className="enterprise-provider">
      <ProviderMark provider={provider.id} size={40} />
      <div className="enterprise-provider-copy"><h3>{provider.name}</h3><p>{provider.description}</p>
        {query.isPending ? <small role="status">Loading connection…</small> : query.isError ? <small role="alert">Could not load the connection. <button className="cp-admin-button cp-admin-button--ghost" onClick={() => void query.refetch()}>Retry</button></small> : connection ? <small>{connection.account || 'Account unavailable'} · {connection.authentication_status === 'reauthorization_required' ? 'Reconnect required' : connection.enabled ? 'Enabled' : 'Disabled'} · {connection.tools.filter(tool => tool.selected && tool.change !== 'removed').length} managed tools</small> : <small><KeyRound size={14} aria-hidden="true" />Secure browser authorization</small>}
      </div>
      <div className="enterprise-provider-action">
        {provider.id === 'github' && !provider.available
          ? <button className="cp-admin-button" disabled={state.busy} onClick={() => setConfiguration(value => !value)}>Set up {provider.name}</button>
          : connectButton}
        {connection ? <button className="cp-admin-button cp-admin-button--ghost" onClick={() => onSelect(connection.id)}>View tools</button> : null}
        {connection?.enabled ? <button className="cp-admin-button cp-admin-button--ghost" disabled={busy} onClick={() => onDisable(connection)}>Disable connection</button> : null}
        {provider.id === 'github' && provider.available ? <button className="cp-admin-button cp-admin-button--ghost" disabled={state.busy} onClick={() => setConfiguration(value => !value)}>Configure {provider.name}</button> : null}
        {!provider.available ? <small>Set up your {provider.name} App first, then connect this account.</small> : null}
      </div>
    </article>
    {provider.id === 'github' && configuration ? <GitHubApplication scope={scope} onClose={() => setConfiguration(false)} onSaved={async () => { await state.providers.refetch(); setConfiguration(false); }} /> : null}
  </>;
}
