import type { Signal } from './api';

// Each backend route name maps to one Admin path. A route name that is not in
// this map has no link. The Admin never builds a link from a full URL.
const routes: Record<string, string> = {
  'tool-catalog': '/access/integrations?type=custom',
  'person-detail': '/access',
  'decision-detail': '/investigate',
};

export function targetPath(signal: Signal): string | undefined {
  // A tool-discovery signal names its server and connection type, so the action
  // opens the matching integrations tab with that server selected. Any other
  // connection type keeps the Custom MCP tab.
  if (signal.target_route === 'tool-catalog' && signal.target_params.server_id) {
    const type = signal.target_params.connection_type === 'enterprise' ? 'enterprise' : 'custom';
    return `/access/integrations?${new URLSearchParams({ type, server: signal.target_params.server_id })}`;
  }
  return routes[signal.target_route];
}

// discoveryCounts lists the tool changes above zero, for example
// "2 changed · 1 removed".
function discoveryCounts(c: Record<string, string>): string {
  return [
    Number(c.changed) > 0 ? `${c.changed} changed` : '',
    Number(c.removed) > 0 ? `${c.removed} removed` : '',
  ].filter(Boolean).join(' · ');
}

// contextLines builds the two context lines of an Inbox row from the fixed keys
// of each signal type.
export function contextLines(signal: Signal): [string, string] {
  const c = signal.context;
  switch (signal.type) {
    case 'tool-discovery':
      return [c.server ?? '', discoveryCounts(c)];
    case 'requests-denied':
      return [c.tool ?? '', [c.agent, c.count ? `${c.count} requests` : ''].filter(Boolean).join(' · ')];
    case 'idp-user-disable':
      return [c.subject ?? '', ''];
    default:
      // A type added in the backend before this Admin version knows it.
      return [Object.values(c)[0] ?? '', ''];
  }
}
