// Fixed data of the harness access prototype (Admin 036, Backend 045). Nothing here comes from the backend.
// The CIMD URLs are placeholders: the real ones come from the harness catalog (Backend 045 Resolved Decision 27).

export const agentName = 'Claude Code — Developers';
export const idpName = 'Keycloak Customer Test';
export const mcpUrl = 'http://127.0.0.1:8081/api/v1/mcp/11111111-1111-4111-8111-111111111111/8f6b36fc-cdb0-4c0c-a10f-fb07cbed5a24';
export const redirectUri = 'http://127.0.0.1:8081/as/11111111-1111-4111-8111-111111111111/8f6b36fc-cdb0-4c0c-a10f-fb07cbed5a24/callback';

export type Client = { url: string; name: string; sharedWith: string[] };
export const catalog: Client[] = [
  { name: 'Claude Code', url: 'https://claude.ai/oauth/claude-code-client-metadata', sharedWith: ['Claude Code — SRE'] },
  { name: 'Cursor', url: 'https://cursor.com/.well-known/oauth-client', sharedWith: [] },
  { name: 'Codex', url: 'https://chatgpt.com/.well-known/codex-oauth-client', sharedWith: [] },
];

export const groups = [
  { id: 'g-dev', name: 'developers', path: '/engineering/developers' },
  { id: 'g-sre', name: 'sre', path: '/engineering/sre' },
  { id: 'g-platform', name: 'platform', path: '/engineering/platform' },
  { id: 'g-contractors', name: 'contractors', path: '/contractors' },
  { id: 'g-finance', name: 'finance', path: '/finance' },
  { id: 'g-support', name: 'support', path: '/support' },
];

export const directory = [
  { subject: 'alice', name: 'Alice Martins' },
  { subject: 'bruno', name: 'Bruno Lima' },
  { subject: 'carla', name: 'Carla Souza' },
  { subject: 'diego', name: 'Diego Rocha' },
];
export const blocked = [{ subject: 'diego', name: 'Diego Rocha', reason: 'Left the payments team' }];

export type Machine = { id: string; client: string; created: string; lastUsed: string; dpop: boolean };
export type Session = { subject: string; name: string; group: string; consentEnds: string; machines: Machine[] };
export const sessions: Session[] = [
  { subject: 'alice', name: 'Alice Martins', group: 'developers', consentEnds: 'Nov 10, 2026', machines: [{ id: 'g1', client: 'Claude Code', created: 'Nov 3, 09:12', lastUsed: '2 min ago', dpop: true }, { id: 'g2', client: 'Cursor', created: 'Nov 1, 14:40', lastUsed: 'Yesterday', dpop: false }] },
  { subject: 'bruno', name: 'Bruno Lima', group: 'developers', consentEnds: 'Nov 5, 2026', machines: [{ id: 'g3', client: 'Claude Code', created: 'Oct 29, 18:02', lastUsed: '3 h ago', dpop: true }] },
  { subject: 'carla', name: 'Carla Souza', group: 'developers', consentEnds: 'Dec 1, 2026', machines: [{ id: 'g4', client: 'Codex', created: 'Nov 2, 11:30', lastUsed: '20 h ago', dpop: false }] },
];

export const consentTools = [
  { server: 'GitHub', items: ['list_pull_requests', 'merge_pull_request'], note: 'Repositories acme/payments-api, acme/web' },
  { server: 'Jira', items: ['search_issues', 'update_issue'], note: '' },
];
