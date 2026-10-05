// Single source of truth for dog statuses, their display labels, and the
// euthanasia risk thresholds (previously duplicated across status-badge,
// euthanasia-countdown, the admin dogs table, and API routes).

export type DogStatus =
  | 'available'
  | 'pending'
  | 'adopted'
  | 'deceased'
  | 'transferred'
  | 'urgent'
  | 'rescue_requested'
  | 'placed'

/** All dog statuses, in the order used by status dropdowns. */
export const DOG_STATUSES: readonly DogStatus[] = [
  'available',
  'urgent',
  'pending',
  'rescue_requested',
  'placed',
  'adopted',
  'deceased',
  'transferred',
]

export const DOG_STATUS_LABELS: Record<DogStatus, string> = {
  available: 'Available',
  urgent: 'Urgent',
  pending: 'Pending',
  rescue_requested: 'Rescue Requested',
  placed: 'Placed',
  adopted: 'Adopted',
  deceased: 'Deceased',
  transferred: 'Transferred',
}

/** Human label for a status string, falling back to the raw value. */
export function dogStatusLabel(status: string): string {
  return DOG_STATUS_LABELS[status as DogStatus] ?? status
}

/** Fast membership check for API input validation. */
export const VALID_DOG_STATUSES: ReadonlySet<string> = new Set(DOG_STATUSES)

/** Hours before a scheduled euthanasia at/below which a dog counts as critical. */
export const RISK_CRITICAL_HOURS = 24

export type RiskLevel = 'past-due' | 'critical' | 'at-risk' | 'safe'

/** Shared euthanasia risk classification. */
export function getRiskLevel(euthanasiaDate: string | null | undefined): RiskLevel {
  if (!euthanasiaDate) return 'safe'
  const diffHours = (new Date(euthanasiaDate).getTime() - Date.now()) / (1000 * 60 * 60)
  if (diffHours <= 0) return 'past-due'
  if (diffHours <= RISK_CRITICAL_HOURS) return 'critical'
  return 'at-risk'
}
