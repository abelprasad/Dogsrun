import { Resend } from 'resend'
import { CONTACT_EMAIL, SITE_URL } from '@/lib/constants'
import { escapeHtml, sanitizeSubject } from '@/lib/html'
import { supabaseAdmin } from '@/lib/supabase-server'

const resend = new Resend(process.env.RESEND_API_KEY!)

interface InterestAlert {
  dogs: { name: string; shelter_id: string }
  organizations: { name: string; email: string }
}

/**
 * Emails the shelter that a rescue responded "interested" to an alert.
 * `viaEmailMatch` selects the longer copy used by the legacy /api/respond endpoint.
 */
export async function notifyShelterOfInterest(alert: InterestAlert, { viaEmailMatch = false } = {}) {
  const dog = alert.dogs
  const rescue = alert.organizations

  const { data: shelter } = await supabaseAdmin
    .from('organizations')
    .select('name, email')
    .eq('id', dog.shelter_id)
    .single()

  if (!shelter) return

  const safeRescueName = escapeHtml(rescue.name)
  const safeRescueEmail = escapeHtml(rescue.email)
  const safeDogName = escapeHtml(dog.name)

  const html = viaEmailMatch ? `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #c08a3e;">Great news!</h2>
        <p><strong>${safeRescueName}</strong> has expressed interest in <strong>${safeDogName}</strong> via email match.</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Rescue Contact:</strong> ${safeRescueName}</p>
        <p style="margin: 5px 0 0 0;"><strong>Email:</strong> <a href="mailto:${safeRescueEmail}">${safeRescueEmail}</a></p>
        </div>
        <p>You can view the dog&apos;s profile and alert history on your dashboard:</p>
        <a href="${SITE_URL}/dashboard" style="display: inline-block; background: #c08a3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Dashboard</a>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated notification from DOGSRUN.</p>
        </div>
        ` : `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:10px;">
            <h2 style="color:#c08a3e;">Great news!</h2>
            <p><strong>${safeRescueName}</strong> has expressed interest in <strong>${safeDogName}</strong>.</p>
            <div style="background:#f9f9f9;padding:15px;border-radius:8px;margin:20px 0;">
              <p style="margin:0;"><strong>Rescue:</strong> ${safeRescueName}</p>
              <p style="margin:5px 0 0;"><strong>Email:</strong> <a href="mailto:${safeRescueEmail}">${safeRescueEmail}</a></p>
            </div>
            <a href="${SITE_URL}/dashboard" style="display:inline-block;background:#c08a3e;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Go to Dashboard</a>
          </div>
        `

  await resend.emails.send({
    from: `DOGSRUN <${CONTACT_EMAIL}>`,
    to: shelter.email,
    subject: `${sanitizeSubject(rescue.name)} is interested in ${sanitizeSubject(dog.name)}`,
    html,
  })
}
