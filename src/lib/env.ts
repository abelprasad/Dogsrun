// Server-side env access with a clear error instead of a cryptic failure at
// first use (e.g. `new Resend(undefined)`).
//
// Each getter reads a literal `process.env.X` so Next.js can still inline
// NEXT_PUBLIC_* values at build time. Browser code (lib/supabase.ts) and the
// edge proxy (proxy.ts) keep their own direct reads on purpose.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${name}. ` +
        `Check your .env file or deployment configuration.`
    )
  }
  return value
}

export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY)
  },
  get RESEND_API_KEY() {
    return required('RESEND_API_KEY', process.env.RESEND_API_KEY)
  },
  get UPSTASH_REDIS_REST_URL() {
    return process.env.UPSTASH_REDIS_REST_URL
  },
  get UPSTASH_REDIS_REST_TOKEN() {
    return process.env.UPSTASH_REDIS_REST_TOKEN
  },
}
