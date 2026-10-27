import type { MCPServer } from '../api';
import type { useEnterpriseConnection } from './useEnterpriseConnection';
import { EnterpriseProvider } from './EnterpriseProvider';
import './enterprise.css';

type Props = { state: ReturnType<typeof useEnterpriseConnection>; pending: boolean; onSelect: (id: string) => void; onDisable: (server: MCPServer) => void };
export function EnterpriseCatalog({ state, pending, onSelect, onDisable }: Props) {
  if (state.providers.isPending) return <p role="status">Loading enterprise integrations…</p>;
  if (state.providers.isError) return <p role="alert">Could not load providers. <button className="cp-admin-button cp-admin-button--ghost" onClick={() => void state.providers.refetch()}>Retry</button></p>;
  return <section className="enterprise-catalog" aria-label="Enterprise MCP providers">
    <div><h2>Connect a platform</h2><p className="cp-admin-muted">Authorize your account, review its tools, then configure agent access.</p></div>
    {state.providers.data?.items.map(provider => <EnterpriseProvider key={provider.id} provider={provider} state={state} pending={pending} onSelect={onSelect} onDisable={onDisable} />)}
    {state.error ? <p role="alert" className="cp-admin-notice" data-tone="danger">{state.error}</p> : null}
  </section>;
}
