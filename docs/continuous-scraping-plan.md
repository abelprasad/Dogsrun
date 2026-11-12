# DOGSRUN Continuous Scraping Plan

> Status: Phase 0–1 implementation in progress in detached worktree
> `/home/abel/dogsrun-scrape` (do NOT merge to main, do NOT deploy yet).
> Scope note (Abel, Nov 11, 2026): legality is out of scope for this plan.
> Focus is the technical agent-scraping route.

## 1. Goal

DOGSRUN (dogsrun.org) matches shelter dogs with rescues. Today shelters enter
dogs by hand in the dashboard (`src/app/dashboard/dogs/new/`). That is slow,
stale, and the reason rescues do not trust the list. Continuous scraping keeps
the list fresh without hand entry: scrape the shelters that actually hold dogs
in kennels, import new dogs into an approval queue, sync status every 6 hours,
and hide dogs that are adopted or gone.

Steven (project owner) confirmed the direction: **scrape shelters, not
rescues** — shelters are the ones with dogs in kennels. Goal is a resource
that signs up rescues.

## 2. Current system (verified Nov 11, 2026, main @ 0f06ebb)

- Stack: Next.js 16 App Router, React 19, TypeScript, Supabase
  (Postgres + Storage + Auth), Resend, Upstash Redis, Vercel, Playwright 1.59
  (devDependency), vitest (`npm run test:unit` includes `src/**/*.test.ts`).
- Route trees: `(public)` (public pages, Navbar + footer), `dashboard/`
  (shelter + rescue dashboards), `admin/` (standalone admin portal, own top
  bar, checks `admins` table by email), `auth/`.
- Dogs are created today by an org user in `new-dog-form.tsx`, inserting
  directly into `dogs` via the browser Supabase client. Fields:
  `name, breed, mix, age_years, weight_lbs, sex, color[], state,
  description, parvo, tripod, blind, other_issues, other_issues_notes,
  intake_date, euthanasia_date, shelter_id (= org id), status, photo_url`.
  After insert it POSTs `/api/alerts` (`{ dog_id }`) to notify rescues.
- Statuses (`src/lib/dog-status.ts`): `available, urgent, pending,
  rescue_requested, placed, adopted, deceased, transferred`.
- Critical patterns (do not violate): all writes go through API routes using
  the service-role key — RLS blocks browser writes; public Server Components
  joining `organizations` must use the service-role client; org lookup always
  `.eq('id', user.id)`; dog updates only pass `EDITABLE_DOG_FIELDS`.
- No Supabase migrations live in the repo. Schema is managed outside the
  repo — new migrations are files only, never run against live Supabase in
  this phase.
- Admin portal exists (`src/app/admin/`) with dogs/org tables. The import
  queue is a new admin surface, not a replacement for the existing tables.

## 3. Sources (priority order)

| Priority | Source | How | Why this order |
|---|---|---|---|
| 1 | ACCT Philly (111 W Hunting Park Ave) | Shelterluv embed listing, Playwright adapter | Only open-intake shelter in Philly, ~20k animals/yr, dogs in kennels, Steven's explicit pick |
| 2 | PSPCA (350 E Erie Ave) | Petango listing/detail pages, Playwright adapter | Large Philly shelter, Petango IDs (e.g. 52685166) |
| 3 (parallel) | Petfinder API v2 | OAuth2 `GET /v2/animals`, official feed | Structured data, status + photos + `published_at`, 1,000 req/day, 50/sec. Needs an API key Abel/Steven must obtain. Not a scraper — a parallel feed, same normalized type |
| Later | Other Philly shelters (PAWS, Morris) | Site adapter each, only if missing from Petfinder | One adapter per shelter, only after ACCT + PSPCA prove the loop |

Geography: Philadelphia only for the pilot. Wider PA/NJ only after the
pilot hits its metrics.

## 4. Adapter interface

Every source implements the same interface, so the sync engine never knows
which site a dog came from:

```ts
interface ShelterAdapter {
  source: 'acct-shelterluv' | 'pspca-petango' | 'petfinder-api';
  shelterName: string;
  listDogs(): Promise<ScrapedDog[]>;   // paginate until empty, polite delay
  fetchDog(id: string): Promise<ScrapedDog | null>; // single-ID re-check
}
```

Rules for every adapter:

- Playwright, headless, one browser, one context, realistic user agent.
- Polite delay between pages (≥ 1s), max ~50 pages per run per source.
- Stop the run on HTTP 403 / 429 / CAPTCHA / bot challenge. Log it, do not
  retry in the same run, do not solve CAPTCHAs. A blocked run is a failed
  sync, not an empty import.
- Never import from a run that returns zero dogs if the previous run
  returned dogs — that is a site change or a block, not an empty shelter.
- Health check per adapter: last run time, dogs seen, dogs new, errors.
  If an adapter returns zero dogs twice in a row, flag it for a human.

## 5. Normalized dog schema

`src/lib/scraping/types.ts` — `ScrapedDog`. Everything maps into the
existing `dogs` table fields; nothing new is invented on the dog row.

```ts
type ScrapedDog = {
  source: string;          // 'acct-shelterluv' | 'pspca-petango' | 'petfinder-api'
  sourceId: string;        // stable ID on the source site (e.g. 'ACCT-A-264698')
  sourceUrl: string;       // canonical listing URL, for the approval queue
  name: string;
  breed: string;
  mix: boolean;
  ageYears: number | null; // parsed from '2 years', '6 months', '8 weeks'
  weightLbs: number | null;
  sex: 'male' | 'female' | 'unknown';
  color: string[];
  description: string;
  photoUrls: string[];     // store URLs, do NOT re-host photos in this phase
  status: 'available' | 'adopted' | 'unavailable'; // source status, mapped later
  intakeDate: string | null;
  euthanasiaDate: string | null; // ACCT urgent dogs only, when shown
  scrapedAt: string;       // ISO timestamp of this scrape
}
```

Normalization rules (unit-tested, with fixture HTML):

- Age: "2 years" → 2, "6 months" → 0.5, "8 weeks" → 0.15, unparseable → null.
- Sex: male/female/unknown only; anything else → unknown.
- Breed: as listed; "Mixed Breed" / "Mix" → `mix: true`, breed = base breed.
- Photos: keep source URLs in `photoUrls`; the first becomes `photo_url`
  on approval. No downloading/re-hosting in Phase 0–1.
- Description: strip HTML, trim, cap at 2,000 chars.
- Missing name → skip the dog and log it; a nameless row is not importable.

## 6. Dedup

`src/lib/scraping/dedup.ts`. Two layers, never auto-merge a fuzzy match.

1. **Exact:** `UNIQUE (source, source_id)` on the import queue / dogs.
   Same source + same source ID = same dog, always. Upsert on re-scrape.
2. **Fuzzy (human-only):** candidate if same shelter AND
   `name` (case-insensitive, trimmed) + `breed` + `sex` match AND age
   within 0.5 years. Photo URL overlap strengthens it. Fuzzy candidates go
   to the approval queue flagged `possible_duplicate_of`, and a human decides
   merge / keep-both / reject. The agent never merges.

Cross-source duplicates (same dog on ACCT + Petfinder) are expected and
structural — there is no universal dog ID. They are surfaced as fuzzy
candidates, not silently deduped.

## 7. Approval queue

New table `import_queue` (migration file only, Phase 0–1):

```sql
create table import_queue (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_id text not null,
  source_url text not null,
  shelter_id uuid references organizations(id),
  payload jsonb not null,          -- the normalized ScrapedDog
  status text not null default 'pending_review', -- pending_review | approved | rejected | possible_duplicate
  possible_duplicate_of uuid references dogs(id),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source, source_id)
);
create table sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  dogs_seen int not null default 0,
  dogs_new int not null default 0,
  dogs_updated int not null default 0,
  dogs_removed int not null default 0,
  status text not null default 'running', -- running | ok | failed | blocked
  error text
);
```

- Route: `/admin/import-queue` (admin-only, same admin auth as the rest of
  `/admin`). Lists pending dogs with photo, name, breed, age, sex, source,
  source URL, and duplicate flag. Approve → creates the `dogs` row
  (`shelter_id` = matched org, `status: 'available'`, `photo_url` = first
  photo) and fires the same `/api/alerts` POST the manual form fires.
  Reject → status `rejected`, kept for audit, never re-queued unless the
  source data changes.
- RLS: admin-only read/write. All writes through API routes with the
  service-role key, per repo rules.
- Resend digest (Phase 1): daily summary to admins of pending queue size.
  Reuse the existing digest route pattern (`/api/admin/orgs/digest`).

## 8. Sync schedule — every 6 hours

- Cadence: `0 */6 * * *` (00:00, 06:00, 12:00, 18:00 ET).
- Vercel Hobby cron cannot do this (once/day max) — do not use it.
- Recommended: Supabase pg_cron + pg_net → Edge Function that runs the
  sync, or a small scheduled service on indra hitting an internal API
  route. Decision is Abel/Steven's; the sync engine is scheduler-agnostic
  (one function, `runSync(source)`, callable from either).
- Each run writes a `sync_runs` row: seen / new / updated / removed /
  status / error. A run that fails or is blocked writes the row and stops —
  it never marks dogs stale on a failed run.

## 9. Stale / adopted handling (tombstones, never hard-delete)

- A dog seen in run N but missing in run N+1 is **not** deleted.
  1 missed run → `stale_check`: single-ID re-check via `fetchDog(id)`.
  Still missing after re-check → status `adopted` if the source says
  adopted, otherwise `transferred`, and the public listing is hidden.
  2 missed runs → `removed_stale`, hidden, kept in the DB.
- Never hard-delete a `dogs` row. Rescues, alerts, and audit history point
  at it. Tombstone statuses are the record.
- A dog that reappears after being marked stale returns to `available`
  on the next successful scrape (upsert by source + source_id).

## 10. Metrics (targets for the pilot)

- Stale live dogs < 5% of listed dogs.
- Adopted-to-hidden median < 12 hours.
- Sync success ≥ 95% of scheduled runs.
- Approval queue turnaround < 48 hours.
- Residual duplicates < 2% of listed dogs.
- 2 of 2 pilot shelters live by end of Phase 1.

## 11. Phases

- **Phase 0 (this worktree):** plan (this file), normalized types,
  ACCT Shelterluv Playwright adapter, dedup, `import_queue` + `sync_runs`
  migrations (files only), CLI `scripts/scrape-acct.ts` with `--dry-run`
  default (prints what it would import, imports nothing), vitest unit
  tests for dedup + normalization with fixture HTML, README section.
- **Phase 1:** approval queue UI + API routes, PSPCA adapter, Petfinder
  API feed (needs key), Resend digest, run the pilot on staging.
- **Phase 2:** 6-hour pg_cron sync, stale/adopted lifecycle, metrics
  dashboard for Steven.
- **Phase 3:** additional shelter adapters, one at a time, only for
  shelters missing from Petfinder.

## 12. What still needs Abel / Steven

- Petfinder API key (Phase 1).
- Shelter list confirmation: ACCT + PSPCA for the pilot, or a different pair.
- Approval to merge the worktree to main and deploy (nothing in this
  phase merges or deploys).
- Decision: pg_cron vs indra scheduler for the 6-hour sync.
