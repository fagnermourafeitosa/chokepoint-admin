import { useEffect, useState } from 'react';
import type { AgentScope } from '../access/agent-api';
import { identityApi, nameLookupLimit } from '../identity/api';
import type { Member } from './api';
import { memberKey } from './useServiceNames';

// Reads the current directory name of each associated person, so the group list
// shows who is associated. A saved member has only its issuer and subject. When a
// name cannot be read the member keeps showing its subject.
export function usePersonNames(scope: AgentScope, members: Member[]): Record<string, string> {
 const [names, setNames] = useState<Record<string, string>>({});
 const people = JSON.stringify(members.filter(m => m.kind !== 'service').map(m => ({ issuer: m.issuer, subject: m.subject })));
 useEffect(() => {
  const identities = JSON.parse(people) as { issuer: string; subject: string }[];
  if (!identities.length) { setNames({}); return; }
  const controller = new AbortController();
  const chunks = Array.from({ length: Math.ceil(identities.length / nameLookupLimit) }, (_, i) => identities.slice(i * nameLookupLimit, (i + 1) * nameLookupLimit));
  Promise.allSettled(chunks.map(chunk => identityApi.names(scope, chunk, controller.signal))).then(results => {
   if (controller.signal.aborted) return;
   const next: Record<string, string> = {};
   for (const result of results) if (result.status === 'fulfilled') for (const item of result.value.items) next[memberKey(item)] = item.name;
   setNames(next);
  });
  return () => controller.abort();
  // people tracks the members by value, so a new array with the same members does not reload.
 }, [scope.userId, scope.tenantId, scope.environmentId, people]);
 return names;
}
