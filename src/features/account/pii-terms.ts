import type { AgentPii, EntityType, PiiPolicies, StoredSetting } from './barricade-api';

// Admin 063: the names of the PII entity types of Backend 105 (Implementation Decision 7). The
// backend gives the key, group and placeholder; the Admin names them, as Admin 062 names the
// Behavior drift fields. A key that the Admin does not know shows as its key.
const typeNames: Record<string, { label: string; detail?: string }> = {
  password: { label: 'Password', detail: 'Passwords, passphrases and recovery codes' },
  api_key: { label: 'API key', detail: 'Keys, client secrets and private keys of a service' },
  access_token: { label: 'Access token', detail: 'Bearer, refresh and personal access tokens' },
  national_id: { label: 'National ID number', detail: 'CPF, CNPJ, RG, PIS, SSN, ITIN, EIN and other national and tax numbers' },
  passport: { label: 'Passport number' },
  drivers_license: { label: "Driver's license number" },
  payment_card: { label: 'Payment card', detail: 'Card number and security code' },
  bank_account: { label: 'Bank account', detail: 'Account and routing numbers, sort code, IBAN, Pix random key' },
  email: { label: 'Email' },
  phone: { label: 'Phone number' },
  address: { label: 'Address', detail: 'Street with number, postal code, PO box' },
  date_of_birth: { label: 'Date of birth' },
  ip_address: { label: 'IP address' },
};

const groupNames: Record<string, { label: string; description: string }> = {
  secrets: { label: 'Secrets', description: 'Credentials that give access to a system.' },
  documents: { label: 'Documents', description: 'Numbers issued to a person or a company by a government.' },
  financial: { label: 'Financial', description: 'Numbers that move money.' },
  contact: { label: 'Contact', description: 'Ways to reach a person.' },
  person: { label: 'Person', description: 'Who a person is.' },
  network: { label: 'Network', description: 'Where a person connects from.' },
};

export type PiiType = EntityType & { label: string; detail?: string };
export type PiiGroup = { key: string; label: string; description: string; types: PiiType[] };

export const typeLabel = (key: string) => typeNames[key]?.label ?? key;

// groupTypes puts the catalog in its categories, in the order of the catalog.
export function groupTypes(catalog: EntityType[]): PiiGroup[] {
  const groups: PiiGroup[] = [];
  for (const t of catalog) {
    let g = groups.find(x => x.key === t.group);
    if (!g) {
      g = { key: t.group, label: groupNames[t.group]?.label ?? t.group, description: groupNames[t.group]?.description ?? '', types: [] };
      groups.push(g);
    }
    g.types.push({ ...t, label: typeLabel(t.key), detail: typeNames[t.key]?.detail });
  }
  return groups;
}

// A set of masked types as switches, one per type of the catalog.
export type Switches = Record<string, boolean>;
export const toSwitches = (catalog: EntityType[], masked: string[]): Switches => Object.fromEntries(catalog.map(t => [t.key, masked.includes(t.key)]));
export const fromSwitches = (catalog: EntityType[], switches: Switches) => catalog.filter(t => switches[t.key]).map(t => t.key);
export const sameSwitches = (a: Switches, b: Switches) => Object.keys({ ...a, ...b }).every(k => !!a[k] === !!b[k]);

// The agent entry after a change: an entry with its filter on and no own policy is removed, so the
// document keeps only the agents that differ from their environment (Backend 105, 18b).
export function agentEntry(entry: AgentPii): AgentPii | undefined {
  const next: AgentPii = {};
  if (entry.enabled === false) next.enabled = false;
  if (entry.masked_types) next.masked_types = entry.masked_types;
  return Object.keys(next).length ? next : undefined;
}

export function setAgent(pii: PiiPolicies, agentId: string, entry: AgentPii): PiiPolicies {
  const agents = { ...(pii.agents ?? {}) };
  const next = agentEntry(entry);
  if (next) agents[agentId] = next; else delete agents[agentId];
  return { ...pii, agents };
}

// The PII lines of a history entry (Admin 063, item 12): the environment switch, each type of the
// environment, and each agent that gets or leaves an own policy or turns its filter off or on.
export function describePii(before: StoredSetting, after: StoredSetting, agentName: (id: string) => string): string[] {
  const now = after.pii_policies;
  if (!now) return [];
  const was = before.pii_policies;
  if (!was) return ['PII filter ' + (now.enabled ? 'on' : 'off') + ', masked: ' + (now.masked_types.map(typeLabel).join(', ') || 'none')];
  const lines: string[] = [];
  if (was.enabled !== now.enabled) lines.push(`PII filter of the environment ${was.enabled ? 'on' : 'off'} → ${now.enabled ? 'on' : 'off'}`);
  const keys = [...new Set([...was.masked_types, ...now.masked_types])];
  for (const k of keys) {
    const a = was.masked_types.includes(k);
    const b = now.masked_types.includes(k);
    if (a !== b) lines.push(`${typeLabel(k)}: ${a ? 'masked' : 'not masked'} → ${b ? 'masked' : 'not masked'}`);
  }
  const wasAgents = was.agents ?? {};
  const nowAgents = now.agents ?? {};
  for (const id of [...new Set([...Object.keys(wasAgents), ...Object.keys(nowAgents)])]) {
    const a = wasAgents[id] ?? {};
    const b = nowAgents[id] ?? {};
    const name = agentName(id);
    if ((a.enabled ?? true) !== (b.enabled ?? true)) lines.push(`${name}: PII filter ${b.enabled === false ? 'off' : 'on'}`);
    if (JSON.stringify(a.masked_types ?? null) !== JSON.stringify(b.masked_types ?? null)) {
      if (!b.masked_types) lines.push(`${name}: back to the environment`);
      else {
        const env = new Set(now.masked_types);
        const own = new Set(b.masked_types);
        const on = [...own].filter(k => !env.has(k)).map(typeLabel);
        const off = [...env].filter(k => !own.has(k)).map(typeLabel);
        const parts = [on.length ? `${on.join(', ')} masked` : '', off.length ? `${off.join(', ')} not masked` : ''].filter(Boolean);
        lines.push(`${name}: own policy${parts.length ? `, ${parts.join('; ')}` : ''}`);
      }
    }
  }
  return lines;
}
