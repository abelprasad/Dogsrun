import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

interface RescueOrg {
  id: string;
  name: string;
  email: string;
  approval_status: string;
}

interface RescueCriteria {
  id: string;
  rescue_id: string;
  breeds: string[] | null;
  colors: string[] | null;
  max_age_years: number | null;
  max_weight_lbs: number | null;
  sex_preference: string | null;
  accepts_mixes: boolean | null;
  states_served: string[] | null;
  organizations: RescueOrg | null;
  accepts_parvo: boolean | null;
  accepts_tripod: boolean | null;
  accepts_blind: boolean | null;
  accepts_other: boolean | null;
}

interface Match {
  criteria: RescueCriteria;
  org: RescueOrg;
}

export async function POST(req: NextRequest) {
  const { dog_id } = await req.json()

  if (!dog_id) {
    return NextResponse.json({ error: 'dog_id required' }, { status: 400 })
  }

  const { data: dog, error: dogError } = await supabase
    .from('dogs')
    .select('*, organizations(name, city, state)')
    .eq('id', dog_id)
    .single()

  if (dogError || !dog) {
    return NextResponse.json({ error: 'Dog not found' }, { status: 404 })
  }

  const { data: criteriaList } = await supabase
    .from('rescue_criteria')
    .select('*, organizations(id, name, email, approval_status)')
    .eq('is_active', true)

  if (!criteriaList || (criteriaList as unknown as RescueCriteria[]).length === 0) {
    return NextResponse.json({ message: 'No active rescue criteria found' })
  }

  const matches: Match[] = []

  for (const criteria of (criteriaList as unknown as RescueCriteria[])) {
    const org = criteria.organizations
    if (!org) continue

    if (org.id === dog.shelter_id) continue
    if (org.approval_status !== 'approved') continue

    // Special needs — dog's needs must be accepted by rescue
    if (dog.parvo && !criteria.accepts_parvo) continue
    if (dog.tripod && !criteria.accepts_tripod) continue
    if (dog.blind && !criteria.accepts_blind) continue
    if (dog.other_issues && !criteria.accepts_other) continue

    // Breed match
    const breedMatch = !criteria.breeds || criteria.breeds.length === 0 ||
      criteria.breeds.some((b: string) =>
        dog.breed?.toLowerCase().includes(b.toLowerCase())
      )

    // Color match — any overlap between dog colors and rescue preferred colors
    const colorMatch = !criteria.colors || criteria.colors.length === 0 ||
      !dog.color || dog.color.length === 0 ||
      dog.color.some((c: string) =>
        criteria.colors!.some(cc => cc.toLowerCase() === c.toLowerCase())
      )

    // Age match
    const ageMatch = !criteria.max_age_years ||
      !dog.age_years ||
      dog.age_years <= criteria.max_age_years

    // Weight match
    const weightMatch = !criteria.max_weight_lbs ||
      !dog.weight_lbs ||
      dog.weight_lbs <= criteria.max_weight_lbs

    // Sex match
    const sexMatch = !criteria.sex_preference ||
      criteria.sex_preference === 'any' ||
      criteria.sex_preference === dog.sex

    // Mix match
    const mixMatch = dog.mix ? criteria.accepts_mixes !== false : true

    // State match — if rescue has states_served, dog must be from one of them
    const stateMatch = !criteria.states_served || criteria.states_served.length === 0 ||
      !dog.state ||
      criteria.states_served.some((s: string) =>
        s.toUpperCase() === dog.state?.toUpperCase()
      )

    if (breedMatch && colorMatch && ageMatch && weightMatch && sexMatch && mixMatch && stateMatch) {
      matches.push({ criteria, org })
    }
  }

  if (matches.length === 0) {
    return NextResponse.json({ message: 'No matches found', dog: dog.name })
  }

  const results = await Promise.allSettled(
    matches.map(async ({ criteria, org }) => {
      const shelter = dog.organizations as unknown as { name: string; city: string; state: string }

      const specialNeeds = []
      if (dog.parvo) specialNeeds.push('Parvo')
      if (dog.tripod) specialNeeds.push('Tripod / Amputee')
      if (dog.blind) specialNeeds.push('Blind / Vision Impaired')
      if (dog.other_issues) specialNeeds.push(`Other — "${dog.other_issues_notes}"`)

      const specialNeedsRow = specialNeeds.length > 0 ? `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f973161a; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Special Needs</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f973161a; color: #dc2626; font-size: 16px; font-weight: 700;">${specialNeeds.join(', ')}</td>
        </tr>
      ` : ''

      const colorRow = dog.color && dog.color.length > 0 ? `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f973161a; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Color</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f973161a; color: #111827; font-size: 16px;">${dog.color.join(', ')}</td>
        </tr>
      ` : ''

      const { data: alertData, error: alertError } = await supabase.from('alerts').insert({
        dog_id: dog.id,
        rescue_id: org.id,
        criteria_id: criteria.id,
        status: 'sent',
        sent_at: new Date().toISOString(),
      }).select().single()

      if (alertError || !alertData) throw alertError

      await resend.emails.send({
        from: 'DOGSRUN Alerts <alerts@dogsrun.net>',
        to: org.email,
        subject: `New dog match: ${dog.name ?? 'Unnamed'} (${dog.breed ?? 'Unknown breed'})`,
        html: `
          <div style="background-color: #f9fafb; padding: 32px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="background-color: #f59e0b; padding: 24px; text-align: center;">
                <span style="color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">DOGSRUN</span>
              </div>
              <div style="padding: 32px 40px;">
                <h1 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 24px; text-align: center;">
                  A dog matching your criteria is available
                </h1>
                <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 32px; text-align: center;">
                  A new dog has just been listed by a shelter that matches your rescue organization's saved matching criteria.
                </p>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; border-radius: 8px; overflow: hidden; background-color: #fdfaf5;">
                  <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f973161a; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; width: 35%;">Name</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f973161a; color: #111827; font-size: 16px; font-weight: 700;">${dog.name ?? '—'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f973161a; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Breed</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f973161a; color: #111827; font-size: 16px;">${dog.breed ?? '—'}${dog.mix ? ' mix' : ''}</td>
                  </tr>
                  ${colorRow}
                  ${specialNeedsRow}
                  <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f973161a; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Age</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f973161a; color: #111827; font-size: 16px;">${dog.age_years ? `${dog.age_years} years` : '—'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f973161a; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Weight</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f973161a; color: #111827; font-size: 16px;">${dog.weight_lbs ? `${dog.weight_lbs} lbs` : '—'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f973161a; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Sex</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f973161a; color: #111827; font-size: 16px;">${dog.sex ?? '—'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f973161a; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">State</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f973161a; color: #111827; font-size: 16px;">${dog.state ?? '—'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 16px; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Shelter</td>
                    <td style="padding: 12px 16px; color: #111827; font-size: 16px;">${shelter?.name ?? '—'}, ${shelter?.city ?? ''} ${shelter?.state ?? ''}</td>
                  </tr>
                </table>
                <div style="text-align: center; margin-bottom: 32px;">
                  <a href="https://dogsrun.net/api/respond?alert_id=${alertData.id}&action=interested"
                     style="background-color: #f59e0b; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; display: inline-block; font-weight: 700; font-size: 16px;">
                    Interested
                  </a>
                </div>
                <div style="text-align: center;">
                  <a href="https://dogsrun.net/dashboard/rescue" style="color: #f59e0b; text-decoration: underline; font-size: 14px; font-weight: 600;">View all matches on your dashboard</a>
                </div>
              </div>
              <div style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; line-height: 18px; margin: 0;">
                  You received this alert because your rescue organization has active matching criteria on DOGSRUN. To update your criteria, <a href="https://dogsrun.net/dashboard/rescue" style="color: #f59e0b; text-decoration: underline;">log in to your rescue portal</a>.
                </p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 24px;">
              <p style="color: #d1d5db; font-size: 12px;">&copy; ${new Date().getFullYear()} DOGSRUN. All rights reserved.</p>
            </div>
          </div>
        `,
      })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({
    message: `Alerts sent: ${sent}, failed: ${failed}`,
    matches: matches.length,
  })
}
