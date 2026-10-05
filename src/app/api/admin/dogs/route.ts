import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// REVIEW: the same admin check is hand-rolled in admin/orgs, approve, digest and signed-url; move this to lib/auth-context.ts and reuse it.
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

// REVIEW: dog status list lives in 4 places; one DOG_STATUSES in lib.
const VALID_DOG_STATUSES = new Set([
  'available',
  'pending',
  'adopted',
  'deceased',
  'transferred',
  'urgent',
  'rescue_requested',
  'placed',
])

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
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const params = req.nextUrl.searchParams
  const page = parsePageParam(params.get('page'))
  const pageSize = parsePageSizeParam(params.get('pageSize'))
  const filter = params.get('filter') // 'all' | 'urgent' | 'at_risk'
  const nowIso = new Date().toISOString()

  let query = serviceClient
    .from('dogs')
    .select('*, organizations(name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filter === 'urgent') {
    query = query.eq('status', 'urgent')
  } else if (filter === 'at_risk') {
    query = query.not('euthanasia_date', 'is', null).gt('euthanasia_date', nowIso)
  }

  const from = (page - 1) * pageSize
  const { data: dogs, count } = await query.range(from, from + pageSize - 1)

  // Filter-tab counts (head-only, dashboard style)
  const [{ count: all }, { count: urgent }, { count: atRisk }] = await Promise.all([
    serviceClient.from('dogs').select('*', { count: 'exact', head: true }),
    serviceClient.from('dogs').select('*', { count: 'exact', head: true }).eq('status', 'urgent'),
    serviceClient.from('dogs').select('*', { count: 'exact', head: true }).not('euthanasia_date', 'is', null).gt('euthanasia_date', nowIso),
  ])

  return NextResponse.json({
    dogs: dogs ?? [],
    total: count ?? 0,
    page,
    pageSize,
    counts: { all: all ?? 0, urgent: urgent ?? 0, atRisk: atRisk ?? 0 },
  })
}
