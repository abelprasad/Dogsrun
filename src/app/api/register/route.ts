import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()

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

  // Upload tax doc for all orgs
  let tax_doc_url: string | null = null

  if (taxDoc) {
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
  }

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

  return NextResponse.json({ success: true })
}
