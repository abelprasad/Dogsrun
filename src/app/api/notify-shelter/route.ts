import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  const { alert_id } = await req.json()
  if (!alert_id) return NextResponse.json({ error: 'alert_id required' }, { status: 400 })

  const { data: alert } = await supabase
    .from('alerts')
    .select('*, dogs(*), organizations!alerts_rescue_id_fkey(*)')
    .eq('id', alert_id)
    .single()

  if (!alert) return NextResponse.json({ error: 'Alert not found' }, { status: 404 })

  const dog = alert.dogs
  const rescue = alert.organizations

  const { data: shelter } = await supabase
    .from('organizations')
    .select('name, email')
    .eq('id', dog.shelter_id)
    .single()

  if (!shelter) return NextResponse.json({ error: 'Shelter not found' }, { status: 404 })

  await resend.emails.send({
    from: 'DOGSRUN <alerts@dogsrun.org>',
    to: shelter.email,
    subject: `${rescue.name} is interested in ${dog.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:10px;">
        <h2 style="color:#f59e0b;">Great news!</h2>
        <p><strong>${rescue.name}</strong> has expressed interest in <strong>${dog.name}</strong>.</p>
        <div style="background:#f9f9f9;padding:15px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;"><strong>Rescue:</strong> ${rescue.name}</p>
          <p style="margin:5px 0 0;"><strong>Email:</strong> <a href="mailto:${rescue.email}">${rescue.email}</a></p>
        </div>
        <a href="https://dogsrun.org/dashboard" style="display:inline-block;background:#f59e0b;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Go to Dashboard</a>
      </div>
    `,
  })

  return NextResponse.json({ success: true })
}
