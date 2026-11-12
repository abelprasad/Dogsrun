/**
 * Invite a shelter to DOGSRUN — creates the Supabase Auth user for the
 * shelter's real contact email and prints a set-password link to send them.
 *
 * This does NOT create the `organizations` row and does NOT set a password.
 * The shelter sets its own password via the link, then completes the
 * normal registration at dogsrun.org/register (uploads its 501(c)(3) PDF),
 * which inserts the org row with `id = <auth-user-id>`. An admin then
 * approves it at dogsrun.org/admin. That is the app's existing flow
 * (src/app/(public)/register/page.tsx + src/app/api/register/route.ts) —
 * this script only starts it, it does not bypass it.
 *
 * Requires REAL Supabase keys. The .env.local on indra is placeholder-only
 * and this script refuses to run against it. Pull real env first:
 *   vercel env pull .env.local   (from a logged-in Vercel session)
 * or set NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY by hand.
 * Never commit real keys.
 *
 * Usage:
 *   npx tsx scripts/invite-shelter-org.ts --email adoptions@pspca.org \
 *     --name "Pennsylvania SPCA" --city Philadelphia --state PA [--dry-run]
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// CLI output helpers — the repo's husky pre-commit hook bans console.* in
// staged .ts files, so CLI scripts write to stdout/stderr directly.
function out(msg: string) {
  process.stdout.write(msg + '\n')
}
function err(msg: string) {
  process.stderr.write(msg + '\n')
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : undefined
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run')
  const email = arg('--email')
  const name = arg('--name')
  const city = arg('--city') ?? 'Philadelphia'
  const state = arg('--state') ?? 'PA'

  if (!email || !name) {
    err('Usage: invite-shelter-org.ts --email <shelter-email> --name "<Shelter Name>" [--city X --state PA] [--dry-run]')
    process.exit(1)
  }

  // Dry run needs no Supabase at all — print what would happen and stop.
  if (dryRun) {
    out(`[dry-run] Would invite ${name} <${email}> (${city}, ${state}).`)
    out('[dry-run] No auth user created, no email sent.')
    return
  }

  const env = Object.fromEntries(
    readFileSync('.env.local', 'utf8')
      .split('\n')
      .filter((l) => l.includes('='))
      .map((l) => {
        const i = l.indexOf('=')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
      }),
  )
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  if (!url || url.includes('placeholder') || !serviceKey || serviceKey === 'placeholder') {
    err(
      'Refusing to run: .env.local holds placeholder Supabase credentials. ' +
        'Pull real env first (vercel env pull .env.local) — see docs/scraping-sources.md.',
    )
    process.exit(1)
  }

  const sb = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  // Idempotency: do not create a second auth user for the same email.
  const { data: users } = await sb.auth.admin.listUsers({ perPage: 1000 })
  const existing = users?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  let userId: string
  if (existing) {
    out(`Auth user already exists for ${email} (id ${existing.id}). Reusing it — no duplicate created.`)
    userId = existing.id
  } else {
    const { data, error } = await sb.auth.admin.createUser({ email, email_confirm: true })
    if (error || !data.user) {
      err(`Failed to create auth user: ${error?.message ?? 'unknown error'}`)
      process.exit(1)
    }
    userId = data.user.id
    out(`Created auth user for ${email} (id ${userId}).`)
  }

  // Set-password link the shelter uses to choose its own password.
  const { data: link, error: linkError } = await sb.auth.admin.generateLink({
    type: 'recovery',
    email,
  })
  if (linkError || !link?.properties?.action_link) {
    err(`Failed to generate set-password link: ${linkError?.message ?? 'unknown error'}`)
    process.exit(1)
  }

  out('')
  out(`Invite ${name} <${email}> with this link (send it to the shelter, do not post it publicly):`)
  out(link.properties.action_link)
  out('')
  out('Next steps for the shelter: set its own password, go to dogsrun.org/register,')
  out('upload its 501(c)(3) PDF, submit. Then an admin approves it at dogsrun.org/admin.')
  out('Record the outcome in docs/scraping-sources.md (account: pending-invite -> active).')
}

main().catch((error: unknown) => {
  err(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
