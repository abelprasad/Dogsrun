import { CONTACT_EMAIL, SITE_URL, STORAGE_BUCKETS } from '@/lib/constants'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { registerRatelimit, getClientIp } from '@/lib/ratelimit'
import { escapeHtml } from '@/lib/html'
import { brandedEmail, emailButton, emailDetailRow } from '@/lib/email'
import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase-server'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
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

  // M-S1: verify the caller is the user they're registering — prevents
  // squatting another user's org registration with a known user_id + email.
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate path ownership — must start with the user's own UUID
  // Prevents one user from claiming another user's uploaded document
  if (!tax_doc_path.startsWith(`${user_id}/`)) {
    return NextResponse.json({ error: 'Invalid document path' }, { status: 403 })
  }


  // Verify the auth user actually exists and the email matches
  const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(user_id)
  if (authUserError || !authUser.user || authUser.user.email?.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: 'Invalid registration user' }, { status: 403 })
  }

  // Check the file actually exists in storage (proves the client-side upload completed)
  const { data: fileData, error: fileCheckError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKETS.TAX_DOCS)
    .list(user_id)

  const fileExists = !fileCheckError && fileData?.some((f) => `${user_id}/${f.name}` === tax_doc_path)
  if (!fileExists) {
    return NextResponse.json({ error: 'Document upload not found. Please try again.' }, { status: 400 })
  }

  // Check for existing org
  const { data: existing } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('id', user_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Organization already exists for this user' }, { status: 409 })
  }

  // Insert org
  const { error: insertError } = await supabaseAdmin.from('organizations').insert({
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
    // M-D8: concurrent double-submit race — return 409, not raw DB error (L-1)
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'Organization already exists for this user' }, { status: 409 })
    }
    console.error('Org insert failed:', insertError)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }

  // Notify all admins
  const { data: admins } = await supabaseAdmin
    .from('admins')
    .select('email')

  let adminNotified = true
  if (admins && admins.length > 0) {
    const adminEmails = admins.map((a: { email: string }) => a.email)
    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeCity = escapeHtml(city)
    const safeState = escapeHtml(state)
    const safeType = type === 'shelter' ? 'Shelter' : 'Rescue'

    try {
    await resend.emails.send({
      from: `DOGSRUN <${CONTACT_EMAIL}>`,
      to: adminEmails,
      subject: `New ${safeType} Registration — ${safeName}`,
      html: brandedEmail({
        eyebrow: 'DOGSRUN Admin',
        title: `New ${safeType} Registration`,
        titleSize: 26,
        bodyHtml: `
              <p style="color:#5d6a64;font-size:15px;line-height:26px;margin:0 0 24px 0;">A new organization has registered and is pending your review.</p>
              <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">${
                emailDetailRow('Org Name', safeName, { bold: true, labelWidth: true }) +
                emailDetailRow('Type', safeType) +
                emailDetailRow('Email', `<a href="mailto:${safeEmail}" style="color:#13241d;">${safeEmail}</a>`) +
                emailDetailRow('Location', `${safeCity}, ${safeState}`, { last: true })
              }
              </table>
              <div style="text-align:center;">
                ${emailButton(`${SITE_URL}/admin`, 'Review in Admin Panel')}
              </div>`,
      }),
    })
    } catch (emailError) {
      // M-D6: org is already inserted — don't 500, just flag for retry
      console.error('Admin notification email failed:', emailError)
      adminNotified = false
    }
  }

  return NextResponse.json({ success: true, adminNotified })
}
