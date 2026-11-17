import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '../../api/http-client';
import { SelectMenu } from '../../components/ui/dropdown/SelectMenu';
import { Notice } from '../../components/ui/notice/Notice';
import { barricadeApi, barricadeKey, type BarricadeCurrent, type BehaviorDrift, type Heuristic } from './barricade-api';
import { anomalies, detectionWindow, fieldLabel, heuristics, responses, utc } from './barricade-terms';

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div className="identity-section-heading"><h2>{title}</h2><p>{description}</p></div>;
}

function saveError(error: unknown) {
  if (error instanceof HttpError && error.code === 'invalid_barricade_setting') {
    const label = fieldLabel(error.field);
    return label ? `${label} is out of range. Check the value and save again.` : 'The setting was refused. Check the values and save again.';
  }
  if (error instanceof HttpError && error.status === 404) return 'This environment was not found, or you are no longer Admin of the workspace.';
  return 'Could not save the setting. Try again.';
}

// Admin 062, item 4: the Behavior drift module of Barricade for one environment. The page mounts it
// again for each environment and after each save, so the form always starts from the stored setting.
export function BehaviorDriftEditor({ tenantId, environmentId, environmentLabel, current }: { tenantId: string; environmentId: string; environmentLabel: string; current: BarricadeCurrent }) {
  const client = useQueryClient();
  const stored = current.setting.behavior_drift;
  const [draft, setDraft] = useState<BehaviorDrift>(stored);
  const save = useMutation({
    mutationFn: () => barricadeApi.save(tenantId, environmentId, { version: 1, behavior_drift: draft }),
    onSuccess: next => {
      client.setQueryData(barricadeKey(tenantId, environmentId), next);
      void client.invalidateQueries({ queryKey: [...barricadeKey(tenantId, environmentId), 'changes'] });
    },
  });
  const dirty = JSON.stringify(draft) !== JSON.stringify(stored);
  const enforcing = anomalies.some(a => draft.responses[a.key] !== 'alert');
  const setNumber = (key: Heuristic, value: string) => { setDraft(d => ({ ...d, [key]: value === '' ? Number.NaN : Number(value) })); };
  const submit = (event: FormEvent) => { event.preventDefault(); if (dirty && !save.isPending) save.mutate(); };
  const lastChange = current.updated_by
    ? `Changed by ${current.updated_by.name}${current.updated_by.email ? ` (${current.updated_by.email})` : ''} on ${utc(current.updated_at)}`
    // The defaults date from the environment's creation, or from Backend 101's migration for an older environment.
    : `Market defaults since ${utc(current.updated_at)}`;
  return <form className="cp-admin-panel identity-form identity-form-redesign" aria-label="Behavior drift" onSubmit={submit}>
    <div className="barricade-module-head"><h2>Behavior drift</h2><small className="cp-admin-muted">{environmentLabel} · {lastChange}</small></div>
    <div className="identity-form-section">
      <SectionHeading title="Detection" description="How each agent's baseline is learned and when an anomaly is raised." />
      <div className="identity-form-fields barricade-fields">
        <label className="cp-admin-field">{detectionWindow.label}
          <span className="barricade-input"><input className="cp-admin-input" type="number" required min={1} max={24} step={1} value={Number.isNaN(draft.detection_window.length) ? '' : draft.detection_window.length}
            onChange={e => { const value = e.target.value; setDraft(d => ({ ...d, detection_window: { ...d.detection_window, length: value === '' ? Number.NaN : Number(value) } })); }} /><span className="cp-admin-muted">{detectionWindow.unit}</span></span>
          <small>{detectionWindow.help}</small></label>
        {heuristics.map(h => <label key={h.key} className="cp-admin-field">{h.label}
          <span className="barricade-input"><input className="cp-admin-input" type="number" required min={1} step={1} value={Number.isNaN(draft[h.key]) ? '' : draft[h.key]} onChange={e => setNumber(h.key, e.target.value)} /><span className="cp-admin-muted">{h.unit}</span></span>
          <small>{h.help}</small></label>)}
      </div>
    </div>
    <div className="identity-form-section barricade-last-section">
      <SectionHeading title="Automated response" description="The action taken when an anomaly is raised. Alert is the default; the other actions block calls without waiting for a person." />
      <div className="identity-form-fields">
        <table className="cp-admin-table barricade-table">
          <thead><tr><th scope="col">Anomaly</th><th scope="col">Action</th></tr></thead>
          <tbody>{anomalies.map(a => <tr key={a.key}>
            <td><strong>{a.label}</strong><small className="cp-admin-muted barricade-detail">{a.detail}</small></td>
            <td><SelectMenu block label={`Action for ${a.label}`} value={draft.responses[a.key]} options={responses} onChange={value => { setDraft(d => ({ ...d, responses: { ...d.responses, [a.key]: value } })); }} /></td>
          </tr>)}</tbody>
        </table>
        {enforcing ? <Notice tone="warning" title="Calls will be blocked automatically">A suspended tool denies every call of that agent until an administrator restores it; a disabled agent gets no token and its next call is refused. For an agent in Report-only, the calls run and are recorded as would deny.</Notice> : null}
      </div>
    </div>
    {save.isError ? <div className="cp-admin-notice" role="alert">{saveError(save.error)}</div> : null}
    <footer className="identity-form-actions barricade-footer"><span />
      <button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={!dirty || save.isPending} onClick={() => { setDraft(stored); save.reset(); }}>Cancel</button>
      <button className="cp-admin-button" type="submit" disabled={!dirty || save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</button>
    </footer>
  </form>;
}
