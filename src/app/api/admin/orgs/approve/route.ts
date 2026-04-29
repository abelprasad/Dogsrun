import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

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
    .select('name, email')
    .single()

  if (updateError || !org) {
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
  }

  const subject = action === 'approve' ? `You're approved on DOGSRUN!` : `DOGSRUN — Application Update`

  const html = action === 'approve' ? `
    <div style="background-color:#f9fafb;padding:32px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background-color:#f59e0b;padding:24px;text-align:center;">
          <span style="color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.025em;">DOGSRUN</span>
        </div>
        <div style="padding:32px 40px;">
          <h1 style="color:#111827;font-size:22px;font-weight:700;margin-bottom:16px;">You're approved! 🎉</h1>
          <p style="color:#4b5563;font-size:16px;line-height:24px;margin-bottom:24px;">Hi <strong>${org.name}</strong>, your 501(c)(3) verification has been reviewed and your organization is now approved on DOGSRUN.</p>
          <div style="text-align:center;margin-bottom:32px;">
            <a href="https://dogsrun.org/dashboard" style="background-color:#f59e0b;color:#fff;padding:16px 32px;border-radius:12px;text-decoration:none;display:inline-block;font-weight:700;font-size:16px;">Go to Your Dashboard</a>
          </div>
        </div>
        <div style="background-color:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} DOGSRUN. All rights reserved.</p>
        </div>
      </div>
    </div>
  ` : `
    <div style="background-color:#f9fafb;padding:32px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background-color:#f59e0b;padding:24px;text-align:center;">
          <span style="color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.025em;">DOGSRUN</span>
        </div>
        <div style="padding:32px 40px;">
          <h1 style="color:#111827;font-size:22px;font-weight:700;margin-bottom:16px;">Application Update</h1>
          <p style="color:#4b5563;font-size:16px;line-height:24px;margin-bottom:24px;">Hi <strong>${org.name}</strong>, we were unable to verify your 501(c)(3) status. Please contact us at <a href="mailto:admin@dogsrun.org" style="color:#f59e0b;">admin@dogsrun.org</a> to resubmit.</p>
        </div>
        <div style="background-color:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} DOGSRUN. All rights reserved.</p>
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

  return NextResponse.json({ success: true, approval_status: newStatus })
}
