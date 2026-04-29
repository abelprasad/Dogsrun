import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

async function verifyAdmin() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: admin } = await supabase.from('admins').select('id').eq('email', user.email).maybeSingle()
  return admin ? user : null
}

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: NextRequest) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { dog_id, ...fields } = await req.json()
  if (!dog_id) return NextResponse.json({ error: 'dog_id required' }, { status: 400 })

  const update: Record<string, unknown> = {}
  if ('status' in fields) update.status = fields.status
  if ('euthanasia_date' in fields) update.euthanasia_date = fields.euthanasia_date || null

  const { error } = await serviceClient.from('dogs').update(update).eq('id', dog_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { dog_id } = await req.json()
  if (!dog_id) return NextResponse.json({ error: 'dog_id required' }, { status: 400 })

  await serviceClient.from('alerts').delete().eq('dog_id', dog_id)
  const { error } = await serviceClient.from('dogs').delete().eq('id', dog_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
