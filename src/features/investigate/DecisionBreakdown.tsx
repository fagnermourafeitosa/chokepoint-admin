import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { EnvironmentScope } from '../access/environment-scope';
import { traceApi, traceKey } from './api';
import { problemKey, type DecisionDetail } from './types';
import { QueryError, TracePager, utcTime } from './TraceUI';
import { subjectName } from './labels';
export function DecisionBreakdown({
  scope,
  detail,
  select,
}: {
  scope: EnvironmentScope;
  detail: DecisionDetail;
  select: (id: string) => void;
}) {
  const [page, setPage] = useState(1);
  const problem = detail.problem;
  const query = useQuery({
    queryKey: [...traceKey(scope), 'breakdown', problem, page],
    queryFn: ({ signal }) => traceApi.breakdown(scope, problemKey(problem!), page, signal),
    enabled: !!problem,
  });
  if (!problem) return null;
  return (
    <section className="trace-breakdown">
      <h3>Decisions in this problem · {problem.count}</h3>
      {query.isError ? (
        <QueryError
          text="The decisions in this problem could not be loaded."
          retry={() => void query.refetch()}
        />
      ) : query.isPending ? (
        <p role="status">Loading decisions…</p>
      ) : (
        <div className="trace-breakdown-list">
          {query.data.items.map((d) => (
            <button
              key={d.id}
              className={d.id === detail.decision.id ? 'is-selected' : ''}
              onClick={() => select(d.id)}
            >
              <time dateTime={d.decided_at}>{utcTime(d.decided_at)}</time>
              <span>{subjectName(d.subject)}</span>
              <code>{d.resource ? `${d.resource.type} › ${d.resource.id}` : d.condition || d.reason?.label || 'allowed'}</code>
            </button>
          ))}
        </div>
      )}
      <TracePager
        page={page}
        total={query.data?.total || 0}
        size={query.data?.page_size || 6}
        busy={query.isFetching}
        onPage={setPage}
      />
    </section>
  );
}
