// Lifecycle of a row in `alerts`:
//   sending -> sent | failed   (written by the alert/digest senders)
//   sent <-> responded | declined   (written when a rescue responds; 'sent' is also "undo")

export const ALERT_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
  RESPONDED: 'responded',
  DECLINED: 'declined',
} as const

export type AlertStatus = (typeof ALERT_STATUS)[keyof typeof ALERT_STATUS]

/** Statuses a rescue may set through the respond endpoint. */
export const RESPONSE_STATUSES: readonly AlertStatus[] = [
  ALERT_STATUS.RESPONDED,
  ALERT_STATUS.DECLINED,
  ALERT_STATUS.SENT,
]

/** Label shown to users. Anything that is not a response (sending, failed, unknown) reads as "Sent". */
export function alertStatusLabel(status: string): 'Interested' | 'Passed' | 'Sent' {
  if (status === ALERT_STATUS.RESPONDED) return 'Interested'
  if (status === ALERT_STATUS.DECLINED) return 'Passed'
  return 'Sent'
}
