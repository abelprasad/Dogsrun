import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { user_id, name, email, city, state, type } = await req.json()

  if (!user_id || !name || !email || !city || !state || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!['shelter', 'rescue'].includes(type)) {
    return NextResponse.json({ error: 'Invalid org type' }, { status: 400 })
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Make sure no org already exists for this user
  const { data: existing } = await serviceClient
    .from('organizations')
    .select('id')
    .eq('id', user_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Organization already exists for this user' }, { status: 409 })
  }

  const { error } = await serviceClient.from('organizations').insert({
    id: user_id,
    name,
    email,
    city,
    state,
    type,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
