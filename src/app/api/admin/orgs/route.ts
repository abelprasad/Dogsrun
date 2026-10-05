import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()

  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { org_id, is_active } = await req.json()
  if (!org_id || typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'org_id and is_active required' }, { status: 400 })
  }


  const { error } = await supabaseAdmin
    .from('organizations')
    .update({ is_active })
    .eq('id', org_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, org_id, is_active })
}
