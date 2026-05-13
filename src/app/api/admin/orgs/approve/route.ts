import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { escapeHtml } from '@/lib/html'

const resend = new Resend(process.env.RESEND_API_KEY!)

function dogAgeRange(age: number): string {
  if (age < 1) return 'puppy'
  if (age < 2) return 'youth'
  if (age < 8) return 'adult'
  return 'senior'
}

function dogSizeClass(weight: number): string {
  if (weight < 20) return 'xsmall'
  if (weight < 30) return 'small'
  if (weight < 50) return 'medium'
  if (weight < 90) return 'large'
  return 'xlarge'
}

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
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()

  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { org_id, action } = await req.json()
  if (!org_id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'org_id and action (approve|reject) required' }, { status: 400 })
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const newStatus = action === 'approve' ? 'approved' : 'rejected'

  const { data: org, error: updateError } = await serviceClient
    .from('organizations')
    .update({ approval_status: newStatus })
    .eq('id', org_id)
    .select('name, email, type')
    .single()

  if (updateError || !org) {
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
  }

  const subject = action === 'approve' ? `You're approved on DOGSRUN!` : `DOGSRUN — Application Update`
  const safeOrgName = escapeHtml(org.name)

  const html = action === 'approve' ? `
    <div style="background-color:#f5f0e8;padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background-color:#fff9ef;border:1px solid rgba(19,36,29,0.1);">
        <div style="background-color:#13241d;padding:32px 40px;text-align:center;">
          <p style="color:rgba(244,185,66,0.7);font-size:11px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;margin:0 0 8px 0;">DOGSRUN</p>
          <h1 style="color:#f4b942;font-size:28px;font-weight:900;letter-spacing:-0.025em;margin:0;">You're Approved!</h1>
        </div>
        <div style="padding:40px;">
          <p style="color:#5d6a64;font-size:15px;line-height:26px;margin:0 0 32px 0;">Hi <strong style="color:#13241d;">${safeOrgName}</strong>, your 501(c)(3) verification has been reviewed and your organization is now approved on DOGSRUN. Welcome to the network.</p>
          <div style="text-align:center;margin-bottom:32px;">
            <a href="https://dogsrun.org/dashboard" style="background-color:#13241d;color:#f4b942;padding:14px 32px;text-decoration:none;display:inline-block;font-weight:700;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;">Go to Your Dashboard</a>
          </div>
          <p style="color:#5d6a64;font-size:13px;text-align:center;line-height:20px;margin:0;">Questions? Reach us at <a href="mailto:admin@dogsrun.org" style="color:#13241d;font-weight:700;">admin@dogsrun.org</a></p>
        </div>
        <div style="background-color:#13241d;padding:20px 40px;text-align:center;">
          <p style="color:rgba(244,185,66,0.5);font-size:11px;letter-spacing:0.1em;margin:0 0 4px 0;text-transform:uppercase;">Loyalty Repaid</p>
          <p style="color:rgba(245,240,232,0.4);font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} DOGSRUN &nbsp;|&nbsp;<a href="https://dogsrun.org" style="color:rgba(244,185,66,0.6);text-decoration:none;">dogsrun.org</a></p>
        </div>
      </div>
    </div>
  ` : `
    <div style="background-color:#f5f0e8;padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background-color:#fff9ef;border:1px solid rgba(19,36,29,0.1);">
        <div style="background-color:#13241d;padding:32px 40px;text-align:center;">
          <p style="color:rgba(244,185,66,0.7);font-size:11px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;margin:0 0 8px 0;">DOGSRUN</p>
          <h1 style="color:#f4b942;font-size:28px;font-weight:900;letter-spacing:-0.025em;margin:0;">Application Update</h1>
        </div>
        <div style="padding:40px;">
          <p style="color:#5d6a64;font-size:15px;line-height:26px;margin:0 0 24px 0;">Hi <strong style="color:#13241d;">${safeOrgName}</strong>, we were unable to verify your 501(c)(3) status at this time.</p>
          <p style="color:#5d6a64;font-size:15px;line-height:26px;margin:0 0 32px 0;">Please contact us at <a href="mailto:admin@dogsrun.org" style="color:#13241d;font-weight:700;">admin@dogsrun.org</a> to resubmit your documentation or ask any questions.</p>
        </div>
        <div style="background-color:#13241d;padding:20px 40px;text-align:center;">
          <p style="color:rgba(244,185,66,0.5);font-size:11px;letter-spacing:0.1em;margin:0 0 4px 0;text-transform:uppercase;">Loyalty Repaid</p>
          <p style="color:rgba(245,240,232,0.4);font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} DOGSRUN &nbsp;|&nbsp;<a href="https://dogsrun.org" style="color:rgba(244,185,66,0.6);text-decoration:none;">dogsrun.org</a></p>
        </div>
      </div>
    </div>
  `

  await resend.emails.send({
    from: 'DOGSRUN <alerts@dogsrun.org>',
    to: org.email,
    subject,
    html,
  })

  // If a rescue just got approved, send them a digest of all currently matching dogs
  if (action === 'approve' && org.type === 'rescue') {
    try {
      await sendRescueApprovalDigest(serviceClient, org_id, org.name, org.email)
    } catch (e) {
      console.error('Rescue approval digest failed:', e)
    }
  }

  return NextResponse.json({ success: true, approval_status: newStatus })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendRescueApprovalDigest(serviceClient: any, rescueId: string, rescueName: string, rescueEmail: string) {
  const { data: criteria } = await serviceClient
    .from('rescue_criteria')
    .select('*')
    .eq('rescue_id', rescueId)
    .eq('is_active', true)
    .maybeSingle()

  if (!criteria) return

  const { data: dogs } = await serviceClient
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

    const breedMatch = !criteria.breeds || criteria.breeds.length === 0 ||
      criteria.breeds.some((b: string) => dog.breed?.toLowerCase().includes(b.toLowerCase()))
    const colorMatch = !criteria.colors || criteria.colors.length === 0 ||
      !dog.color || dog.color.length === 0 ||
      dog.color.some((c: string) => criteria.colors.some((cc: string) => cc.toLowerCase() === c.toLowerCase()))
    const ageMatch = !criteria.age_ranges || criteria.age_ranges.length === 0 ||
      !dog.age_years || criteria.age_ranges.includes(dogAgeRange(dog.age_years))
    const weightMatch = !criteria.size_classes || criteria.size_classes.length === 0 ||
      !dog.weight_lbs || criteria.size_classes.includes(dogSizeClass(dog.weight_lbs))
    const sexMatch = !criteria.sex_preference || criteria.sex_preference === 'any' || criteria.sex_preference === dog.sex
    const mixMatch = dog.mix ? criteria.accepts_mixes !== false : true
    const stateMatch = !criteria.states_served || criteria.states_served.length === 0 ||
      !dog.state || criteria.states_served.some((s: string) => s.toUpperCase() === dog.state?.toUpperCase())

    if (breedMatch && colorMatch && ageMatch && weightMatch && sexMatch && mixMatch && stateMatch) {
      matches.push(dog)
    }
  }

  if (matches.length === 0) return

  for (const dog of matches) {
    await serviceClient.from('alerts').upsert({
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
          <a href="https://dogsrun.org/dogs/${dog.id}" style="color:#f4b942;font-size:13px;font-weight:700;text-decoration:none;">View →</a>
        </td>
      </tr>
    `
  }).join('')

  const digestHtml = `
    <div style="background-color:#f5f0e8;padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background-color:#fff9ef;border:1px solid rgba(19,36,29,0.1);">
        <div style="background-color:#13241d;padding:32px 40px;text-align:center;">
          <p style="color:rgba(244,185,66,0.7);font-size:11px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;margin:0 0 8px 0;">DOGSRUN</p>
          <h1 style="color:#f4b942;font-size:28px;font-weight:900;letter-spacing:-0.025em;margin:0;">${matches.length} Dog${matches.length === 1 ? '' : 's'} Waiting</h1>
        </div>
        <div style="padding:40px;">
          <p style="color:#5d6a64;font-size:15px;line-height:26px;margin:0 0 28px 0;">
            Welcome to DOGSRUN, <strong style="color:#13241d;">${escapeHtml(rescueName)}</strong>. Here are the dogs currently available that match your rescue criteria.
          </p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:28px;background:#fff;border:1px solid rgba(19,36,29,0.08);">
            ${dogRows}
          </table>
          <div style="text-align:center;margin-bottom:16px;">
            <a href="https://dogsrun.org/dashboard/rescue"
               style="background-color:#13241d;color:#f4b942;padding:14px 32px;text-decoration:none;display:inline-block;font-weight:700;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;">
              View All on Dashboard
            </a>
          </div>
        </div>
        <div style="background-color:#13241d;padding:20px 40px;text-align:center;">
          <p style="color:rgba(244,185,66,0.5);font-size:11px;letter-spacing:0.1em;margin:0 0 4px 0;text-transform:uppercase;">Loyalty Repaid</p>
          <p style="color:rgba(245,240,232,0.4);font-size:11px;margin:0;">
            You'll receive individual alerts as new matching dogs are added. &nbsp;|&nbsp;
            &copy; ${new Date().getFullYear()} DOGSRUN &nbsp;|&nbsp;
            <a href="https://dogsrun.org" style="color:rgba(244,185,66,0.6);text-decoration:none;">dogsrun.org</a>
          </p>
        </div>
      </div>
    </div>
  `

  await resend.emails.send({
    from: 'DOGSRUN Alerts <alerts@dogsrun.org>',
    to: rescueEmail,
    subject: `${matches.length} dog${matches.length === 1 ? '' : 's'} matching your criteria on DOGSRUN`,
    html: digestHtml,
  })
}
