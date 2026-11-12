/**
 * DOGSRUN — ACCT Philly scraper CLI (Phase 0–1).
 *
 * --dry-run is the DEFAULT: lists what the adapter would import and prints
 * it. It imports nothing and writes nothing to Supabase.
 *
 *   npx tsx scripts/scrape-acct.ts                  # dry run (default)
 *   npx tsx scripts/scrape-acct.ts --live           # full list, still
 *                                                    # writes NOTHING to
 *                                                    # Supabase in this phase
 *   npx tsx scripts/scrape-acct.ts --max-pages 5 --limit 10 --json
 *
 * Flags:
 *   --dry-run      dry run (default; wins over --live when both are given)
 *   --live         full run; Phase 0–1 still writes nothing to Supabase
 *   --max-pages N  cap on paginated list pages (default 5 dry-run, 50 live)
 *   --limit N      max dogs printed (default 25; 0 = all)
 *   --json         print the dog list as JSON instead of a table
 *
 * Exit codes: 0 ok, 2 blocked/failed run (a failed sync, not an empty
 * import), 1 unexpected error.
 */
import { ACCT_SOURCE, AcctShelterluvAdapter } from '../src/lib/scraping/adapters/acct'
import { dedupeExact } from '../src/lib/scraping/dedup'
import { AdapterBlockedError } from '../src/lib/scraping/types'

const args = process.argv.slice(2)
const live = args.includes('--live') && !args.includes('--dry-run')
const dryRun = !live
const json = args.includes('--json')

function flagValue(name: string): number | null {
  const index = args.indexOf(name)
  if (index === -1 || index + 1 >= args.length) return null
  const value = Number(args[index + 1])
  return Number.isFinite(value) && value >= 0 ? value : null
}

const maxPages = flagValue('--max-pages') ?? (dryRun ? 5 : 50)
const limit = flagValue('--limit') ?? 25

function formatAge(ageYears: number | null): string {
  return ageYears === null ? '?' : `${ageYears}y`
}

async function main(): Promise<void> {
  console.log(`DOGSRUN scrape: ${ACCT_SOURCE}`)
  console.log(
    dryRun
      ? 'Mode: DRY RUN — prints what would be imported, imports nothing.'
      : 'Mode: LIVE — full list. Phase 0–1: still writes NOTHING to Supabase.',
  )
  const adapter = new AcctShelterluvAdapter({ maxPages, maxDetailFetches: dryRun ? 5 : 200 })
  const startedAt = Date.now()
  let dogs
  try {
    dogs = await adapter.listDogs()
  } catch (error) {
    if (error instanceof AdapterBlockedError) {
      console.error(`\nBLOCKED / FAILED RUN [${error.reason}]: ${error.message}`)
      console.error('This run is a failed sync, not an empty import. No dogs were imported.')
      process.exit(2)
    }
    throw error
  }
  const { unique, duplicates } = dedupeExact(dogs)
  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1)
  const shown = limit === 0 ? unique : unique.slice(0, limit)

  if (json) {
    console.log(JSON.stringify({ source: ACCT_SOURCE, dryRun, seen: dogs.length, unique: unique.length, duplicates: duplicates.length, elapsedSec, dogs: shown }, null, 2))
  } else {
    console.log(
      `\nSeen: ${dogs.length} dogs | Unique: ${unique.length} | Exact duplicates dropped: ${duplicates.length} | ${elapsedSec}s`,
    )
    for (const dog of shown) {
      console.log(
        `- ${dog.name} | ${dog.sourceId} | ${dog.breed}${dog.mix ? ' (mix)' : ''} | ${formatAge(dog.ageYears)} | ${dog.sex} | ${dog.weightLbs ?? '?'} lbs | ${dog.photoUrls.length} photos | ${dog.sourceUrl}`,
      )
    }
    if (unique.length > shown.length) {
      console.log(`…and ${unique.length - shown.length} more (use --limit 0 to print all)`)
    }
  }
  console.log(
    '\nPhase 0–1: no rows were written to Supabase. Import happens through the admin import queue (Phase 1).',
  )
}

main().catch((error) => {
  console.error('ERROR:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
