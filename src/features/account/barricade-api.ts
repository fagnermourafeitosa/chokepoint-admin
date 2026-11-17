import { httpClient } from '../../api/http-client';
import type { EnvironmentRecord } from '../auth/AuthContext';

// Backend 101: the Barricade setting of a workspace environment and its change history.
export type BarricadeResponse = 'alert' | 'suspend_tool' | 'disable_agent';
export type Heuristic = 'learning_days' | 'pattern_days' | 'known_days' | 'spike_factor' | 'spike_floor';
export type Anomaly = 'spike' | 'new_tool' | 'new_sequence';
// The detection window names its unit, hours, so that the stored document says what the number is (hotfix of Backend 099).
export type DetectionWindow = { length: number; unit: 'hours' };
export type BehaviorDrift = Record<Heuristic, number> & { detection_window: DetectionWindow; responses: Record<Anomaly, BarricadeResponse> };
export type BarricadeSetting = { version: 1; behavior_drift: BehaviorDrift };
export type Author = { name: string; email: string };
// updated_by is null while the environment keeps the market defaults it was created with.
export type BarricadeCurrent = { setting: BarricadeSetting; updated_at: string; updated_by: Author | null };
// The creation entry has no author and no previous setting.
export type BarricadeChange = { changed_at: string; changed_by: Author | null; before: BarricadeSetting | null; after: BarricadeSetting };
export type BarricadeChanges = { items: BarricadeChange[]; total: number; page: number; page_size: number };

export const barricadeKey = (tenantId: string, environmentId: string) => ['account', 'barricade', tenantId, environmentId] as const;
const base = (tenantId: string, environmentId: string) =>
  `/v1/workspaces/${encodeURIComponent(tenantId)}/environments/${encodeURIComponent(environmentId)}/barricade` as const;

export const barricadeApi = {
  environments: (tenantId: string, signal: AbortSignal) =>
    httpClient<{ items: EnvironmentRecord[] }>(`/v1/workspaces/${encodeURIComponent(tenantId)}/environments`, { signal }),
  get: (tenantId: string, environmentId: string, signal: AbortSignal) => httpClient<BarricadeCurrent>(base(tenantId, environmentId), { signal }),
  save: (tenantId: string, environmentId: string, setting: BarricadeSetting) =>
    httpClient<BarricadeCurrent>(base(tenantId, environmentId), { method: 'PUT', json: setting }),
  changes: (tenantId: string, environmentId: string, page: number, signal: AbortSignal) =>
    httpClient<BarricadeChanges>(`${base(tenantId, environmentId)}/changes?page=${page}`, { signal }),
};
