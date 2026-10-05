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
    '[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN not set — using in-memory rate limiting'
  )
}

const redis = hasRedisConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

function makeLimiter(maxRequests: number, window: string, prefix: string): RateLimiter {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, window as `${number} ${'s' | 'm' | 'h' | 'd'}`),
      prefix,
    })
  }
  const num = parseInt(window)
  const ms = window.endsWith('s')
    ? num * 1000
    : window.endsWith('m')
      ? num * 60 * 1000
      : num * 60 * 60 * 1000
  return new MemoryRatelimit(num, ms)
}

// M-S4: take the LAST XFF entry (appended by trusted edge), not the first.
export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.length > 0) return parts[parts.length - 1]
  }
  return req.headers.get('x-real-ip')?.trim() ?? 'anonymous'
}

export const contactRatelimit = makeLimiter(5, '15 m', 'rl:contact')
export const registerRatelimit = makeLimiter(3, '1 h', 'rl:register')
export const alertsRatelimit = makeLimiter(10, '1 h', 'rl:alerts')
export const respondRatelimit = makeLimiter(30, '1 h', 'rl:respond')
export const adminEmailRatelimit = makeLimiter(20, '1 h', 'rl:admin-email')
