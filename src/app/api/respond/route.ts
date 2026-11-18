import { NextRequest, NextResponse } from 'next/server'
import { notifyShelterOfInterest } from '@/lib/notify-shelter'
import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase-server'
import { respondRatelimit, getClientIp } from '@/lib/ratelimit'
import { ALERT_STATUS } from '@/lib/alert-status'

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

  const status = action === 'interested' ? ALERT_STATUS.RESPONDED : ALERT_STATUS.DECLINED

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

  const wasResponded = alert.status === ALERT_STATUS.RESPONDED

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
    try {
      await notifyShelterOfInterest(alert, { viaEmailMatch: true })
    } catch (notifyError) {
      // Status is already saved; a failed email must not turn the response into an error.
      console.error('Shelter interest email failed:', notifyError)
    }
  }

  return NextResponse.json({ success: true, status })
}
