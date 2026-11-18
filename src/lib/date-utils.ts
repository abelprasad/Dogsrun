// L-6: Parse date-only strings (YYYY-MM-DD) as local dates, not UTC midnight.
// `new Date('2026-10-10')` is UTC midnight = 8pm prior day in EDT,
// causing countdowns to flip early and toLocaleDateString to show wrong day.
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}
