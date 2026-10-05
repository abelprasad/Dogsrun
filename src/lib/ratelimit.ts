import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest } from 'next/server'

type LimitResult = Awaited<ReturnType<Ratelimit['limit']>>
type RateLimiter = Pick<Ratelimit, 'limit'>

const hasRedisConfig = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

// M-S3: fail closed-ish. If Upstash is not configured, fall back to an
// in-memory sliding window instead of silently allowing everything.
// Not distributed, but prevents the "missing env var disables all
// abuse protection" footgun.
class MemoryRatelimit implements RateLimiter {
  private hits = new Map<string, number[]>()
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  async limit(identifier: string): Promise<LimitResult> {
    const now = Date.now()
    const cutoff = now - this.windowMs
    const timestamps = (this.hits.get(identifier) ?? []).filter((t) => t > cutoff)
    const success = timestamps.length < this.maxRequests
    if (success) timestamps.push(now)
    this.hits.set(identifier, timestamps)
    return {
      success,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - timestamps.length),
      reset: now + this.windowMs,
      pending: Promise.resolve(),
    }
  }
}

if (!hasRedisConfig) {
  console.warn(
    '[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN not set — using in-memory rate limiting (not shared across instances)'
  )
}

const redis = hasRedisConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
token: <redacted>
    })
  : null

function makeLimiter(
  maxRequests: number,
  window: `${number} ${'s' | 'm' | 'h'}`,
  prefix: string
): RateLimiter {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, window),
      prefix,
    })
  }
  const ms =
    window.endsWith('s')
      ? parseInt(window) * 1000
      : window.endsWith('m')
        ? parseInt(window) * 60 * 1000
        : parseInt(window) * 60 * 60 * 1000
  return new MemoryRatelimit(maxRequests, ms)
}

// M-S4: take the LAST XFF entry (the one appended by trusted edge infra),
// not the first (which the client can spoof).
export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.length > 0) return parts[parts.length - 1]
  }
  return req.headers.get('x-real-ip')?.trim() ?? 'anonymous'
}

// /api/contact — 5 requests per 15 minutes per IP
export const contactRatelimit = makeLimiter(5, '15 m', 'rl:contact')

// /api/register — 3 requests per hour per IP
export const registerRatelimit = makeLimiter(3, '1 h', 'rl:register')

// M-S5: email-sending routes
// /api/alerts (bulk alert send) — 10 per hour per IP
export const alertsRatelimit = makeLimiter(10, '1 h', 'rl:alerts')

// /api/respond, /api/alerts/respond — 30 per hour per IP
export const respondRatelimit = makeLimiter(30, '1 h', 'rl:respond')

// Admin email routes — 20 per hour per IP
export const adminEmailRatelimit = makeLimiter(20, '1 h', 'rl:admin-email')
