import { getAdminUser } from '@/lib/auth-context'
import { NextRequest, NextResponse } from 'next/server'
import { escapeHtml } from '@/lib/html'
import { supabaseAdmin } from '@/lib/supabase-server'
import { deliverDigest, findDigestMatches, getActiveCriteria } from '@/lib/digest'
import { adminEmailRatelimit, getClientIp } from '@/lib/ratelimit'

// Idempotency (M-D5): in-memory debounce to prevent duplicate digest emails
// from double-clicks. 5-minute window per org. Note: does not survive
// restarts or share across instances — a `last_digest_sent_at` column
// would be more robust.
const recentDigests = new Map<string, number>()
const DIGEST_DEBOUNCE_MS = 5 * 60 * 1000

export async function POST(req: NextRequest) {
  const adminEmailRatelimit_result = await adminEmailRatelimit.limit(getClientIp(req))
  if (!adminEmailRatelimit_result.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }
  const { user, isAdmin } = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let org_id: string
  try {
    const body = await req.json()
    org_id = body.org_id
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!org_id) return NextResponse.json({ error: 'org_id required' }, { status: 400 })

  const lastSent = recentDigests.get(org_id)
  if (lastSent && Date.now() - lastSent < DIGEST_DEBOUNCE_MS) {
    return NextResponse.json({ success: true, message: 'Digest recently sent, skipping duplicate', skipped: true })
  }


  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id, name, email, type, approval_status, is_active')
    .eq('id', org_id)
    .single()

  if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })
  if (org.type !== 'rescue') return NextResponse.json({ error: 'Only rescues can receive a digest' }, { status: 400 })
  if (org.approval_status !== 'approved') return NextResponse.json({ error: 'Org is not approved' }, { status: 400 })
  if (org.is_active === false) return NextResponse.json({ error: 'Org is deactivated' }, { status: 403 })

  const criteria = await getActiveCriteria(org_id)
  if (!criteria) return NextResponse.json({ error: 'Rescue has no active criteria set' }, { status: 400 })

  const { availableCount, matches } = await findDigestMatches(org_id, criteria)

  if (availableCount === 0) {
    return NextResponse.json({ message: 'No available dogs found', matches: 0 })
  }

  if (matches.length === 0) {
    return NextResponse.json({ message: "No matching dogs found for this rescue's criteria", matches: 0 })
  }

  await deliverDigest(
    org_id,
    criteria,
    matches,
    org.email,
    `Hi <strong style="color:#13241d;">${escapeHtml(org.name)}</strong>, here are the dogs currently available on DOGSRUN that match your rescue criteria.`,
  )

  recentDigests.set(org_id, Date.now())

  return NextResponse.json({ success: true, matches: matches.length })
}
