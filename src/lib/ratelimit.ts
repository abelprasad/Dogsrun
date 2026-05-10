import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type LimitResult = Awaited<ReturnType<Ratelimit['limit']>>
type RateLimiter = Pick<Ratelimit, 'limit'>

const hasRedisConfig = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

const allowAllRatelimit: RateLimiter = {
  async limit(): Promise<LimitResult> {
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
      pending: Promise.resolve(),
    }
  },
}

const redis = hasRedisConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// /api/contact — 5 requests per 15 minutes per IP
export const contactRatelimit: RateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      prefix: 'rl:contact',
    })
  : allowAllRatelimit

// /api/register — 3 requests per hour per IP
export const registerRatelimit: RateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      prefix: 'rl:register',
    })
  : allowAllRatelimit
