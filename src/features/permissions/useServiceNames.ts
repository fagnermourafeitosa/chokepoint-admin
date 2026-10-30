import { useEffect, useState } from 'react';
import type { AgentScope } from '../access/agent-api';
import { identityApi, type IdentityConnection } from '../identity/api';
import type { Member, MemberIdentity } from './api';

export const memberKey = (member: MemberIdentity) => JSON.stringify([member.issuer, member.subject]);

// Reads the service list of each connection that has service members, so the group list
// can show a service by name. A saved member has only its subject. When a list cannot be
// read the member keeps showing its subject.
export function useServiceNames(scope: AgentScope, members: Member[], identities: IdentityConnection[]): Record<string, string> {
 const [names, setNames] = useState<Record<string, string>>({});
 const issuers = JSON.stringify([...new Set(members.filter(m => m.kind === 'service').map(m => m.issuer))].sort());
 useEffect(() => {
  const connections = (JSON.parse(issuers) as string[]).map(issuer => identities.find(i => i.issuer === issuer)).filter((c): c is IdentityConnection => !!c);
  if (!connections.length) { setNames({}); return; }
  const controller = new AbortController();
  Promise.allSettled(connections.map(c => identityApi.services(scope, c.id, controller.signal))).then(results => {
   if (controller.signal.aborted) return;
   const next: Record<string, string> = {};
   for (const result of results) if (result.status === 'fulfilled') for (const service of result.value.items) next[memberKey(service.identity)] = service.display_name || service.user_name || service.id;
   setNames(next);
  });
  return () => controller.abort();
  // issuers tracks the connections by value, so a new members array does not reload.
 }, [scope.userId, scope.tenantId, scope.environmentId, issuers, identities]);
 return names;
}
