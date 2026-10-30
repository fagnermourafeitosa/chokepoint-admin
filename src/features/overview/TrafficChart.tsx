import { useState, type CSSProperties } from 'react';
import './traffic.css';
import type { Bucket } from './api';
import { utcTime } from '../investigate/TraceUI';
const hour = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
export function Sparkline({ values, denied = false }: { values: number[]; denied?: boolean }) {
  // One point cannot draw a line; repeat it so the first UTC hour shows a level.
  const series = values.length === 1 ? [values[0], values[0]] : values;
  const max = Math.max(1, ...series);
  const points = series
    .map((v, i) => `${(i * 100) / Math.max(1, series.length - 1)},${28 - (v / max) * 24}`)
    .join(' ');
  return (
    <svg
      className={`overview-spark ${denied ? 'overview-spark--denied' : ''}`}
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {series.length ? (
        <>
          <polygon points={`0,30 ${points} 100,30`} />
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </>
      ) : null}
    </svg>
  );
}
function range(b: Bucket) {
  return `${hour.format(new Date(b.from))}–${hour.format(new Date(b.to))} UTC${b.partial ? ' · partial hour' : ''}`;
}
export function TrafficChart({ buckets }: { buckets: Bucket[] }) {
  const [active, setActive] = useState(-1);
  const current = buckets[active];
  const maximum = Math.max(1, ...buckets.map((b) => b.allowed + b.denied));
  const step = Math.max(1, Math.ceil(maximum / 4));
  const ceiling = step * 4;
  return (
    <section className="cp-admin-panel overview-traffic">
      <header>
        <span className="attention-kicker">Traffic</span>
        <h2>Last 24 hours</h2>
        <p className="overview-legend">
          <span>
            <i />
            Allowed
          </span>
          <span>
            <i />
            Denied
          </span>
          <small>UTC · partial hours marked *</small>
        </p>
      </header>
      <div
        className="overview-chart"
        role="group"
        aria-label="Allowed and denied recorded calls by UTC hour. Exact counts and time bounds are in View as table below."
      >
        <div className="overview-chart-scale">
          {[4, 3, 2, 1, 0].map((i) => (
            <span key={i}>{i * step}</span>
          ))}
        </div>
        <div className="overview-bars" onMouseLeave={() => setActive(-1)}>
          {buckets.map((b, i) => (
            <div
              className={`overview-hour ${active === i ? 'overview-hour--active' : ''}`}
              key={b.from}
              tabIndex={0}
              aria-label={`${range(b)}: ${b.allowed} allowed, ${b.denied} denied`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(-1)}
            >
              <div className="overview-bar" aria-hidden="true">
                <span
                  className="overview-bar-denied"
                  style={{ height: `${(b.denied / ceiling) * 100}%` }}
                />
                <span
                  className="overview-bar-allowed"
                  style={{ height: `${(b.allowed / ceiling) * 100}%` }}
                />
              </div>
              <small>
                {i % 4 === 0 || i === buckets.length - 1
                  ? hour.format(new Date(b.from)) + (b.partial ? '*' : '')
                  : b.partial
                    ? '*'
                    : ''}
              </small>
            </div>
          ))}
          {current ? (
            <div
              className="overview-traffic-tip"
              aria-hidden="true"
              style={{ '--tip-left': `${((active + 0.5) / buckets.length) * 100}%` } as CSSProperties}
            >
              <small>{range(current)}</small>
              <span>
                <i className="overview-tip-allowed" />
                <strong>{current.allowed}</strong> allowed
              </span>
              <span>
                <i className="overview-tip-denied" />
                <strong>{current.denied}</strong> denied
              </span>
            </div>
          ) : null}
        </div>
      </div>
      <details className="overview-traffic-table">
        <summary>View as table</summary>
        <div className="cp-admin-table-scroll">
          <table className="cp-admin-table">
            <thead>
              <tr>
                <th>From (UTC)</th>
                <th>To (UTC)</th>
                <th>Allowed</th>
                <th>Denied</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((b) => (
                <tr key={b.from}>
                  <td>
                    {utcTime(b.from)}
                    {b.partial ? ' · partial' : ''}
                  </td>
                  <td>{utcTime(b.to)}</td>
                  <td>{b.allowed}</td>
                  <td>{b.denied}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
