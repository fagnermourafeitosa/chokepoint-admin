import type { Signal } from './api';

// Each backend route name maps to one Admin path. A route name that is not in
// this map has no link. The Admin never builds a link from a full URL.
const routes: Record<string, string> = {
  'tool-catalog': '/access/integrations?type=custom',
  'person-detail': '/access',
  'decision-detail': '/investigate',
};

export function targetPath(signal: Signal): string | undefined {
  return routes[signal.target_route];
}

// contextLines builds the two context lines of an Inbox row from the fixed keys
// of each signal type.
export function contextLines(signal: Signal): [string, string] {
  const c = signal.context;
  switch (signal.type) {
    case 'tool-discovery':
      return [c.tool ?? '', c.server ?? ''];
    case 'requests-denied':
      return [c.tool ?? '', [c.agent, c.count ? `${c.count} requests` : ''].filter(Boolean).join(' · ')];
    case 'idp-user-disable':
      return [c.subject ?? '', ''];
    default:
      // A type added in the backend before this Admin version knows it.
      return [Object.values(c)[0] ?? '', ''];
  }
}
