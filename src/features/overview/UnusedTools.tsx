import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { Dialog } from '../../components/ui/dialog/Dialog';
import type { EnvironmentScope } from '../access/environment-scope';
import { actionPath } from '../access/target-context';
import { traceKey } from '../investigate/api';
import { QueryError, TracePager } from '../investigate/TraceUI';
import { overviewApi } from './api';
export function UnusedTools({ scope, onClose }: { scope: EnvironmentScope; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: [...traceKey(scope), 'unused-tools', page],
    queryFn: ({ signal }) => overviewApi.unused(scope, page, signal),
  });
  return (
    <Dialog title="Tools with no recorded allowed calls" onClose={onClose}>
      <div className="admin-dialog-body">
        <p>
          Currently granted tools with no recorded allowed call in the last 30 days. This does not
          prove that a tool was never used.
        </p>
        {query.isError ? (
          <QueryError text="The tools could not be loaded." retry={() => void query.refetch()} />
        ) : query.isPending ? (
          <p role="status">Loading tools…</p>
        ) : query.data.items.length ? (
          query.data.items.map((t) => (
            <article className="overview-unused-row" key={`${t.server_id}-${t.tool}`}>
              <strong>{t.tool}</strong>
              <small>{t.server_name || t.server_id}</small>
              <div>
                {t.actions.map((a, i) => {
                  const path = actionPath(a);
                  return path ? (
                    <button
                      key={i}
                      className="cp-admin-button cp-admin-button--ghost"
                      onClick={() => {
                        onClose();
                        navigate(path);
                      }}
                    >
                      {a.label}
                    </button>
                  ) : (
                    <small key={i}>{a.unavailable_reason || 'Access target unavailable'}</small>
                  );
                })}
              </div>
            </article>
          ))
        ) : (
          <p>No tools match this recorded-use query.</p>
        )}
      </div>
      <TracePager
        page={page}
        total={query.data?.total || 0}
        size={query.data?.page_size || 6}
        busy={query.isFetching}
        onPage={setPage}
      />
      <div className="admin-dialog-actions">
        <button className="cp-admin-button cp-admin-button--secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </Dialog>
  );
}
