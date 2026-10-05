import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { escapeHtml, sanitizeSubject } from '@/lib/html'
import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase-server'
import { respondRatelimit, getClientIp } from '@/lib/ratelimit'

const resend = new Resend(process.env.RESEND_API_KEY!)

// Authenticated response endpoint for rescues. Previously a state-changing GET
// with no login; email link scanners or prefetch could mark a rescue as
// interested. Responses now go through POST with the rescue's session.
export async function POST(req: NextRequest) {
  const respondRatelimit_result = await respondRatelimit.limit(getClientIp(req))
  if (!respondRatelimit_result.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let alert_id: string
  let action: string
  try {
    const body = await req.json()
    alert_id = body.alert_id
    action = body.action
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!alert_id || !action) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  if (!['interested', 'declined', 'pass'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const status = action === 'interested' ? 'responded' : 'declined'

  // Fetch first so we can verify ownership and current status before mutating
  const { data: alert, error: fetchError } = await supabaseAdmin
    .from('alerts')
    .select(`
        *,
        dogs (*),
        organizations!alerts_rescue_id_fkey (*)
      `)
    .eq('id', alert_id)
    .single()

  if (fetchError || !alert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
  }

  if (alert.rescue_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const wasResponded = alert.status === 'responded'

  const { error: updateError } = await supabaseAdmin
    .from('alerts')
    .update({ status })
    .eq('id', alert_id)

  if (updateError) {
    return NextResponse.json({ error: 'Alert update failed' }, { status: 500 })
  }

  // Idempotency: only notify the shelter when transitioning from a
  // non-responded status to responded — not on repeat clicks.
  if (action === 'interested' && !wasResponded) {
    const dog = alert.dogs
    const rescue = alert.organizations

    const { data: shelter } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', dog.shelter_id)
      .single()

    if (shelter) {
      const safeRescueName = escapeHtml(rescue.name)
      const safeRescueEmail = escapeHtml(rescue.email)
      const safeDogName = escapeHtml(dog.name)

      await resend.emails.send({
        from: 'DOGSRUN <alerts@dogsrun.org>',
        to: shelter.email,
        subject: `${sanitizeSubject(rescue.name)} is interested in ${sanitizeSubject(dog.name)}`,
        html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #f59e0b;">Great news!</h2>
        <p><strong>${safeRescueName}</strong> has expressed interest in <strong>${safeDogName}</strong> via email match.</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Rescue Contact:</strong> ${safeRescueName}</p>
        <p style="margin: 5px 0 0 0;"><strong>Email:</strong> <a href="mailto:${safeRescueEmail}">${safeRescueEmail}</a></p>
        </div>
        <p>You can view the dog&apos;s profile and alert history on your dashboard:</p>
        <a href="https://dogsrun.org/dashboard" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Dashboard</a>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated notification from DOGSRUN.</p>
        </div>
        `
      })
    }
  }

  return NextResponse.json({ success: true, status })
}
