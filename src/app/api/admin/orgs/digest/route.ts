import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { escapeHtml } from '@/lib/html'

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
  // Auth + admin check
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let org_id: string
  try {
    const body = await req.json()
    org_id = body.org_id
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!org_id) return NextResponse.json({ error: 'org_id required' }, { status: 400 })

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: org } = await serviceClient
    .from('organizations')
    .select('id, name, email, type, approval_status')
    .eq('id', org_id)
    .single()

  if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })
  if (org.type !== 'rescue') return NextResponse.json({ error: 'Only rescues can receive a digest' }, { status: 400 })
  if (org.approval_status !== 'approved') return NextResponse.json({ error: 'Org is not approved' }, { status: 400 })

  const { data: criteria } = await serviceClient
    .from('rescue_criteria')
    .select('*')
    .eq('rescue_id', org_id)
    .eq('is_active', true)
    .maybeSingle()

  if (!criteria) return NextResponse.json({ error: 'Rescue has no active criteria set' }, { status: 400 })

  const { data: dogs } = await serviceClient
    .from('dogs')
    .select('*, organizations(name)')
    .eq('status', 'available')
    .neq('shelter_id', org_id)

  if (!dogs || dogs.length === 0) {
    return NextResponse.json({ message: 'No available dogs found', matches: 0 })
  }

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
    const ageMatch = !criteria.max_age_years || !dog.age_years || dog.age_years <= criteria.max_age_years
    const weightMatch = !criteria.max_weight_lbs || !dog.weight_lbs || dog.weight_lbs <= criteria.max_weight_lbs
    const sexMatch = !criteria.sex_preference || criteria.sex_preference === 'any' || criteria.sex_preference === dog.sex
    const mixMatch = dog.mix ? criteria.accepts_mixes !== false : true
    const stateMatch = !criteria.states_served || criteria.states_served.length === 0 ||
      !dog.state || criteria.states_served.some((s: string) => s.toUpperCase() === dog.state?.toUpperCase())

    if (breedMatch && colorMatch && ageMatch && weightMatch && sexMatch && mixMatch && stateMatch) {
      matches.push(dog)
    }
  }

  if (matches.length === 0) {
    return NextResponse.json({ message: "No matching dogs found for this rescue's criteria", matches: 0 })
  }

  // Upsert alert rows — skip already-alerted pairs
  for (const dog of matches) {
    await serviceClient.from('alerts').upsert({
      dog_id: dog.id,
      rescue_id: org_id,
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
            Hi <strong style="color:#13241d;">${escapeHtml(org.name)}</strong>, here are the dogs currently available on DOGSRUN that match your rescue criteria.
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
    to: org.email,
    subject: `${matches.length} dog${matches.length === 1 ? '' : 's'} matching your criteria on DOGSRUN`,
    html: digestHtml,
  })

  return NextResponse.json({ success: true, matches: matches.length })
}
