const DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

/**
 * Formats an ISO date as `12 Mar 2026`.
 * Pinned to UTC so server and client renders always agree.
 * @param {string | null | undefined} isoDate
 * @returns {string} Formatted date, or an em dash when there is no date.
 */
export default function formatDate(isoDate) {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return DATE_FORMATTER.format(date);
}

/**
 * Formats an ISO timestamp as `12 Mar, 09:40`.
 * @param {string | null | undefined} isoDate
 * @returns {string}
 */
export function formatDateTime(isoDate) {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return DATE_TIME_FORMATTER.format(date).replace(',', ',');
}

/**
 * Formats a day count as `1.5 days`, keeping a single decimal only when needed.
 * @param {number} days
 * @returns {string}
 */
export function formatDays(days) {
  if (!Number.isFinite(days)) return '—';
  const rounded = Math.round(days * 10) / 10;
  return `${rounded} ${rounded === 1 ? 'day' : 'days'}`;
}
