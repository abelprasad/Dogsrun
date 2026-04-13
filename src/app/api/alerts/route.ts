import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  const { dog_id } = await req.json()

  if (!dog_id) {
    return NextResponse.json({ error: 'dog_id required' }, { status: 400 })
  }

  // Get the dog details
  const { data: dog, error: dogError } = await supabase
    .from('dogs')
    .select('*, organizations(name, city, state)')
    .eq('id', dog_id)
    .single()

  if (dogError || !dog) {
    return NextResponse.json({ error: 'Dog not found' }, { status: 404 })
  }

  // Get all active rescue criteria
  const { data: criteriaList } = await supabase
    .from('rescue_criteria')
    .select('*, organizations(id, name, email)')
    .eq('is_active', true)

  if (!criteriaList || criteriaList.length === 0) {
    return NextResponse.json({ message: 'No active rescue criteria found' })
  }

  const matches: any[] = []

  for (const criteria of criteriaList) {
    const org = criteria.organizations
    if (!org) continue

    // Skip if this is the shelter that added the dog
    if (org.id === dog.shelter_id) continue

    // Match logic
    const breedMatch = !criteria.breeds || criteria.breeds.length === 0 ||
      criteria.breeds.some((b: string) =>
        dog.breed?.toLowerCase().includes(b.toLowerCase())
      )

    const ageMatch = !criteria.max_age_years ||
      !dog.age_years ||
      dog.age_years <= criteria.max_age_years

    const weightMatch = !criteria.max_weight_lbs ||
      !dog.weight_lbs ||
      dog.weight_lbs <= criteria.max_weight_lbs

    const sexMatch = !criteria.sex_preference ||
      criteria.sex_preference === 'any' ||
      criteria.sex_preference === dog.sex

    const mixMatch = dog.mix ? criteria.accepts_mixes !== false : true

    if (breedMatch && ageMatch && weightMatch && sexMatch && mixMatch) {
      matches.push({ criteria, org })
    }
  }

  if (matches.length === 0) {
    return NextResponse.json({ message: 'No matches found', dog: dog.name })
  }

  // Send emails and log alerts
  const results = await Promise.allSettled(
    matches.map(async ({ criteria, org }) => {
      const shelter = dog.organizations as any

      // Send email via Resend
      await resend.emails.send({
        from: 'DOGSRUN Alerts <alerts@dogsrun.net>',
        to: org.email,
        subject: `New dog match: ${dog.name ?? 'Unnamed'} (${dog.breed ?? 'Unknown breed'})`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a2744;">New Dog Match — DOGSRUN</h1>
            <p>A dog matching your rescue criteria is available:</p>
            <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${dog.name ?? '—'}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Breed</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${dog.breed ?? '—'}${dog.mix ? ' mix' : ''}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Age</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${dog.age_years ? `${dog.age_years} years` : '—'}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Weight</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${dog.weight_lbs ? `${dog.weight_lbs} lbs` : '—'}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Sex</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${dog.sex ?? '—'}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Shelter</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${shelter?.name ?? '—'}, ${shelter?.city ?? ''} ${shelter?.state ?? ''}</td></tr>
            </table>
            <a href="https://dogsrun.vercel.app/dashboard" 
               style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
              View on DOGSRUN
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 32px;">
              You received this because your rescue org has active matching criteria on DOGSRUN.
            </p>
          </div>
        `,
      })

      // Log the alert in the database
      await supabase.from('alerts').insert({
        dog_id: dog.id,
        rescue_id: org.id,
        criteria_id: criteria.id,
        status: 'sent',
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