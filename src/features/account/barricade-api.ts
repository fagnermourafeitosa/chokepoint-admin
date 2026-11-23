import { httpClient } from '../../api/http-client';
import type { EnvironmentRecord } from '../auth/AuthContext';

// Backend 101: the Barricade setting of a workspace environment and its change history.
export type BarricadeResponse = 'alert' | 'suspend_tool' | 'disable_agent';
export type Heuristic = 'learning_days' | 'pattern_days' | 'known_days' | 'spike_factor' | 'spike_floor';
export type Anomaly = 'spike' | 'new_tool' | 'new_sequence';
// The detection window names its unit, hours, so that the stored document says what the number is (hotfix of Backend 099).
export type DetectionWindow = { length: number; unit: 'hours' };
export type BehaviorDrift = Record<Heuristic, number> & { detection_window: DetectionWindow; responses: Record<Anomaly, BarricadeResponse> };
// Backend 105, Implementation Decisions 9 and 18b: the PII policies of the environment, in version 2.
// enabled is the PII filter of the environment; agents holds only the agents with an own policy or
// with their filter off: enabled absent is on, masked_types absent follows the environment.
export type AgentPii = { enabled?: boolean; masked_types?: string[] };
export type PiiPolicies = { enabled: boolean; masked_types: string[]; agents: Record<string, AgentPii> | null };
export type BarricadeSetting = { version: 2; behavior_drift: BehaviorDrift; pii_policies: PiiPolicies };
// A history entry saved before Backend 105 is version 1, with no PII policies.
export type StoredSetting = { version: 1 | 2; behavior_drift: BehaviorDrift; pii_policies?: PiiPolicies };
// Backend 105, Implementation Decision 8: one entity type of the catalog.
export type EntityType = { key: string; group: string; placeholder: string };
export type Author = { name: string; email: string };
// updated_by is null while the environment keeps the market defaults it was created with.
export type BarricadeCurrent = { setting: BarricadeSetting; updated_at: string; updated_by: Author | null };
// The creation entry has no author and no previous setting.
export type BarricadeChange = { changed_at: string; changed_by: Author | null; before: StoredSetting | null; after: StoredSetting };
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
  // Backend 105, Implementation Decision 8: the catalog, the same for every workspace.
  entityTypes: (signal: AbortSignal) => httpClient<{ items: EntityType[] }>('/v1/pii/entity-types', { signal }),
};

export const entityTypesKey = ['pii', 'entity-types'] as const;

// Every save of one environment's setting carries this key, so a screen can hold a second save
// while one is in flight: each save sends the whole document built from the cached setting, and
// two at once would drop the change of the first (Admin 063, formal review).
export const barricadeSaveKey = (tenantId: string, environmentId: string) => ['barricade-save', tenantId, environmentId] as const;

// A copy of the stored setting with its PII policies changed: the only way the screens build a
// save, so a save never drops the section that the screen did not change (Backend 105: PUT
// replaces the whole document, version 2).
export function withPii(setting: BarricadeSetting, change: (pii: PiiPolicies) => PiiPolicies): BarricadeSetting {
  return { ...setting, version: 2, pii_policies: change({ ...setting.pii_policies, agents: { ...(setting.pii_policies.agents ?? {}) } }) };
}
