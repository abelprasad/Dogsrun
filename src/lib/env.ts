// M-C5: Centralized env access with clear error messages.
// Replaces scattered `process.env.X!` non-null assertions that fail
// cryptically at request time (e.g. `new Resend(undefined)`).
//
// Note: validation warns rather than throws at import time so builds
// with placeholder env (CI) don't break. Call `assertEnv()` explicitly
// in API routes for fail-fast behavior.

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
] as const

export function getEnv(key: (typeof required)[number]): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${key}. ` +
        `Check your .env file or deployment configuration.`
    )
  }
  return value
}

export function assertEnv(): void {
  const missing = required.filter((k) => !process.env[k])
  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required environment variables: ${missing.join(', ')}`
    )
  }
}

// Typed env object — prefer this over process.env.X! in new code.
export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return getEnv('NEXT_PUBLIC_SUPABASE_URL')
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return getEnv('SUPABASE_SERVICE_ROLE_KEY')
  },
  get RESEND_API_KEY() {
    return getEnv('RESEND_API_KEY')
  },
  get UPSTASH_REDIS_REST_URL() {
    return process.env.UPSTASH_REDIS_REST_URL
  },
  get UPSTASH_REDIS_REST_TOKEN() {
    return process.env.UPSTASH_REDIS_REST_TOKEN
  },
}
