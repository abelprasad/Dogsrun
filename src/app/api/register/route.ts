import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export async function POST(req: NextRequest) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const user_id = formData.get('user_id') as string
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  const type = formData.get('type') as string
  const taxDoc = formData.get('tax_doc') as File | null

  if (!user_id || !name || !email || !city || !state || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!['shelter', 'rescue'].includes(type)) {
    return NextResponse.json({ error: 'Invalid org type' }, { status: 400 })
  }

  if (!taxDoc) {
    return NextResponse.json({ error: '501(c)(3) determination letter is required' }, { status: 400 })
  }
  if (taxDoc.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Tax document must be a PDF file' }, { status: 400 })
  }
  if (taxDoc.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'PDF must be under 10MB' }, { status: 400 })
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: authUser, error: authUserError } = await serviceClient.auth.admin.getUserById(user_id)
  if (authUserError || !authUser.user || authUser.user.email?.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: 'Invalid registration user' }, { status: 403 })
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

  // Upload tax doc
  let tax_doc_url: string | null = null

  const fileBuffer = await taxDoc.arrayBuffer()
  const filePath = `${user_id}/501c3.pdf`

  const { error: uploadError } = await serviceClient.storage
    .from('tax-docs')
    .upload(filePath, fileBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: 'Failed to upload document. Please try again.' }, { status: 500 })
  }

  tax_doc_url = filePath

  // Insert org
  const { error } = await serviceClient.from('organizations').insert({
    id: user_id,
    name,
    email,
    city,
    state,
    type,
    approval_status: 'pending',
    tax_doc_url,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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
                  <td style="padding:10px 0;font-size:15px;color:#13241d;">${safeCity}, ${escapeHtml(state)}</td>
                </tr>
              </table>
              <div style="text-align:center;">
                <a href="https://dogsrun.org/dashboard/admin" style="background-color:#13241d;color:#f4b942;padding:14px 32px;text-decoration:none;display:inline-block;font-weight:700;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;">Review in Admin Panel</a>
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
