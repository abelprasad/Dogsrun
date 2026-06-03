import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { registerRatelimit } from '@/lib/ratelimit'
import { escapeHtml } from '@/lib/html'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'anonymous'
  const { success } = await registerRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const user_id = body.user_id as string | undefined
  const name = body.name as string | undefined
  const email = body.email as string | undefined
  const city = body.city as string | undefined
  const state = body.state as string | undefined
  const type = body.type as string | undefined
  const tax_doc_path = body.tax_doc_path as string | undefined

  if (!user_id || !name || !email || !city || !state || !type || !tax_doc_path) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!['shelter', 'rescue'].includes(type)) {
    return NextResponse.json({ error: 'Invalid org type' }, { status: 400 })
  }

  // Validate path ownership — must start with the user's own UUID
  // Prevents one user from claiming another user's uploaded document
  if (!tax_doc_path.startsWith(`${user_id}/`)) {
    return NextResponse.json({ error: 'Invalid document path' }, { status: 403 })
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify the auth user actually exists and the email matches
  const { data: authUser, error: authUserError } = await serviceClient.auth.admin.getUserById(user_id)
  if (authUserError || !authUser.user || authUser.user.email?.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: 'Invalid registration user' }, { status: 403 })
  }

  // Check the file actually exists in storage (proves the client-side upload completed)
  const { data: fileData, error: fileCheckError } = await serviceClient.storage
    .from('tax-docs')
    .list(user_id)

  const fileExists = !fileCheckError && fileData?.some((f) => `${user_id}/${f.name}` === tax_doc_path)
  if (!fileExists) {
    return NextResponse.json({ error: 'Document upload not found. Please try again.' }, { status: 400 })
  }

  // Check for existing org
  const { data: existing } = await serviceClient
    .from('organizations')
    .select('id')
    .eq('id', user_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Organization already exists for this user' }, { status: 409 })
  }

  // Insert org
  const { error: insertError } = await serviceClient.from('organizations').insert({
    id: user_id,
    name,
    email,
    city,
    state,
    type,
    approval_status: 'pending',
    tax_doc_url: tax_doc_path,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Notify all admins
  const { data: admins } = await serviceClient
    .from('admins')
    .select('email')

  if (admins && admins.length > 0) {
    const adminEmails = admins.map((a: { email: string }) => a.email)
    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeCity = escapeHtml(city)
    const safeState = escapeHtml(state)
    const safeType = type === 'shelter' ? 'Shelter' : 'Rescue'

    await resend.emails.send({
      from: 'DOGSRUN <alerts@dogsrun.org>',
      to: adminEmails,
      subject: `New ${safeType} Registration — ${safeName}`,
      html: `
        <div style="background-color:#f5f0e8;padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;background-color:#fff9ef;border:1px solid rgba(19,36,29,0.1);">
            <div style="background-color:#13241d;padding:32px 40px;text-align:center;">
              <p style="color:rgba(244,185,66,0.7);font-size:11px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;margin:0 0 8px 0;">DOGSRUN Admin</p>
              <h1 style="color:#f4b942;font-size:26px;font-weight:900;letter-spacing:-0.025em;margin:0;">New ${safeType} Registration</h1>
            </div>
            <div style="padding:40px;">
              <p style="color:#5d6a64;font-size:15px;line-height:26px;margin:0 0 24px 0;">A new organization has registered and is pending your review.</p>
              <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
                <tr style="border-bottom:1px solid rgba(19,36,29,0.08);">
                  <td style="padding:10px 0;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#5d6a64;width:120px;">Org Name</td>
                  <td style="padding:10px 0;font-size:15px;font-weight:700;color:#13241d;">${safeName}</td>
                </tr>
                <tr style="border-bottom:1px solid rgba(19,36,29,0.08);">
                  <td style="padding:10px 0;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#5d6a64;">Type</td>
                  <td style="padding:10px 0;font-size:15px;color:#13241d;">${safeType}</td>
                </tr>
                <tr style="border-bottom:1px solid rgba(19,36,29,0.08);">
                  <td style="padding:10px 0;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#5d6a64;">Email</td>
                  <td style="padding:10px 0;font-size:15px;color:#13241d;"><a href="mailto:${safeEmail}" style="color:#13241d;">${safeEmail}</a></td>
                </tr>
                <tr>
                  <td style="padding:10px 0;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#5d6a64;">Location</td>
                  <td style="padding:10px 0;font-size:15px;color:#13241d;">${safeCity}, ${safeState}</td>
                </tr>
              </table>
              <div style="text-align:center;">
                <a href="https://dogsrun.org/admin" style="background-color:#13241d;color:#f4b942;padding:14px 32px;text-decoration:none;display:inline-block;font-weight:700;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;">Review in Admin Panel</a>
              </div>
            </div>
            <div style="background-color:#13241d;padding:20px 40px;text-align:center;">
              <p style="color:rgba(244,185,66,0.5);font-size:11px;letter-spacing:0.1em;margin:0 0 4px 0;text-transform:uppercase;">Loyalty Repaid</p>
              <p style="color:rgba(245,240,232,0.4);font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} DOGSRUN &nbsp;|&nbsp;<a href="https://dogsrun.org" style="color:rgba(244,185,66,0.6);text-decoration:none;">dogsrun.org</a></p>
            </div>
          </div>
        </div>
      `,
    })
  }

  return NextResponse.json({ success: true })
}
