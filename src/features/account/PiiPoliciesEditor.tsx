import { useState, type FormEvent } from 'react';
import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { HttpError } from '../../api/http-client';
import { ReportOnlyChip } from '../../components/report-only/ReportOnlyChip';
import { TracePager } from '../investigate/TraceUI';
import type { AgentRecord } from '../access/agent-api';
import { barricadeApi, barricadeKey, barricadeSaveKey, withPii, type AgentPii, type BarricadeCurrent, type EntityType } from './barricade-api';
import { fromSwitches, groupTypes, setAgent, toSwitches, typeLabel, type Switches } from './pii-terms';
import { PiiAgentPanel } from './PiiAgentPanel';
import { PiiTypeGroups } from './PiiTypeGroups';

const pageSize = 10;

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div className="identity-section-heading"><h2>{title}</h2><p>{description}</p></div>;
}

export function piiSaveError(error: unknown) {
  if (error instanceof HttpError && error.code === 'invalid_barricade_setting') {
    return error.field?.startsWith('pii_policies.agents') ? 'An agent of this policy no longer exists in this environment. Reload the page and save again.' : 'The setting was refused. Reload the page and save again.';
  }
  if (error instanceof HttpError && error.status === 404) return 'This environment was not found, or you are no longer Admin of the workspace.';
  return 'Could not save the setting. Try again.';
}

// The difference of an own policy from its environment: only the types where they differ.
function difference(own: string[] | undefined, env: string[]) {
  if (!own) return <span className="cp-admin-muted">Same as the environment</span>;
  const off = env.filter(k => !own.includes(k)).map(typeLabel);
  const on = own.filter(k => !env.includes(k)).map(typeLabel);
  if (!off.length && !on.length) return <span className="cp-admin-muted">Same as the environment</span>;
  return <span>{[off.length ? `${off.join(', ')} not masked` : '', on.length ? `${on.join(', ')} masked` : ''].filter(Boolean).join('; ')}</span>;
}

// Admin 063: the PII Policies module of Barricade for one environment. The draft of the masked
// types belongs to the page, which asks before it is lost (item 13); the agent switches and the
// agent policies save at once, from the stored setting, never from the draft.
export function PiiPoliciesEditor({ tenantId, environmentId, environmentLabel, current, catalog, agents, draft, onDraft, saving, saveError, onSave, onCancel }: {
  tenantId: string; environmentId: string; environmentLabel: string; current: BarricadeCurrent; catalog: EntityType[];
  agents: AgentRecord[] | undefined; draft: Switches; onDraft: (next: Switches) => void;
  saving: boolean; saveError: unknown; onSave: () => void; onCancel: () => void;
}) {
  const client = useQueryClient();
  const groups = groupTypes(catalog);
  const pii = current.setting.pii_policies;
  const stored = toSwitches(catalog, pii.masked_types);
  const dirty = catalog.some(t => !!draft[t.key] !== !!stored[t.key]);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AgentRecord>();
  const entries = pii.agents ?? {};
  const store = useMutation({
    mutationKey: barricadeSaveKey(tenantId, environmentId),
    mutationFn: ({ id, entry }: { id: string; entry: AgentPii }) => barricadeApi.save(tenantId, environmentId, withPii(current.setting, p => setAgent(p, id, entry))),
    onSuccess: next => {
      client.setQueryData(barricadeKey(tenantId, environmentId), next);
      void client.invalidateQueries({ queryKey: [...barricadeKey(tenantId, environmentId), 'changes'] });
      setEditing(undefined);
    },
  });
  // One save of this setting at a time: the masked types, an agent switch and an agent panel.
  const busy = useIsMutating({ mutationKey: barricadeSaveKey(tenantId, environmentId) }) > 0 || saving;
  const submit = (event: FormEvent) => { event.preventDefault(); if (dirty && !busy) onSave(); };
  const rows = (agents ?? []).slice((page - 1) * pageSize, page * pageSize);
  const editingEntry = editing ? entries[editing.id] ?? {} : undefined;
  return <form className="cp-admin-panel identity-form identity-form-redesign" aria-label="PII Policies" onSubmit={submit}>
    <div className="barricade-module-head"><h2>PII Policies</h2><span className="mcp-badge">{environmentLabel}</span></div>
    <div className="identity-form-section">
      <SectionHeading title="Masked types" description="Each value of a masked type is replaced by its type, such as {EMAIL}, in the response of a tool before the agent reads it. The arguments that an agent sends are not changed." />
      <div className="identity-form-fields">
        <PiiTypeGroups groups={groups} columns={['Type', 'Replaced by', 'Mask']} masked={key => !!draft[key]} cells={t => [
          <code>{t.placeholder}</code>,
          <input className="cp-admin-switch" type="checkbox" role="switch" aria-label={`Mask ${t.label}`} checked={!!draft[t.key]} onChange={e => onDraft({ ...draft, [t.key]: e.target.checked })} />,
        ]} />
      </div>
    </div>
    <div id="pii-agents" className="identity-form-section barricade-last-section">
      <SectionHeading title="Agents" description="An agent follows the masked types of its environment, or has its own policy, for example an agent that must not read the contact data of customers." />
      <div className="identity-form-fields">
        {!agents ? <p role="status">Loading the agents…</p> : agents.length === 0 ? <p className="cp-admin-muted">This environment has no agents.</p> : <>
          <div className="cp-admin-table-scroll">
            <table className="cp-admin-table pii-agents-table">
              <thead><tr><th scope="col">Agent</th><th scope="col">PII filter</th><th scope="col">Policy</th><th scope="col">Difference from the environment</th><th scope="col" className="pii-actions">Actions</th></tr></thead>
              <tbody>{rows.map(a => {
                const entry = entries[a.id] ?? {};
                const on = pii.enabled && entry.enabled !== false;
                return <tr key={a.id}>
                  <td><span className="pii-agent"><strong>{a.name}</strong>{a.enforcement === 'report_only' ? <ReportOnlyChip /> : null}</span>{a.description ? <small className="cp-admin-muted pii-detail">{a.description}</small> : null}</td>
                  <td><span className="pii-toggle">
                    <input className="cp-admin-switch cp-admin-switch--status" type="checkbox" role="switch" aria-label={`PII filter of ${a.name} in ${environmentLabel}`} title={pii.enabled ? undefined : `The PII filter of ${environmentLabel} is off. Turn it on in Workspaces.`}
                      disabled={!pii.enabled || busy} checked={on} onChange={e => store.mutate({ id: a.id, entry: { ...entry, enabled: e.target.checked } })} />{environmentLabel}
                  </span></td>
                  <td><span className="mcp-badge" data-tone={entry.masked_types ? 'warning' : undefined}>{entry.masked_types ? 'Own policy' : 'Environment'}</span></td>
                  <td>{difference(entry.masked_types, pii.masked_types)}</td>
                  <td className="pii-actions"><button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" aria-label={`Edit the PII policy of ${a.name}`} onClick={() => { store.reset(); setEditing(a); }}><Pencil size={15} aria-hidden="true" />Edit</button></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
          {store.isError && !editing ? <div className="cp-admin-notice" role="alert">{piiSaveError(store.error)}</div> : null}
          <TracePager page={page} size={pageSize} total={agents.length} onPage={setPage} />
        </>}
      </div>
    </div>
    {saveError ? <div className="cp-admin-notice" role="alert">{piiSaveError(saveError)}</div> : null}
    <footer className="identity-form-actions barricade-footer"><span />
      <button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={!dirty || busy} onClick={onCancel}>Cancel</button>
      <button className="cp-admin-button" type="submit" disabled={!dirty || busy}>{saving ? 'Saving…' : 'Save'}</button>
    </footer>
    {editing && editingEntry ? <PiiAgentPanel name={editing.name} environment={environmentLabel} groups={groups} envSwitches={stored}
      initial={editingEntry.masked_types ? toSwitches(catalog, editingEntry.masked_types) : stored} own={!!editingEntry.masked_types} busy={busy} error={store.isError ? piiSaveError(store.error) : undefined}
      onClose={() => setEditing(undefined)}
      onSave={own => store.mutate({ id: editing.id, entry: { enabled: editingEntry.enabled, masked_types: own ? fromSwitches(catalog, own) : undefined } })} /> : null}
  </form>;
}
