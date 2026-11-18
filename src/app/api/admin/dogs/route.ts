import { supabaseAdmin } from '@/lib/supabase-server'
import { getAdminUser } from '@/lib/auth-context'
import { VALID_DOG_STATUSES } from '@/lib/dog-status'
import { NextRequest, NextResponse } from 'next/server'
import { parsePageParam, parsePageSizeParam } from '@/lib/pagination'

export async function PATCH(req: NextRequest) {
  const { user, isAdmin } = await getAdminUser()
  if (!user || !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
  const { user, isAdmin } = await getAdminUser()
  if (!user || !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { dog_id } = await req.json()
  if (!dog_id) return NextResponse.json({ error: 'dog_id required' }, { status: 400 })

  const { error: alertsError } = await supabaseAdmin.from('alerts').delete().eq('dog_id', dog_id)
  if (alertsError) return NextResponse.json({ error: alertsError.message }, { status: 500 })
  const { error } = await supabaseAdmin.from('dogs').delete().eq('id', dog_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest) {
  const { user, isAdmin } = await getAdminUser()
  if (!user || !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const params = req.nextUrl.searchParams
  const page = parsePageParam(params.get('page'))
  const pageSize = parsePageSizeParam(params.get('pageSize'))
  const filter = params.get('filter') // 'all' | 'urgent' | 'at_risk'
  const todayStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD for date-only column comparison (L-7)

  let query = supabaseAdmin
    .from('dogs')
    .select('*, organizations(name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filter === 'urgent') {
    query = query.eq('status', 'urgent')
  } else if (filter === 'at_risk') {
    query = query.not('euthanasia_date', 'is', null).gte('euthanasia_date', todayStr)
  }

  const from = (page - 1) * pageSize
  const { data: dogs, count } = await query.range(from, from + pageSize - 1)

  // Filter-tab counts (head-only, dashboard style)
  const [{ count: all }, { count: urgent }, { count: atRisk }] = await Promise.all([
    supabaseAdmin.from('dogs').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('dogs').select('*', { count: 'exact', head: true }).eq('status', 'urgent'),
    supabaseAdmin.from('dogs').select('*', { count: 'exact', head: true }).not('euthanasia_date', 'is', null).gte('euthanasia_date', todayStr),
  ])

  return NextResponse.json({
    dogs: dogs ?? [],
    total: count ?? 0,
    page,
    pageSize,
    counts: { all: all ?? 0, urgent: urgent ?? 0, atRisk: atRisk ?? 0 },
  })
}
