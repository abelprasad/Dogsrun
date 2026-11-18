/** Default page size for admin tables; shared by the admin API routes and their client tables. */
export const DEFAULT_PAGE_SIZE = 25
export const MAX_PAGE_SIZE = 100

export function parsePageParam(value: string | null | undefined): number {
  const parsed = Number.parseInt(value || '1', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export function parsePageSizeParam(value: string | null | undefined): number {
  const parsed = Number.parseInt(value || String(DEFAULT_PAGE_SIZE), 10)
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_PAGE_SIZE
  return Math.min(parsed, MAX_PAGE_SIZE)
}
