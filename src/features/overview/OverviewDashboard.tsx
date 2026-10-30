import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import type { EnvironmentScope } from '../access/environment-scope';
import { traceKey } from '../investigate/api';
import { QueryError, utcTime } from '../investigate/TraceUI';
import { AttentionInbox } from '../attention/AttentionInbox';
import { useInbox } from '../attention/useAttention';
import { overviewApi } from './api';
import { OverviewMetrics } from './OverviewMetrics';
import { TrafficChart } from './TrafficChart';
import { UnusedTools } from './UnusedTools';
import '../attention/attention.css';
import '../investigate/investigate.css';
import './overview.css';
export function OverviewDashboard({
  scope,
  environment,
}: {
  scope: EnvironmentScope;
  environment: string;
}) {
  const query = useQuery({
    queryKey: [...traceKey(scope), 'overview'],
    queryFn: ({ signal }) => overviewApi.get(scope, signal),
    refetchInterval: 60_000,
  });
  const inbox = useInbox(scope);
  const navigate = useNavigate();
  const [unused, setUnused] = useState(false);
  const data = query.data;
  return (
    <>
      <div className="overview-status">
        <span className="overview-status-dot" /> <strong>{environment}</strong>
        <span>·</span>
        {inbox.counts.data ? (
          <span>
            {inbox.counts.data.pending
              ? `${inbox.counts.data.pending} ${inbox.counts.data.pending === 1 ? 'item needs' : 'items need'} you`
              : 'All clear for now'}
          </span>
        ) : (
          <span>
            {inbox.counts.isError ? 'Attention status unavailable' : 'Loading attention status…'}
          </span>
        )}
      </div>
      {query.isError ? (
        <QueryError
          text="The Overview metrics could not be loaded."
          retry={() => void query.refetch()}
        />
      ) : query.isPending ? (
        <div role="status" className="overview-loading">
          <span />
          <span />
          <span />
          <p>Loading recorded activity…</p>
        </div>
      ) : data ? (
        <>
          <OverviewMetrics data={data} />
          <div className="overview-middle">
            <TrafficChart buckets={data.traffic.buckets} />
            <section className="cp-admin-panel overview-most-denied">
              <span className="attention-kicker">Most denied today</span>
              {data.most_denied.length ? (
                data.most_denied.map((row) => (
                  <button
                    key={JSON.stringify([row.server_id, row.tool, row.agent, row.reason.label])}
                    className="overview-top-row"
                    onClick={() =>
                      navigate(
                        `/investigate?${new URLSearchParams({ server_id: row.server_id, tool: row.tool, agent: row.agent, reason: row.reason.label, from: row.from, to: row.to })}`,
                      )
                    }
                  >
                    <span>
                      <code>{row.tool}</code>
                      <small>
                        {row.agent_name || row.agent} · {row.server_name || row.server_id}
                      </small>
                      <small>{row.reason.description}</small>
                    </span>
                    <strong>×{row.count}</strong>
                  </button>
                ))
              ) : (
                <p className="cp-admin-muted">No denied calls recorded today.</p>
              )}
              <button className="overview-unused" onClick={() => setUnused(true)}>
                <strong>{data.unused_tools.count}</strong>
                <span>tools have no recorded allowed calls in 30 days</span>
              </button>
            </section>
          </div>
          <p className="overview-observed">
            Recorded activity through {utcTime(data.generated_at)}
          </p>
        </>
      ) : null}
      <AttentionInbox inbox={inbox} headingId="attention-inbox-heading" />
      {unused ? <UnusedTools scope={scope} onClose={() => setUnused(false)} /> : null}
    </>
  );
}
