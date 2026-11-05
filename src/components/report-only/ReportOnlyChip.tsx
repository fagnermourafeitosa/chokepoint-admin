import { Eye } from 'lucide-react';

// The mark of an agent in Report-only (Admin 041): warning palette and the eye.
export function ReportOnlyChip({ label = 'Report-only' }: { label?: string }) {
  return <span className="cp-report-only-chip"><Eye size={12} aria-hidden="true" />{label}</span>;
}

// A review date of the mode that passed. The mode never changes by itself.
export function ReviewOverdueChip({ since }: { since?: string }) {
  return <span className="cp-report-only-chip" data-tone="danger">{since ? `Review overdue since ${since}` : 'Review overdue'}</span>;
}

// A UTC date (YYYY-MM-DD) as "Nov 9".
export const reviewDay = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en', { timeZone: 'UTC', month: 'short', day: 'numeric' });
export const todayUTC = () => new Date().toISOString().slice(0, 10);
export const reviewOverdue = (reviewBy: string | null | undefined) => !!reviewBy && reviewBy < todayUTC();
