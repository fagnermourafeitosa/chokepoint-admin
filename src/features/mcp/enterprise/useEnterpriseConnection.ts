import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { EnvironmentScope } from '../../access/environment-scope';
import type { MCPServer } from '../api';
import { enterpriseApi } from './api';

export function useEnterpriseConnection(scope: EnvironmentScope) {
  const providers = useQuery({ queryKey: ['mcp-providers', scope.userId, scope.tenantId, scope.environmentId], queryFn: ({ signal }) => enterpriseApi.providers(scope, signal), retry: false });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function connect(provider: string, server?: MCPServer) {
    if (controller.current) return;
    const request = new AbortController(); controller.current = request; setBusy(true); setError('');
    try {
      const result = await enterpriseApi.start(scope, provider, server, request.signal);
      if (request.signal.aborted) return;
      const target = new URL(result.authorization_url);
      if (target.protocol !== 'https:') throw new Error('Invalid authorization URL');
      window.location.assign(target.href);
    } catch {
      if (!request.signal.aborted) setError('Could not start provider authorization. Check application setup and approval, then retry.');
    } finally { if (!request.signal.aborted) { controller.current = null; setBusy(false); } }
  }
  return { scope, providers, busy, error, connect };
}
