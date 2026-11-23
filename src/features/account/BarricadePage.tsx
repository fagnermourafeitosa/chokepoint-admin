import { useEffect, useState } from 'react';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBlocker } from 'react-router';
import { Activity, History, ScanEye, SlidersHorizontal } from 'lucide-react';
import { HttpError } from '../../api/http-client';
import { UnsavedChangesDialog } from '../../components/ui/dialog/UnsavedChangesDialog';
import { SelectMenu } from '../../components/ui/dropdown/SelectMenu';
import { useAuth } from '../auth/AuthContext';
import { AccountTabs } from './AccountLayout';
import { BarricadeHistory } from './BarricadeHistory';
import { BehaviorDriftEditor } from './BehaviorDriftEditor';
import { barricadeApi, barricadeKey, barricadeSaveKey, withPii } from './barricade-api';
import { byProduction, environmentLabel, environmentsKey, useCatalog, useEnvironmentAgents, useWorkspacesPii, workspaceOn } from './pii-data';
import { fromSwitches, sameSwitches, toSwitches, type Switches } from './pii-terms';
import { PiiPoliciesEditor, piiSaveError } from './PiiPoliciesEditor';
import '../identity/identity.css';
import './barricade.css';

type Module = 'drift' | 'pii';
const status = (on: boolean | undefined) => ({ on: !!on, label: on ? 'PII filter on' : 'PII filter off' });

// Admin 062 and 063: the configuration of Barricade, the security engine, for one workspace
// environment (Backend 101, Backend 105). The security modules are inner tabs above the editor of
// the chosen module: Behavior drift, then PII Policies. The selects show the PII filter of each
// workspace and environment as a dot. Unsaved masked types ask before any way out (item 13).
export function BarricadePage() {
  const auth = useAuth();
  const client = useQueryClient();
  const workspaces = auth.workspaces.filter(w => (w.role ?? 'admin') === 'admin');
  const [chosenWorkspace, setWorkspace] = useState<string>();
  const [chosenEnvironment, setEnvironment] = useState<string>();
  const [showHistory, setShowHistory] = useState(false);
  const [module, setModule] = useState<Module>('drift');
  // The draft of the masked types, for the scope it was made in.
  const [piiDraft, setPiiDraft] = useState<{ scope: string; switches: Switches }>();
  // The action that waits for the answer of Save your changes?.
  const [leaving, setLeaving] = useState<{ then: () => void }>();
  const tenantId = workspaces.some(w => w.tenant_id === chosenWorkspace) ? chosenWorkspace! : workspaces[0]?.tenant_id;
  const environments = useQuery({
    queryKey: environmentsKey(tenantId ?? ''),
    queryFn: ({ signal }) => barricadeApi.environments(tenantId!, signal),
    enabled: !!tenantId,
  });
  const envs = [...(environments.data?.items ?? [])].sort(byProduction);
  const environment = envs.find(e => e.id === chosenEnvironment) ?? envs[0];
  const current = useQuery({
    queryKey: barricadeKey(tenantId ?? '', environment?.id ?? ''),
    queryFn: ({ signal }) => barricadeApi.get(tenantId!, environment!.id, signal),
    enabled: !!tenantId && !!environment,
  });
  const pii = useWorkspacesPii(workspaces.map(w => w.tenant_id));
  const catalog = useCatalog();
  const agents = useEnvironmentAgents(auth.session && tenantId && environment ? { userId: auth.session.user.id, tenantId, environmentId: environment.id } : undefined);
  const workspaceName = workspaces.find(w => w.tenant_id === tenantId)?.name ?? '';
  const envLabel = environment ? environmentLabel(environment.name) : '';
  const scope = environment ? `${workspaceName} · ${envLabel}` : workspaceName;
  const scopeKey = `${tenantId}/${environment?.id}`;

  const stored = current.data && catalog.data ? toSwitches(catalog.data.items, current.data.setting.pii_policies.masked_types) : undefined;
  const draft = piiDraft?.scope === scopeKey ? piiDraft.switches : stored;
  const dirty = module === 'pii' && !!draft && !!stored && !sameSwitches(draft, stored);
  const savePii = useMutation({
    mutationKey: barricadeSaveKey(tenantId ?? '', environment?.id ?? ''),
    mutationFn: () => barricadeApi.save(tenantId!, environment!.id, withPii(current.data!.setting, p => ({ ...p, masked_types: fromSwitches(catalog.data!.items, draft!) }))),
    onSuccess: next => {
      client.setQueryData(barricadeKey(tenantId!, environment!.id), next);
      void client.invalidateQueries({ queryKey: [...barricadeKey(tenantId!, environment!.id), 'changes'] });
      setPiiDraft(undefined);
    },
  });
  const saving = useIsMutating({ mutationKey: barricadeSaveKey(tenantId ?? '', environment?.id ?? '') }) > 0;
  const discard = () => { setPiiDraft(undefined); savePii.reset(); };
  // Every way out of the module with unsaved masked types asks first: the selects and the module
  // tabs through leave, the other navigations of the Admin through the router blocker, and a
  // reload or a closed browser tab through the native prompt.
  const leave = (then: () => void) => { if (dirty) setLeaving({ then }); else then(); };
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const pending = leaving ?? (blocker.state === 'blocked' ? { then: () => blocker.proceed() } : undefined);
  const stay = () => { setLeaving(undefined); if (blocker.state === 'blocked') blocker.reset(); };
  const go = () => { const then = pending!.then; setLeaving(undefined); then(); };
  const agentName = (id: string) => agents.data?.find(a => a.id === id)?.name ?? 'A removed agent';

  // Built only after body checks that the environment and its setting are loaded.
  const editor = () => module === 'drift'
    ? <BehaviorDriftEditor key={scopeKey} tenantId={tenantId!} environmentId={environment!.id} environmentLabel={envLabel} current={current.data!} />
    : catalog.isError ? <div className="cp-admin-notice" role="alert">Could not load the types of personal data. <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => void catalog.refetch()}>Retry</button></div>
      : !catalog.data || !draft ? <p role="status">Loading the PII policies…</p>
        : <PiiPoliciesEditor key={scopeKey} tenantId={tenantId!} environmentId={environment!.id} environmentLabel={envLabel} current={current.data!} catalog={catalog.data.items}
          agents={agents.data} draft={draft} onDraft={switches => setPiiDraft({ scope: scopeKey, switches })}
          saving={savePii.isPending} saveError={savePii.isError ? savePii.error : undefined} onSave={() => savePii.mutate()} onCancel={() => leave(discard)} />;

  const body = auth.contextLoading ? <p role="status">Loading your workspaces…</p>
    : workspaces.length === 0 ? <p className="cp-admin-muted">Barricade is set by the Admins of a workspace. You are not Admin of any workspace.</p>
      : environments.isError ? <div className="cp-admin-notice" role="alert">Could not load the environments. <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => void environments.refetch()}>Retry</button></div>
        : !environment || current.isPending ? <p role="status">Loading the setting…</p>
          : current.isError ? <div className="cp-admin-notice" role="alert">{current.error instanceof HttpError && current.error.status === 404 ? 'This environment has no Barricade setting you can read.' : 'Could not load the setting.'} <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => void current.refetch()}>Retry</button></div>
            : <div className="barricade-layout">
              <div className="cp-admin-inner-tabs" role="group" aria-label="Security modules">
                <button type="button" aria-current={module === 'drift' ? 'page' : undefined} onClick={() => leave(() => { discard(); setModule('drift'); })}><Activity size={17} aria-hidden="true" />Behavior drift</button>
                <button type="button" aria-current={module === 'pii' ? 'page' : undefined} onClick={() => setModule('pii')}><ScanEye size={17} aria-hidden="true" />PII Policies</button>
              </div>
              {editor()}
            </div>;

  return <main id="main-content" className="admin-page cp-admin-container barricade-page" aria-label="Barricade" tabIndex={-1}>
    <AccountTabs />
    <header className="access-page-heading barricade-heading">
      <div>
        <h1 className="cp-admin-title">Barricade</h1>
        <p className="cp-admin-muted">Security settings of each environment of a workspace. Sandbox and Production are set apart.</p>
      </div>
      {workspaces.length > 0 ? <div className="barricade-scope">
        <label className="cp-admin-field">Workspace<SelectMenu block label="Workspace" value={tenantId ?? ''} options={workspaces.map(w => ({ value: w.tenant_id, label: w.name, status: status(workspaceOn(pii.get(w.tenant_id))) }))}
          onChange={value => leave(() => { discard(); setWorkspace(value); setEnvironment(undefined); setShowHistory(false); })} /></label>
        <label className="cp-admin-field">Environment<SelectMenu block label="Environment" value={environment?.id ?? ''} disabled={!environment}
          options={envs.map(e => ({ value: e.id, label: environmentLabel(e.name), status: status(pii.get(tenantId ?? '')?.find(x => x.id === e.id)?.enabled) }))}
          onChange={value => leave(() => { discard(); setEnvironment(value); setShowHistory(false); })} /></label>
        {module === 'pii' ? <button type="button" className="cp-admin-button cp-admin-button--ghost barricade-history-button" disabled={!environment} onClick={() => document.getElementById('pii-agents')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><SlidersHorizontal size={16} aria-hidden="true" />Manage</button> : null}
        <button type="button" className="cp-admin-button cp-admin-button--ghost barricade-history-button" disabled={!environment} onClick={() => setShowHistory(true)}><History size={16} aria-hidden="true" />History</button>
      </div> : null}
    </header>
    {body}
    {showHistory && tenantId && environment ? <BarricadeHistory tenantId={tenantId} environmentId={environment.id} scope={scope} agentName={agentName} onClose={() => setShowHistory(false)} /> : null}
    {pending ? <UnsavedChangesDialog what={`the masked types of ${envLabel}`} busy={saving} error={savePii.isError ? piiSaveError(savePii.error) : undefined}
      onSave={() => savePii.mutate(undefined, { onSuccess: go })} onDiscard={() => { discard(); go(); }} onKeep={stay} /> : null}
  </main>;
}
