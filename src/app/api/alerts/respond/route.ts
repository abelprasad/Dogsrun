import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { notifyShelterOfInterest } from '@/lib/notify-shelter'
import { supabaseAdmin } from '@/lib/supabase-server'
import { respondRatelimit, getClientIp } from '@/lib/ratelimit'
import { ALERT_STATUS, RESPONSE_STATUSES } from '@/lib/alert-status'

export async function POST(req: NextRequest) {
  const respondRatelimit_result = await respondRatelimit.limit(getClientIp(req))
  if (!respondRatelimit_result.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let alert_id: string, status: string
  try {
    const body = await req.json()
    alert_id = body.alert_id
    status = body.status
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!alert_id || !(RESPONSE_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'alert_id and valid status required' }, { status: 400 })
  }

  // Verify the alert belongs to this rescue
  const { data: alert } = await supabaseAdmin
    .from('alerts')
    .select('*, dogs(*), organizations!alerts_rescue_id_fkey(*)')
    .eq('id', alert_id)
    .eq('rescue_id', user.id)
    .single()

  if (!alert) return NextResponse.json({ error: 'Alert not found' }, { status: 404 })

  const wasResponded = alert.status === ALERT_STATUS.RESPONDED

  const { error: updateError } = await supabaseAdmin.from('alerts').update({ status }).eq('id', alert_id)
  if (updateError) {
    console.error('Alert status update failed:', updateError.message)
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }

  // Idempotency (M-D2): only notify the shelter on transition into 'responded',
  // not on repeat POSTs or the dashboard Undo -> Interested flow.
  if (status === ALERT_STATUS.RESPONDED && !wasResponded) {
    try {
      await notifyShelterOfInterest(alert)
    } catch (notifyError) {
      // Status is already saved; a failed email must not turn the response into an error.
      console.error('Shelter interest email failed:', notifyError)
    }
  }

  return NextResponse.json({ success: true, status })
}
