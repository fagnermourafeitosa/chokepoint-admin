import type { Action } from '../investigate/types';
export type AccessTarget = {
  section: 'grants' | 'policies' | 'people';
  serverId?: string;
  tool?: string;
  policyId?: string;
  principal?: { issuer: string; subject: string };
};
export function accessTarget(params: URLSearchParams): AccessTarget | undefined {
  const section = params.get('section');
  if (section && !['grants', 'policies', 'people'].includes(section)) return undefined;
  if (!section && !params.has('tool') && !params.has('decision_id') && !params.has('signal_id'))
    return undefined;
  return {
    section: (section as AccessTarget['section']) || 'grants',
    serverId: params.get('server_id') || undefined,
    tool: params.get('tool') || undefined,
    policyId: params.get('policy_id') || undefined,
  };
}
export function actionPath(
  action: Action,
  signalId?: string,
  returnTo?: string,
): string | undefined {
  if (!action.available) return undefined;
  const permitted = new Set([
    'agent_id',
    'server_id',
    'tool',
    'policy_id',
    'decision_id',
    'section',
    'connection_type',
  ]);
  const params = new URLSearchParams(
    Object.entries(action.params).filter(([key]) => permitted.has(key)),
  );
  if (signalId) params.set('signal_id', signalId);
  if (returnTo && (returnTo === '/' || returnTo.startsWith('/investigate?')))
    params.set('return_to', returnTo);
  if (action.route === 'permissions' || action.route === 'person-detail') {
    if (action.route === 'person-detail') params.set('section', 'people');
    else if (!params.has('section'))
      params.set('section', params.has('policy_id') ? 'policies' : 'grants');
    return `/access?${params}`;
  }
  if (action.route === 'tool-catalog') {
    params.set('type', params.get('connection_type') === 'enterprise' ? 'enterprise' : 'custom');
    if (params.has('server_id')) params.set('server', params.get('server_id')!);
    return `/access/integrations?${params}`;
  }
  return undefined;
}
