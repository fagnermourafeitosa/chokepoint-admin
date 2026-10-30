import { attentionApi, attentionKey } from '../../attention/api';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { traceApi, traceKey } from '../../investigate/api';
import { accessTarget } from '../target-context';
import type { AgentScope } from '../agent-api';
export function useAccessTarget(scope: AgentScope) {
  const [params, setParams] = useSearchParams();
  const decisionId = params.get('decision_id');
  const signalId = params.get('signal_id');
  const item = useQuery({
    queryKey: [...attentionKey(scope), 'detail', signalId],
    queryFn: ({ signal }) => attentionApi.get(scope, signalId!, signal),
    enabled: !!signalId,
    retry: false,
  });
  const detail = useQuery({
    queryKey: [...traceKey(scope), 'detail', decisionId],
    queryFn: ({ signal }) => traceApi.detail(scope, decisionId!, signal),
    enabled: !!decisionId,
    retry: false,
  });
  const candidateIds = [
    ...new Set(
      (detail.data?.actions || item.data?.actions || [])
        .filter((a) => a.available && a.params.agent_id)
        .map((a) => a.params.agent_id),
    ),
  ];
  const requestedId =
    params.get('agent_id') || (candidateIds.length === 1 ? candidateIds[0] : undefined);
  const target = accessTarget(params);
  if (target && detail.data)
    target.principal = {
      issuer: detail.data.decision.issuer,
      subject: detail.data.decision.subject,
    };
  else if (target && item.data?.principal) target.principal = item.data.principal;
  const back = params.get('return_to');
  const returnTo = back && (back === '/' || back.startsWith('/investigate?')) ? back : undefined;
  return {
    target,
    requestedId,
    candidateIds,
    detail,
    returnTo,
    contextual: !!target || params.has('agent_id'),
    invalidSection: params.has('section') && !target,
    select: (id: string | null) =>
      setParams((previous) => {
        const next = new URLSearchParams(previous);
        if (id) next.set('agent_id', id);
        else next.delete('agent_id');
        return next;
      }),
  };
}
