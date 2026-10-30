import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import type { EnvironmentScope } from '../access/environment-scope';
import { mcpApi, mcpKey, type MCPServer } from './api';
import { QueryError, TracePager } from '../investigate/TraceUI';
async function catalog(scope: EnvironmentScope, signal: AbortSignal) {
  const servers: MCPServer[] = [];
  let offset: number | null = 0;
  while (offset !== null) {
    const page = await mcpApi.list(scope, offset, signal);
    servers.push(...page.items);
    if (page.next_offset !== null && page.next_offset <= offset)
      throw new Error('Invalid catalog pagination');
    offset = page.next_offset;
  }
  return servers;
}
// Review coverage includes both Enterprise and Custom connections.
export function ToolReviewCatalog({ scope }: { scope: EnvironmentScope }) {
  const query = useQuery({
    queryKey: [...mcpKey(scope), 'review-catalog'],
    queryFn: ({ signal }) => catalog(scope, signal),
  });
  const navigate = useNavigate();
  const [onlyUnreviewed, setOnlyUnreviewed] = useState(false);
  const [page, setPage] = useState(1);
  const rows = (query.data || []).flatMap((server) =>
    server.tools
      .filter((t) => t.selected && t.change !== 'removed' && (!onlyUnreviewed || !t.reviewed))
      .map((tool) => ({ server, tool })),
  );
  return (
    <section className="cp-admin-panel">
      <header className="attention-inbox-header">
        <div>
          <span className="attention-kicker">Tool catalog</span>
          <h2>Review coverage</h2>
        </div>
        <label>
          <input
            type="checkbox"
            checked={onlyUnreviewed}
            onChange={(e) => {
              setOnlyUnreviewed(e.target.checked);
              setPage(1);
            }}
          />{' '}
          Needs review only
        </label>
      </header>
      {query.isError ? (
        <QueryError
          text="The tool catalog could not be loaded."
          retry={() => void query.refetch()}
        />
      ) : query.isPending ? (
        <p role="status" className="attention-status">
          Loading tools…
        </p>
      ) : (
        <div className="cp-admin-table-scroll">
          <table className="cp-admin-table">
            <thead>
              <tr>
                <th>Tool</th>
                <th>Connection</th>
                <th>Review</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice((page - 1) * 10, page * 10).map(({ server, tool }) => (
                <tr key={`${server.id}-${tool.name}`}>
                  <td>
                    <code>{tool.name}</code>
                  </td>
                  <td>{server.name}</td>
                  <td>{tool.reviewed ? 'Reviewed' : 'Needs review'}</td>
                  <td>
                    <button
                      className="cp-admin-button cp-admin-button--ghost"
                      onClick={() =>
                        navigate(
                          `/access/integrations?${new URLSearchParams({ type: server.connection_type === 'enterprise' ? 'enterprise' : 'custom', server: server.id, tool: tool.name })}`,
                        )
                      }
                    >
                      Open tool
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length ? (
            <p className="attention-status">No tools match this review filter.</p>
          ) : null}
        </div>
      )}
      <TracePager page={page} size={10} total={rows.length} onPage={setPage} />
    </section>
  );
}
