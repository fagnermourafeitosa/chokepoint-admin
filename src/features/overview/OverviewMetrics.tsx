import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Overview } from './api';
import { Sparkline } from './TrafficChart';
const count = new Intl.NumberFormat('en-US');
function comparison(value: number | null) {
  return value === null
    ? 'No comparison available'
    : `${value > 0 ? '+' : ''}${value.toFixed(1)}% vs yesterday at this time`;
}
export function OverviewMetrics({ data }: { data: Overview }) {
  const navigate = useNavigate();
  // Sparklines describe the same UTC-today interval as the numbers beside them.
  const today = data.traffic.buckets.filter(
    (b) => new Date(b.from).getTime() >= new Date(data.today.from).getTime(),
  );
  const deniedPath = `/investigate?${new URLSearchParams({ view: 'decisions', result: 'deny', from: data.today.from, to: data.today.to })}`;
  return (
    <div className="overview-metrics">
      <section className="overview-metric">
        <span>Calls today</span>
        <strong>{count.format(data.today.total)}</strong>
        <small>
          {data.denied_share === null
            ? 'No recorded calls'
            : `${data.denied_share.toFixed(1)}% denied`}{' '}
          · {comparison(data.total_change_percent)}
        </small>
        <Sparkline values={today.map((b) => b.allowed + b.denied)} />
      </section>
      <button
        className="overview-metric overview-metric--denied"
        onClick={() => navigate(deniedPath)}
      >
        <span>Denied today</span>
        <strong>{count.format(data.today.denied)}</strong>
        <small>
          {count.format(data.yesterday_same_time.denied)} yesterday at this time{' '}
          <ArrowRight size={14} aria-hidden="true" />
        </small>
        <Sparkline denied values={today.map((b) => b.denied)} />
      </button>
      <button
        className="overview-metric"
        onClick={() => navigate('/access/integrations?review=tools')}
      >
        <span>Tools reviewed</span>
        <strong>
          {count.format(data.tools.reviewed)} <em>of {count.format(data.tools.total)}</em>
        </strong>
        <meter
          value={data.tools.reviewed}
          max={Math.max(1, data.tools.total)}
          aria-label={`${data.tools.reviewed} of ${data.tools.total} tools reviewed`}
        />
        <small>
          {data.tools.needs_review
            ? `${data.tools.needs_review} ${data.tools.needs_review === 1 ? 'tool needs' : 'tools need'} review`
            : 'All current tools reviewed'}
          <ArrowRight size={14} aria-hidden="true" />
        </small>
      </button>
    </div>
  );
}
