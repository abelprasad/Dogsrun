import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getAdminUser } from '@/lib/auth-context'

export async function POST(req: NextRequest) {
  const { user, isAdmin } = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { file_path } = await req.json()
  if (!file_path) return NextResponse.json({ error: 'file_path required' }, { status: 400 })


  const { data, error } = await supabaseAdmin.storage
    .from('tax-docs')
    .createSignedUrl(file_path, 120)

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
