const utc = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
export const utcTime = (value: string) => `${utc.format(new Date(value))} UTC`;
export function QueryError({ text, retry }: { text: string; retry: () => void }) {
  return (
    <div role="alert" className="trace-query-error">
      <p>{text}</p>
      <button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={retry}>
        Retry
      </button>
    </div>
  );
}
export function TracePager({
  page,
  size,
  total,
  onPage,
  busy = false,
}: {
  page: number;
  size: number;
  total: number;
  onPage: (n: number) => void;
  busy?: boolean;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <nav className="trace-pager" aria-label="Pagination">
      <span>
        {total} {total === 1 ? 'record' : 'records'}
      </span>
      <div>
        <button
          className="cp-admin-button cp-admin-button--secondary cp-admin-button--small"
          disabled={page <= 1 || busy}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        <span>
          {page} / {pages}
        </span>
        <button
          className="cp-admin-button cp-admin-button--secondary cp-admin-button--small"
          disabled={page >= pages || busy}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
