# DOGSRUN Scraping Sources Registry

Every place we scrape from, with its details, adapter status, and the
DOGSRUN account created for it. Keep this file updated when a source is
added, paused, or opted out. No credentials in this file, ever.

## How shelter accounts work

A DOGSRUN shelter account is NOT something Friday creates out of thin air.
The app's normal flow (`src/app/(public)/register/page.tsx` +
`src/app/api/register/route.ts`) is:

1. The shelter creates its own auth account at dogsrun.org/register with
   its own email and a password only it knows.
2. It uploads its 501(c)(3) determination letter (PDF, under 10 MB) to
   Supabase Storage `tax-docs/<auth-user-id>/501c3.pdf`.
3. That inserts an `organizations` row with `id = <auth-user-id>`,
   `type = shelter`, `approval_status = pending`.
4. An admin approves it at dogsrun.org/admin (Organizations tab), which
   emails the shelter. Only then can it add/manage dogs.

Why Friday cannot just insert an org row: `organizations.id` must equal a
real Supabase Auth user id, and the register route requires the tax-doc
upload plus an email that matches the auth user. Inserting a row with a
made-up id would create an org nobody can log into, and inventing a
password for a shelter would be a security failure.

What Friday CAN do (and what `scripts/invite-shelter-org.ts` does, once run
with real Supabase keys — see below): create the Supabase Auth user for the
shelter's real contact email via the admin API, generate a password-recovery
/ set-password link, and send it to the shelter. The shelter then sets its
own password and completes registration itself. Account status below is
therefore `pending-invite` until the shelter completes that step.

**Blocker, Nov 11, 2026:** the `.env.local` on indra is placeholder-only
(`https://placeholder.supabase.co`, keys literally `placeholder`). The real
Supabase keys live in Vercel production env only. No live org check and no
live invite could be run from indra. To run the invite script, first pull
real env (`vercel env pull` from a logged-in Vercel session) or set real
keys in a local `.env.local` — never commit them.

## Sources

### 1. ACCT Philly — LIVE (adapter built, dry-run verified)

- Full name: Animal Care & Control Team of Philadelphia (ACCT Philly)
- Address: 111 W Hunting Park Ave, Philadelphia, PA
- Phone: (267) 385-3800
- Contact email: not verified — use the Love Local Partnership program:
  https://acctphilly.org/acct-philly-love-local-partnership-program/
- Type: shelter (only open-intake shelter in Philadelphia, ~20,000 animals/yr)
- System: Shelterluv. Shelter ID **13458** (from `window.shelterId` on ACCT
  detail pages). Embed list `https://www.shelterluv.com/embed/animal/list`
  does NOT scope to ACCT on its own — it renders a different shelter
  (The Bond Between, 38131) — so the adapter reads the backing endpoint
  `GET /api/v3/available-animals/13458`.
- Adapter: `src/lib/scraping/adapters/acct.ts` — source `acct-shelterluv`
- Dry run (Nov 11, 2026): 142 dogs seen, 142 unique, 0 exact duplicates,
  3.8s. Example: `ACCT-A-235558` (Mellonade, Mixed Breed, 5.05y, 40 lbs,
  female, 14 photos).
- Data gaps: list records carry `weight_group` only, no exact weight
  (detail-only); `kennel_description` usually empty; euthanasia date is
  not exposed by the Shelterluv embed at all.
- DOGSRUN account: **pending-invite** — no org row exists that Friday could
  verify (live Supabase unreachable from indra, see blocker above), and no
  verified contact email on file.
- Needed to activate: (a) ACCT's real contact email, (b) run
  `scripts/invite-shelter-org.ts --email <acct-email> --name "ACCT Philly"`,
  (c) ACCT sets its own password via the link, completes /register with its
  501(c)(3) PDF, (d) admin approves at dogsrun.org/admin. Imported dogs
  then belong to that org (`dogs.shelter_id = <org id>`).

### 2. PSPCA — PLANNED (adapter not built yet)

- Full name: Pennsylvania SPCA
- Address: 350 E Erie Ave, Philadelphia, PA
- Phone: (215) 426-6300 ext 251
- Contact email: adoptions@pspca.org
- Type: shelter
- System: Petango. Example listing id 52685166 (Royal).
- Adapter: not built — Phase 1. Source name planned: `pspca-petango`.
- DOGSRUN account: **pending-invite** — same steps as ACCT, using
  adoptions@pspca.org. Do not invite until the PSPCA adapter exists and
  Steven confirms PSPCA is in the pilot.
- Needed to activate: PSPCA sets its own password via the invite link,
  completes /register with its 501(c)(3) PDF, admin approves.

### 3. Petfinder API v2 — PLANNED (parallel feed, not a shelter)

- What it is: official Petfinder feed, `GET https://api.petfinder.com/v2/animals`.
  OAuth2 client-credentials flow, token lasts 1 hour, 1,000 req/day, 50/sec.
  This is a feed, not a shelter — **no DOGSRUN shelter account is created
  for Petfinder**. Dogs arriving via Petfinder are attributed to their
  source organization on Petfinder (org id in the API response) and land in
  the approval queue like any other import.
- API key status: **none exists**. Checked Nov 11, 2026: no Petfinder keys in
  `.env.local` or `.env.example`, and no Vercel env was checked (no Vercel
  login on indra).
- How Abel gets one (he must do this himself — it is an account in his /
  DOGSRUN's name):
  1. Create a free Petfinder account at https://www.petfinder.com
     (sign in, register) if he does not have one.
  2. Go to https://www.petfinder.com/developers/ (or
     petfinder.com/user/developer-settings) and create an application.
  3. Petfinder issues a client ID (API key) and a client secret. Copy both.
  4. Store them only as `PETFINDER_CLIENT_ID` / `PETFINDER_CLIENT_SECRET`
     in Vercel env + local `.env.local` — never in git.
  5. Test with `POST https://api.petfinder.com/v2/oauth2/token` with
     `grant_type=client_credentials`.
- Adapter: not built — Phase 1, after the key exists. Source name planned:
  `petfinder-api`.

### 4. PAWS (Philadelphia Animal Welfare Society) — PLANNED, unverified

- Address: 100 N 2nd St, Philadelphia, PA (from prior research; re-verify
  before contacting).
- System / Petfinder presence: unverified. Do not scrape until confirmed
  in the Petfinder API or on its own site.
- DOGSRUN account: not started.

### 5. Morris Animal Refuge — PLANNED, unverified

- Address: 1242 Lombard St, Philadelphia, PA (from prior research; re-verify
  before contacting).
- System / Petfinder presence: unverified. Do not scrape until confirmed.
- DOGSRUN account: not started.

## Adding a new source (checklist)

1. Add a section above with address, phone, email, system, shelter ID,
   adapter status, and account status.
2. Build the adapter in `src/lib/scraping/adapters/<source>.ts` with a
   dry-run CLI and unit tests; verify live in dry-run only.
3. Invite the shelter with `scripts/invite-shelter-org.ts` (real Supabase
   env required); the shelter completes /register; admin approves.
4. Only then point the sync at the new source, with imported dogs owned by
   that org id.
