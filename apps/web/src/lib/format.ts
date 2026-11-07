/** Dates are shown in US Eastern time, the newsroom's clock. */
const TZ = 'America/New_York';

/** "Nov 7, 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: TZ });
}

/** "Nov 7, 2026, 3:04 PM ET" */
export function formatDateTime(iso: string): string {
  const s = new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TZ,
  });
  return `${s} ET`;
}
