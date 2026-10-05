import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase-server'
import { VALID_DOG_STATUSES } from '@/lib/dog-status'
import { NextRequest, NextResponse } from 'next/server'

// REVIEW: the same admin check is hand-rolled in admin/orgs, approve, digest and signed-url; move this to lib/auth-context.ts and reuse it.
async function verifyAdmin() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: admin } = await supabase.from('admins').select('id').eq('email', user.email).maybeSingle()
  return admin ? user : null
}



export async function PATCH(req: NextRequest) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { dog_id, ...fields } = await req.json()
  if (!dog_id) return NextResponse.json({ error: 'dog_id required' }, { status: 400 })

  const update: Record<string, unknown> = {}
  if ('status' in fields) {
    if (typeof fields.status !== 'string' || !VALID_DOG_STATUSES.has(fields.status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }
    update.status = fields.status
  }
  if ('euthanasia_date' in fields) update.euthanasia_date = fields.euthanasia_date || null

  const { error } = await supabaseAdmin.from('dogs').update(update).eq('id', dog_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { dog_id } = await req.json()
  if (!dog_id) return NextResponse.json({ error: 'dog_id required' }, { status: 400 })

  await supabaseAdmin.from('alerts').delete().eq('dog_id', dog_id)
  const { error } = await supabaseAdmin.from('dogs').delete().eq('id', dog_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
