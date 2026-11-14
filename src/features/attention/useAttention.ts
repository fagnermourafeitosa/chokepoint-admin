import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attentionApi, attentionKey } from './api';
import type { SeverityFilter, SignalType, StatusFilter } from './api';
import type { EnvironmentScope } from '../access/environment-scope';
export function useInbox(scope: EnvironmentScope) {
  const [type, setType] = useState<SignalType | 'all'>('all');
  const [status, setStatus] = useState<StatusFilter>('active');
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [page, setPage] = useState(1);
  const list = useQuery({ queryKey: [...attentionKey(scope), 'list', type, status, severity, page], queryFn: ({ signal }) => attentionApi.list(scope, type, page, status, severity, signal) });
  const counts = useQuery({ queryKey: [...attentionKey(scope), 'counts'], queryFn: ({ signal }) => attentionApi.counts(scope, signal) });
  const lastPage = Math.max(1, Math.ceil((list.data?.total || 0) / (list.data?.page_size || 5)));
  useEffect(() => { if (list.data && page > lastPage) setPage(lastPage); }, [list.data, page, lastPage]);
  return { scope, list, counts, lastPage, page, setPage, type, status, severity,
    setSeverity: (value: SeverityFilter) => { setSeverity(value); setPage(1); },
    setType: (value: SignalType | 'all') => { setType(value); setPage(1); },
    setStatus: (value: StatusFilter) => { setStatus(value); setPage(1); },
  };
}
