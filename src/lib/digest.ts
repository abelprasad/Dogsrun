import { CONTACT_EMAIL, SITE_URL } from '@/lib/constants'
import { escapeHtml } from '@/lib/html'
import { brandedEmail, emailButton } from '@/lib/email'
import { dogMatchesCriteria, type MatchCriteria, type MatchDog } from '@/lib/matching'
import { supabaseAdmin } from '@/lib/supabase-server'
import { ALERT_STATUS, type AlertStatus } from '@/lib/alert-status'
import { resend } from '@/lib/resend'

export interface DigestDog extends MatchDog {
  id: string
  name: string | null
  sex: string | null
  organizations: { name: string } | null
}

type DigestCriteria = MatchCriteria & { id: string }

/** Active rescue_criteria row for a rescue, or null if it has none. */
export async function getActiveCriteria(rescueId: string) {
  const { data } = await supabaseAdmin
    .from('rescue_criteria')
    .select('*')
    .eq('rescue_id', rescueId)
    .eq('is_active', true)
    .maybeSingle()
  return data as DigestCriteria | null
}

/** Available dogs from other shelters that match the criteria. `availableCount` distinguishes "no dogs" from "no matches". */
export async function findDigestMatches(rescueId: string, criteria: DigestCriteria) {
  const { data: dogs } = await supabaseAdmin
    .from('dogs')
    .select('*, organizations(name)')
    .eq('status', 'available')
    .neq('shelter_id', rescueId)

  const available = (dogs ?? []) as DigestDog[]
  return {
    availableCount: available.length,
    matches: available.filter(dog => dogMatchesCriteria(dog, criteria)),
  }
}

async function recordDigestAlerts(matches: DigestDog[], rescueId: string, criteriaId: string) {
  for (const dog of matches) {
    await supabaseAdmin.from('alerts').upsert({
      dog_id: dog.id,
      rescue_id: rescueId,
      criteria_id: criteriaId,
      status: ALERT_STATUS.SENDING,
      sent_at: new Date().toISOString(),
    }, { onConflict: 'dog_id,rescue_id', ignoreDuplicates: true })
  }
}

// Only rows still 'sending' are touched, so existing responded/declined rows survive.
async function settleDigestAlerts(matches: DigestDog[], rescueId: string, status: AlertStatus) {
  await supabaseAdmin
    .from('alerts')
    .update({ status })
    .in('dog_id', matches.map(dog => dog.id))
    .eq('rescue_id', rescueId)
    .eq('status', ALERT_STATUS.SENDING)
}

/**
 * Records the alert rows as 'sending', emails the digest, then marks them
 * 'sent' (or 'failed', rethrowing) — same lifecycle as /api/alerts.
 * `introHtml` must already be escaped.
 */
export async function deliverDigest(
  rescueId: string,
  criteria: DigestCriteria,
  matches: DigestDog[],
  to: string,
  introHtml: string,
) {
  await recordDigestAlerts(matches, rescueId, criteria.id)
  try {
    await sendDigestEmail(to, matches, introHtml)
  } catch (error) {
    await settleDigestAlerts(matches, rescueId, ALERT_STATUS.FAILED)
    throw error
  }
  await settleDigestAlerts(matches, rescueId, ALERT_STATUS.SENT)
}

async function sendDigestEmail(to: string, matches: DigestDog[], introHtml: string) {
  const dogRows = matches.map(dog => {
    const shelter = dog.organizations
    const details = [
      dog.breed ? `${escapeHtml(dog.breed)}${dog.mix ? ' mix' : ''}` : null,
      dog.age_years ? `${dog.age_years} yr` : null,
      dog.weight_lbs ? `${dog.weight_lbs} lbs` : null,
      dog.sex ?? null,
      dog.state ?? null,
    ].filter(Boolean).join(' · ')

    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;">
          <strong style="color:#13241d;font-size:15px;">${escapeHtml(dog.name ?? 'Unnamed')}</strong>
          <div style="color:#6b7280;font-size:13px;margin-top:2px;">${details}</div>
          ${shelter ? `<div style="color:#9ca3af;font-size:12px;margin-top:2px;">${escapeHtml(shelter.name)}</div>` : ''}
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;text-align:right;vertical-align:middle;">
          <a href="${SITE_URL}/dogs/${dog.id}" style="color:#c08a3e;font-size:13px;font-weight:700;text-decoration:none;">View →</a>
        </td>
      </tr>
    `
  }).join('')

  const plural = matches.length === 1 ? '' : 's'
  const html = brandedEmail({
    title: `${matches.length} Dog${plural} Waiting`,
    footerNote: "You'll receive individual alerts as new matching dogs are added.",
    bodyHtml: `
          <p style="color:#5d6a64;font-size:15px;line-height:26px;margin:0 0 28px 0;">
            ${introHtml}
          </p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:28px;background:#fff;border:1px solid rgba(19,36,29,0.08);">
            ${dogRows}
          </table>
          <div style="text-align:center;margin-bottom:16px;">
            ${emailButton(`${SITE_URL}/dashboard/rescue`, 'View All on Dashboard')}
          </div>`,
  })

  await resend.emails.send({
    from: `DOGSRUN Alerts <${CONTACT_EMAIL}>`,
    to,
    subject: `${matches.length} dog${plural} matching your criteria on DOGSRUN`,
    html,
  })
}
