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
    <div style="background-color:#f5f0e8;padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background-color:#fff9ef;border:1px solid rgba(19,36,29,0.1);">
        <div style="background-color:#13241d;padding:32px 40px;text-align:center;">
          <p style="color:rgba(244,185,66,0.7);font-size:11px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;margin:0 0 8px 0;">DOGSRUN</p>
          <h1 style="color:#f4b942;font-size:28px;font-weight:900;letter-spacing:-0.025em;margin:0;">You're Approved!</h1>
        </div>
        <div style="padding:40px;">
          <p style="color:#5d6a64;font-size:15px;line-height:26px;margin:0 0 32px 0;">Hi <strong style="color:#13241d;">${org.name}</strong>, your 501(c)(3) verification has been reviewed and your organization is now approved on DOGSRUN. Welcome to the network.</p>
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
          <p style="color:#5d6a64;font-size:15px;line-height:26px;margin:0 0 24px 0;">Hi <strong style="color:#13241d;">${org.name}</strong>, we were unable to verify your 501(c)(3) status at this time.</p>
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

  return NextResponse.json({ success: true, approval_status: newStatus })
}
