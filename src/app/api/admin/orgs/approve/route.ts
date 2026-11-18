import { CONTACT_EMAIL, ADMIN_EMAIL, SITE_URL } from '@/lib/constants'
import { getAdminUser } from '@/lib/auth-context'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { escapeHtml } from '@/lib/html'
import { brandedEmail, emailButton } from '@/lib/email'
import { findDigestMatches, getActiveCriteria, recordDigestAlerts, sendDigestEmail } from '@/lib/digest'
import { supabaseAdmin } from '@/lib/supabase-server'
import { adminEmailRatelimit, getClientIp } from '@/lib/ratelimit'

const resend = new Resend(process.env.RESEND_API_KEY!)

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
            ${emailButton(`${SITE_URL}/dashboard`, 'Go to Your Dashboard')}
          </div>
          <p style="color:#5d6a64;font-size:13px;text-align:center;line-height:20px;margin:0;">Questions? Reach us at <a href="mailto:${ADMIN_EMAIL}" style="color:#13241d;font-weight:700;">${ADMIN_EMAIL}</a></p>`,
  }) : brandedEmail({
    title: 'Application Update',
    bodyHtml: `
          <p style="color:#5d6a64;font-size:15px;line-height:26px;margin:0 0 24px 0;">Hi <strong style="color:#13241d;">${safeOrgName}</strong>, we were unable to verify your 501(c)(3) status at this time.</p>
          <p style="color:#5d6a64;font-size:15px;line-height:26px;margin:0 0 32px 0;">Please contact us at <a href="mailto:${ADMIN_EMAIL}" style="color:#13241d;font-weight:700;">${ADMIN_EMAIL}</a> to resubmit your documentation or ask any questions.</p>`,
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
      await sendRescueApprovalDigest(org_id, org.name, org.email)
    } catch (e) {
      console.error('Rescue approval digest failed:', e)
    }
  }

  return NextResponse.json({ success: true, approval_status: newStatus })
}

async function sendRescueApprovalDigest(rescueId: string, rescueName: string, rescueEmail: string) {
  const criteria = await getActiveCriteria(rescueId)
  if (!criteria) return

  const { matches } = await findDigestMatches(rescueId, criteria)
  if (matches.length === 0) return

  await recordDigestAlerts(matches, rescueId, criteria.id)
  await sendDigestEmail(
    rescueEmail,
    matches,
    `Welcome to DOGSRUN, <strong style="color:#13241d;">${escapeHtml(rescueName)}</strong>. Here are the dogs currently available that match your rescue criteria.`,
  )
}
