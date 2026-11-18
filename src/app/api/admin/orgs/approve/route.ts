import { CONTACT_EMAIL, SITE_URL } from '@/lib/constants'
import { getAdminUser } from '@/lib/auth-context'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { escapeHtml } from '@/lib/html'
import { brandedEmail, emailButton } from '@/lib/email'
import { dogMatchesCriteria } from '@/lib/matching'
import { supabaseAdmin } from '@/lib/supabase-server'
import { adminEmailRatelimit, getClientIp } from '@/lib/ratelimit'

const resend = new Resend(process.env.RESEND_API_KEY!)

interface Dog {
  id: string
  name: string | null
  breed: string | null
  mix: boolean | null
  age_years: number | null
  weight_lbs: number | null
  sex: string | null
  color: string[] | null
  state: string | null
  parvo: boolean | null
  tripod: boolean | null
  blind: boolean | null
  other_issues: boolean | null
  organizations: { name: string } | null
}

export async function POST(req: NextRequest) {
  const adminEmailRatelimit_result = await adminEmailRatelimit.limit(getClientIp(req))
  if (!adminEmailRatelimit_result.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }
  const { user, isAdmin } = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { org_id, action } = await req.json()
  if (!org_id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'org_id and action (approve|reject) required' }, { status: 400 })
  }


  const newStatus = action === 'approve' ? 'approved' : 'rejected'

  // Don't approve a deactivated org — check before the update below
  const { data: existingOrg } = await supabaseAdmin
    .from('organizations')
    .select('is_active, approval_status')
    .eq('id', org_id)
    .maybeSingle()

  if (action === 'approve' && existingOrg?.is_active === false) {
    return NextResponse.json({ error: 'Cannot approve a deactivated org' }, { status: 400 })
  }

  // Idempotency (M-D4): skip if already at the target status — prevents
  // duplicate "You're Approved!" + digest emails on double-click/retry.
  if (existingOrg?.approval_status === newStatus) {
    return NextResponse.json({ success: true, message: 'Already at target status', skipped: true })
  }

  const { data: org, error: updateError } = await supabaseAdmin
    .from('organizations')
    .update({ approval_status: newStatus })
    .eq('id', org_id)
    .select('name, email, type, is_active')
    .single()

  if (updateError || !org) {
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
  }

  const subject = action === 'approve' ? `You're approved on DOGSRUN!` : `DOGSRUN — Application Update`
  const safeOrgName = escapeHtml(org.name)

  const html = action === 'approve' ? brandedEmail({
    title: `You're Approved!`,
    bodyHtml: `
          <p style="color:#5d6a64;font-size:15px;line-height:26px;margin:0 0 32px 0;">Hi <strong style="color:#13241d;">${safeOrgName}</strong>, your 501(c)(3) verification has been reviewed and your organization is now approved on DOGSRUN. Welcome to the network.</p>
          <div style="text-align:center;margin-bottom:32px;">
            ${emailButton('https://dogsrun.org/dashboard', 'Go to Your Dashboard')}
          </div>
          <p style="color:#5d6a64;font-size:13px;text-align:center;line-height:20px;margin:0;">Questions? Reach us at <a href="mailto:admin@dogsrun.org" style="color:#13241d;font-weight:700;">admin@dogsrun.org</a></p>`,
  }) : brandedEmail({
    title: 'Application Update',
    bodyHtml: `
          <p style="color:#5d6a64;font-size:15px;line-height:26px;margin:0 0 24px 0;">Hi <strong style="color:#13241d;">${safeOrgName}</strong>, we were unable to verify your 501(c)(3) status at this time.</p>
          <p style="color:#5d6a64;font-size:15px;line-height:26px;margin:0 0 32px 0;">Please contact us at <a href="mailto:admin@dogsrun.org" style="color:#13241d;font-weight:700;">admin@dogsrun.org</a> to resubmit your documentation or ask any questions.</p>`,
  })

  await resend.emails.send({
    from: `DOGSRUN <${CONTACT_EMAIL}>`,
    to: org.email,
    subject,
    html,
  })

  // If a rescue just got approved, send them a digest of all currently matching dogs
  if (action === 'approve' && org.type === 'rescue') {
    try {
      await sendRescueApprovalDigest(supabaseAdmin, org_id, org.name, org.email)
    } catch (e) {
      console.error('Rescue approval digest failed:', e)
    }
  }

  return NextResponse.json({ success: true, approval_status: newStatus })
}

async function sendRescueApprovalDigest(
  supabaseAdmin: typeof import('@/lib/supabase-server').supabaseAdmin,
  rescueId: string,
  rescueName: string,
  rescueEmail: string
) {
  const { data: criteria } = await supabaseAdmin
    .from('rescue_criteria')
    .select('*')
    .eq('rescue_id', rescueId)
    .eq('is_active', true)
    .maybeSingle()

  if (!criteria) return

  const { data: dogs } = await supabaseAdmin
    .from('dogs')
    .select('*, organizations(name)')
    .eq('status', 'available')
    .neq('shelter_id', rescueId)

  if (!dogs || dogs.length === 0) return

  const matches: Dog[] = []

  for (const dog of dogs as Dog[]) {
    if (dog.parvo && !criteria.accepts_parvo) continue
    if (dog.tripod && !criteria.accepts_tripod) continue
    if (dog.blind && !criteria.accepts_blind) continue
    if (dog.other_issues && !criteria.accepts_other) continue

    if (dogMatchesCriteria(dog, criteria)) {
      matches.push(dog)
    }
  }

  if (matches.length === 0) return

  for (const dog of matches) {
    await supabaseAdmin.from('alerts').upsert({
      dog_id: dog.id,
      rescue_id: rescueId,
      criteria_id: criteria.id,
      status: 'sent',
      sent_at: new Date().toISOString(),
    }, { onConflict: 'dog_id,rescue_id', ignoreDuplicates: true })
  }

  const dogRows = matches.map(dog => {
    const shelter = dog.organizations as { name: string } | null
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
          <a href="https://dogsrun.org/dogs/${dog.id}" style="color:#c08a3e;font-size:13px;font-weight:700;text-decoration:none;">View →</a>
        </td>
      </tr>
    `
  }).join('')

  const digestHtml = brandedEmail({
    title: `${matches.length} Dog${matches.length === 1 ? '' : 's'} Waiting`,
    footerNote: "You'll receive individual alerts as new matching dogs are added.",
    bodyHtml: `
          <p style="color:#5d6a64;font-size:15px;line-height:26px;margin:0 0 28px 0;">
            Welcome to DOGSRUN, <strong style="color:#13241d;">${escapeHtml(rescueName)}</strong>. Here are the dogs currently available that match your rescue criteria.
          </p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:28px;background:#fff;border:1px solid rgba(19,36,29,0.08);">
            ${dogRows}
          </table>
          <div style="text-align:center;margin-bottom:16px;">
            ${emailButton('https://dogsrun.org/dashboard/rescue', 'View All on Dashboard')}
          </div>`,
  })

  await resend.emails.send({
    from: `DOGSRUN Alerts <${CONTACT_EMAIL}>`,
    to: rescueEmail,
    subject: `${matches.length} dog${matches.length === 1 ? '' : 's'} matching your criteria on DOGSRUN`,
    html: digestHtml,
  })
}
