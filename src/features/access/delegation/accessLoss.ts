import type { SubjectKind } from './api';
import type { Change, Diff } from './revisionDiff';

// The losses of access of a draft (Admin 064 Solution 2): one for each change that takes access
// away, in the order of the change list. Data only; accessLossText.ts writes the lines.
// A change that only gives access has no loss.
export type Loss =
  | { type: 'last-provider' }
  | { type: 'people'; provider: string; names: string[] }
  | { type: 'kinds'; provider: string; kinds: SubjectKind[] }
  | { type: 'blocked'; name: string }
  | { type: 'tool'; tool: string; server: string }
  | { type: 'value'; value: string; kind: string; server: string }
  | { type: 'rule'; tool: string; before?: string; after?: string }
  | { type: 'expiry'; relation: 'provider' | 'tool'; name: string; date: string };

// An expiry takes access away when it is set, or moved to an earlier day.
const shorter = (before?: string, after?: string) => !!after && (!before || after < before);

function lossesOf(c: Change): Loss[] {
  const item = c.item;
  switch (item.type) {
    case 'scope': {
      if (c.kind === 'removed') return [{ type: 'people', provider: item.name, names: (c.children ?? []).map(x => x.label) }];
      if (c.kind === 'added') return [];
      const out: Loss[] = [];
      const lostKinds = item.kindsBefore.filter(k => !item.kindsAfter.includes(k));
      if (lostKinds.length) out.push({ type: 'kinds', provider: item.name, kinds: lostKinds });
      const gone = (c.children ?? []).filter(x => x.kind === 'removed').map(x => x.label);
      if (gone.length && !lostKinds.length) out.push({ type: 'people', provider: item.name, names: gone });
      if (shorter(item.expiresBefore, item.expiresAfter)) out.push({ type: 'expiry', relation: 'provider', name: item.name, date: item.expiresAfter! });
      return out;
    }
    case 'blocked': return c.kind === 'added' ? [{ type: 'blocked', name: item.name }] : [];
    case 'capability':
      if (c.kind === 'removed') return [{ type: 'tool', tool: item.tool, server: item.server }];
      return c.kind === 'changed' && shorter(item.expiresBefore, item.expiresAfter) ? [{ type: 'expiry', relation: 'tool', name: `${item.tool} on ${item.server}`, date: item.expiresAfter! }] : [];
    case 'resource': return c.kind === 'removed' ? [{ type: 'value', value: item.value, kind: item.kind, server: item.server }] : [];
    // A rule takes access away when it is added or when its sentence changes; a new name alone does not.
    case 'rule': return c.kind === 'added' || (c.kind === 'changed' && item.before !== undefined && item.after !== undefined) ? [{ type: 'rule', tool: item.tool, before: item.before, after: item.after }] : [];
    default: return [];
  }
}

// accessLosses: the last identity provider removed is one loss for the whole agent, instead of
// the people of that provider.
// A person blocked in the same draft loses the delegation too: one blocked line, not a second people line.
export function accessLosses({ changes, providersAfter }: Diff): Loss[] {
  const blocked = new Set(changes.flatMap(c => (c.item.type === 'blocked' && c.kind === 'added' ? [c.item.name] : [])));
  const losses = changes.flatMap(lossesOf).flatMap((l): Loss[] => {
    if (l.type !== 'people' || !blocked.size || !l.names.length) return [l];
    const names = l.names.filter(n => !blocked.has(n));
    return names.length ? [{ ...l, names }] : [];
  });
  const providerRemoved = changes.some(c => c.item.type === 'scope' && c.kind === 'removed');
  if (!providerRemoved || providersAfter > 0) return losses;
  const removedNames = new Set(changes.filter(c => c.item.type === 'scope' && c.kind === 'removed').map(c => (c.item.type === 'scope' ? c.item.name : '')));
  return [{ type: 'last-provider' }, ...losses.filter(l => !(l.type === 'people' && removedNames.has(l.provider)))];
}
