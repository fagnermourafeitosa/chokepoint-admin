import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, History } from 'lucide-react';
import { HttpError } from '../../api/http-client';
import { SelectMenu } from '../../components/ui/dropdown/SelectMenu';
import { useAuth } from '../auth/AuthContext';
import { AccountTabs } from './AccountLayout';
import { BarricadeHistory } from './BarricadeHistory';
import { BehaviorDriftEditor } from './BehaviorDriftEditor';
import { barricadeApi, barricadeKey } from './barricade-api';
import '../identity/identity.css';
import './barricade.css';

const environmentLabel = (name: string) => (name === 'production' ? 'Production' : 'Sandbox');

// Admin 062: the configuration of Barricade, the security engine, for one workspace environment
// (Backend 101). The scope sits in the heading; a rail lists the security modules, Behavior drift
// first, and the page grows by adding modules to the rail.
export function BarricadePage() {
  const auth = useAuth();
  const workspaces = auth.workspaces.filter(w => (w.role ?? 'admin') === 'admin');
  const [chosenWorkspace, setWorkspace] = useState<string>();
  const [chosenEnvironment, setEnvironment] = useState<string>();
  const [showHistory, setShowHistory] = useState(false);
  const tenantId = workspaces.some(w => w.tenant_id === chosenWorkspace) ? chosenWorkspace! : workspaces[0]?.tenant_id;
  const environments = useQuery({
    queryKey: ['account', 'barricade', 'environments', tenantId],
    queryFn: ({ signal }) => barricadeApi.environments(tenantId!, signal),
    enabled: !!tenantId,
  });
  // Production first: it is where the agents of the company run.
  const envs = [...(environments.data?.items ?? [])].sort((a, b) => (a.name === b.name ? 0 : a.name === 'production' ? -1 : 1));
  const environment = envs.find(e => e.id === chosenEnvironment) ?? envs[0];
  const current = useQuery({
    queryKey: barricadeKey(tenantId ?? '', environment?.id ?? ''),
    queryFn: ({ signal }) => barricadeApi.get(tenantId!, environment!.id, signal),
    enabled: !!tenantId && !!environment,
  });
  const workspaceName = workspaces.find(w => w.tenant_id === tenantId)?.name ?? '';
  const scope = environment ? `${workspaceName} · ${environmentLabel(environment.name)}` : workspaceName;

  const body = auth.contextLoading ? <p role="status">Loading your workspaces…</p>
    : workspaces.length === 0 ? <p className="cp-admin-muted">Barricade is set by the Admins of a workspace. You are not Admin of any workspace.</p>
      : environments.isError ? <div className="cp-admin-notice" role="alert">Could not load the environments. <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => void environments.refetch()}>Retry</button></div>
        : !environment || current.isPending ? <p role="status">Loading the setting…</p>
          : current.isError ? <div className="cp-admin-notice" role="alert">{current.error instanceof HttpError && current.error.status === 404 ? 'This environment has no Barricade setting you can read.' : 'Could not load the setting.'} <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => void current.refetch()}>Retry</button></div>
            : <div className="barricade-layout">
              <nav className="cp-admin-panel barricade-rail" aria-label="Security modules">
                <button type="button" aria-current="page"><Activity size={16} aria-hidden="true" /><span><strong>Behavior drift</strong><small>Agents that leave their usage pattern</small></span></button>
              </nav>
              <BehaviorDriftEditor key={`${tenantId}/${environment.id}`} tenantId={tenantId!} environmentId={environment.id} environmentLabel={environmentLabel(environment.name)} current={current.data} />
            </div>;

  return <main id="main-content" className="admin-page cp-admin-container barricade-page" aria-label="Barricade" tabIndex={-1}>
    <AccountTabs />
    <header className="access-page-heading barricade-heading">
      <div>
        <h1 className="cp-admin-title">Barricade</h1>
        <p className="cp-admin-muted">Security settings of each environment of a workspace. Sandbox and Production are set apart.</p>
      </div>
      {workspaces.length > 0 ? <div className="barricade-scope">
        <label className="cp-admin-field">Workspace<SelectMenu block label="Workspace" value={tenantId ?? ''} options={workspaces.map(w => ({ value: w.tenant_id, label: w.name }))} onChange={value => { setWorkspace(value); setEnvironment(undefined); setShowHistory(false); }} /></label>
        <label className="cp-admin-field">Environment<SelectMenu block label="Environment" value={environment?.id ?? ''} disabled={!environment} options={envs.map(e => ({ value: e.id, label: environmentLabel(e.name) }))} onChange={value => { setEnvironment(value); setShowHistory(false); }} /></label>
        <button type="button" className="cp-admin-button cp-admin-button--ghost barricade-history-button" disabled={!environment} onClick={() => setShowHistory(true)}><History size={16} aria-hidden="true" />Change history</button>
      </div> : null}
    </header>
    {body}
    {showHistory && tenantId && environment ? <BarricadeHistory tenantId={tenantId} environmentId={environment.id} scope={scope} onClose={() => setShowHistory(false)} /> : null}
  </main>;
}
