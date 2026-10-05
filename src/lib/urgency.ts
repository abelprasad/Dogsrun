// Shared urgency helpers + the dog-status source of truth.

export function daysUntilEuthanasia(euthanasiaDate: string | null | undefined): number | null {
  if (!euthanasiaDate) return null;
  return Math.ceil((new Date(euthanasiaDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function daysLeftLabel(days: number | null): string | null {
  if (days === null) return null;
  if (days <= 0) return 'Past due';
  return days === 1 ? '1 day left' : `${days} days left`;
}

/** True when a dog needs dramatic urgent treatment on cards and pages. */
export function isDogUrgent(status: string | null | undefined, euthanasiaDate: string | null | undefined): boolean {
  return status === 'urgent' || (euthanasiaDate != null && daysUntilEuthanasia(euthanasiaDate) !== null);
}
