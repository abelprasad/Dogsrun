import { Resend } from 'resend'
import { env } from '@/lib/env'

export const resend = new Resend(env.RESEND_API_KEY)

// Resend returns `{ data, error }` rather than throwing; surface API errors as exceptions.
export async function sendEmail(payload: Parameters<typeof resend.emails.send>[0]) {
  const { data, error } = await resend.emails.send(payload)
  if (error) throw new Error(`Resend send failed: ${error.message}`)
  return data
}
