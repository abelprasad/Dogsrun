import * as Sentry from '@sentry/nextjs'

// Logs the raw error (console + Sentry) and returns a user-safe message.
// Use at every catch site so raw backend/Supabase details never reach the UI.
export function reportError(raw: unknown, friendly: string): string {
  console.error(raw)
  Sentry.captureException(raw)
  return friendly
}
