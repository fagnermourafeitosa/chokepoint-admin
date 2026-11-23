// Admin 063 prototype: fixed data for the PII policies module of Barricade. Invented for the layout;
// the types, placeholders and defaults are not a backend contract (Backend 105 defines them).

export const environments = [{ value: 'production', label: 'Production' }, { value: 'sandbox', label: 'Sandbox' }];

// The PII filter switches (user decision, 2026-11-22). Each environment has a switch, off in a new
// workspace. The workspace has no state of its own: it is on while one of its environments is on.
// An agent has a switch in each environment, on by default; it filters only while its environment is on.
export type Workspace = { value: string; label: string; tenantId: string; created: string; environments: Record<string, boolean> };
export const workspaces: Workspace[] = [
  { value: 'acme', label: 'Acme', tenantId: '6f1c2d9e-41a7-4b0e-9c55-1d2e7a90b3f4', created: '11 Nov 2026', environments: { production: true, sandbox: false } },
  { value: 'acme-labs', label: 'Acme Labs', tenantId: 'b83e0f17-5c2a-4d61-8e94-7a0c3f5d2e18', created: '20 Nov 2026', environments: { production: false, sandbox: false } },
];
export const workspaceOn = (w: Workspace) => Object.values(w.environments).some(Boolean);
export const filters = (w: Workspace, env: string) => w.environments[env];

export type PiiType = { key: string; label: string; placeholder: string; detail?: string; masked: boolean };
export type PiiGroup = { label: string; description: string; types: PiiType[] };

// The catalog and deploy defaults of Backend 105 (Implementation Decisions 7 and 12): secrets and
// document and financial identifiers are masked; contact, person and network types are not.
export const groups: PiiGroup[] = [
  { label: 'Secrets', description: 'Credentials that give access to a system.', types: [
    { key: 'password', label: 'Password', placeholder: '{PASSWORD}', masked: true },
    { key: 'api_key', label: 'API key', placeholder: '{API_KEY}', masked: true },
    { key: 'access_token', label: 'Access token', placeholder: '{ACCESS_TOKEN}', detail: 'Bearer tokens, session tokens, recovery codes', masked: true },
  ] },
  { label: 'Documents', description: 'Numbers issued to a person by a government.', types: [
    { key: 'national_id', label: 'National ID number', placeholder: '{NATIONAL_ID}', detail: 'CPF, CNPJ, SSN, NIF and other national and tax numbers', masked: true },
    { key: 'passport', label: 'Passport number', placeholder: '{PASSPORT}', masked: true },
    { key: 'drivers_license', label: "Driver's license number", placeholder: '{DRIVERS_LICENSE}', masked: true },
  ] },
  { label: 'Financial', description: 'Numbers that move money.', types: [
    { key: 'payment_card', label: 'Payment card', placeholder: '{PAYMENT_CARD}', detail: 'Card number, expiry date and security code', masked: true },
    { key: 'bank_account', label: 'Bank account', placeholder: '{BANK_ACCOUNT}', detail: 'Account and routing numbers, IBAN', masked: true },
  ] },
  { label: 'Contact', description: 'Ways to reach a person.', types: [
    { key: 'email', label: 'Email', placeholder: '{EMAIL}', masked: false },
    { key: 'phone', label: 'Phone number', placeholder: '{PHONE}', masked: false },
    { key: 'address', label: 'Address', placeholder: '{ADDRESS}', detail: 'Street and postal code. Detected less reliably than the other types.', masked: false },
  ] },
  { label: 'Person', description: 'Who a person is.', types: [
    { key: 'person_name', label: 'Person name', placeholder: '{PERSON_NAME}', masked: false },
    { key: 'date_of_birth', label: 'Date of birth', placeholder: '{DATE_OF_BIRTH}', masked: false },
  ] },
  { label: 'Network', description: 'Where a person connects from.', types: [
    { key: 'ip_address', label: 'IP address', placeholder: '{IP_ADDRESS}', masked: false },
  ] },
];

export const allTypes = groups.flatMap(g => g.types);

// off: the environments where the PII filter switch of the agent is off; its policy is kept.
export type Agent = { name: string; mcp: string; reportOnly?: boolean; off?: Record<string, boolean>; own?: Record<string, boolean> };

// Agents of Acme Production (dev-infra/demo-instance). refunds-assistant needs no contact data of the
// customer, so its own policy also masks their email, phone number and name.
export const agents: Agent[] = [
  { name: 'refunds-assistant', mcp: 'Acme Billing', own: { ...Object.fromEntries(groups.flatMap(g => g.types).map(t => [t.key, t.masked])), email: true, phone: true, person_name: true } },
  { name: 'support-assistant', mcp: 'Acme Helpdesk' },
  { name: 'issues-manager', mcp: 'Acme Issues', off: { production: true } },
  { name: 'analytics-assistant', mcp: 'Acme Analytics', reportOnly: true },
];


export type HistoryEntry = { when: string; who?: { name: string; email: string }; lines: string[] };

const beatriz = { name: 'Beatriz Nunes', email: 'beatriz@acme.test' };

// The change history of Acme Production, newest first. Each line names its module; the PII lines
// follow the before and after of the Barricade setting (Backend 105, Implementation Decision 9).
export const history: HistoryEntry[] = [
  { when: '22 Nov 2026, 16:40 UTC', who: beatriz, lines: ['PII Policies · refunds-assistant: own policy, Email, Phone number, Person name masked'] },
  { when: '22 Nov 2026, 15:12 UTC', who: beatriz, lines: ['PII Policies · Address: not masked → masked', 'PII Policies · IP address: not masked → masked'] },
  { when: '22 Nov 2026, 15:05 UTC', who: beatriz, lines: ['PII Policies · support-assistant: back to the environment'] },
  { when: '22 Nov 2026, 14:58 UTC', who: beatriz, lines: ['PII Policies · reporting-agent: own policy removed with the deleted agent'] },
  { when: '22 Nov 2026, 14:02 UTC', lines: ['PII Policies · created with the defaults: secrets, documents and financial identifiers masked'] },
  { when: '17 Nov 2026, 10:21 UTC', who: beatriz, lines: ['Behavior drift · Spike factor 5 → 4', 'Behavior drift · First use of a tool: Alert → Suspend tool'] },
  { when: '16 Nov 2026, 19:40 UTC', lines: ['Created with the market defaults'] },
];
