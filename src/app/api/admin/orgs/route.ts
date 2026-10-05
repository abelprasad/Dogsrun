import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

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

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await serviceClient
    .from('organizations')
    .update({ is_active })
    .eq('id', org_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, org_id, is_active })
}

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

function parsePageParam(value: string | null): number {
  const parsed = Number.parseInt(value || '1', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function parsePageSizeParam(value: string | null): number {
  const parsed = Number.parseInt(value || String(DEFAULT_PAGE_SIZE), 10)
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_PAGE_SIZE
  return Math.min(parsed, MAX_PAGE_SIZE)
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()

  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const params = req.nextUrl.searchParams
  const page = parsePageParam(params.get('page'))
  const pageSize = parsePageSizeParam(params.get('pageSize'))
  const type = params.get('type')
  const approvalStatus = params.get('approval_status')

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = serviceClient
    .from('organizations')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (type === 'shelter' || type === 'rescue') query = query.eq('type', type)
  if (approvalStatus) query = query.eq('approval_status', approvalStatus)

  const from = (page - 1) * pageSize
  const { data: orgs, count } = await query.range(from, from + pageSize - 1)

  // Alert stats for the orgs on this page (two narrow columns only, no full-row fetch)
  const ids = (orgs ?? []).map((o) => o.id)
  const alertStats: Record<string, { sent: number; responded: number }> = {}
  if (ids.length > 0) {
    const { data: alerts } = await serviceClient
      .from('alerts')
      .select('rescue_id, status')
      .in('rescue_id', ids)
    for (const alert of alerts ?? []) {
      if (!alertStats[alert.rescue_id]) alertStats[alert.rescue_id] = { sent: 0, responded: 0 }
      alertStats[alert.rescue_id].sent++
      if (alert.status === 'responded') alertStats[alert.rescue_id].responded++
    }
  }

  // Type counts for the filter buttons (head-only, dashboard style)
  const [{ count: all }, { count: shelters }, { count: rescues }] = await Promise.all([
    serviceClient.from('organizations').select('*', { count: 'exact', head: true }),
    serviceClient.from('organizations').select('*', { count: 'exact', head: true }).eq('type', 'shelter'),
    serviceClient.from('organizations').select('*', { count: 'exact', head: true }).eq('type', 'rescue'),
  ])

  return NextResponse.json({
    orgs: orgs ?? [],
    total: count ?? 0,
    page,
    pageSize,
    alertStats,
    counts: { all: all ?? 0, shelter: shelters ?? 0, rescue: rescues ?? 0 },
  })
}
