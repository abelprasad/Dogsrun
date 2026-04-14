import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const alert_id = searchParams.get('alert_id')
  const action = searchParams.get('action')

  if (!alert_id || !action) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const status = action === 'interested' ? 'responded' : 'declined'

  // Update alert status
  const { data: alert, error: updateError } = await supabase
    .from('alerts')
    .update({ status })
    .eq('id', alert_id)
    .select(`
        *,
        dogs (*),
        organizations!alerts_rescue_id_fkey (*)
      `)
    .single()

  if (updateError || !alert) {
    return NextResponse.json({ error: 'Alert not found or update failed' }, { status: 404 })
  }

  // If interested, notify shelter
  if (action === 'interested') {
    const dog = alert.dogs
    const rescue = alert.organizations

    const { data: shelter } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', dog.shelter_id)
      .single()

    if (shelter) {
      await resend.emails.send({
        from: 'DOGSRUN <alerts@dogsrun.net>',
        to: shelter.email,
        subject: `${rescue.name} is interested in ${dog.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #f59e0b;">Great news!</h2>
            <p><strong>${rescue.name}</strong> has expressed interest in <strong>${dog.name}</strong> via email match.</p>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Rescue Contact:</strong> ${rescue.name}</p>
              <p style="margin: 5px 0 0 0;"><strong>Email:</strong> <a href="mailto:${rescue.email}">${rescue.email}</a></p>
            </div>
            <p>You can view the dog's profile and alert history here:</p>
            <a href="https://dogsrun.net/dashboard/dogs/${dog.id}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Dog Profile</a>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated notification from DOGSRUN.</p>
          </div>
        `
      })
    }
  }

  // Redirect to thank you page
  return NextResponse.redirect(new URL('/responded', req.url))
}
