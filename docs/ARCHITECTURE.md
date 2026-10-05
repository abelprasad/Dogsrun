# DOGSRUN — Architecture & System Reference

Generated from a full read of the codebase (October 2026). Describes what the code **does today**, not what it should do. Known problems are in [`audit-2026-10.md`](./audit-2026-10.md).

---

## 1. What it is

Shelters list dogs → DOGSRUN matches each dog against every rescue's saved criteria → matched rescues get an email with a one-click "Interested" link → the shelter gets emailed the rescue's contact details. Orgs must upload a 501(c)(3) letter and be approved by an admin before they can use the product.

## 2. Stack & runtime

| Layer | Tool | Notes |
|---|---|---|
| Framework | Next.js **16.2.4** (App Router), React 19.2 | `src/proxy.ts` is the Next 16 name for middleware |
| DB / Auth / Storage | Supabase (single project `tnaddnxudfegrsbpgfwq`) | No migrations or RLS policies in the repo |
| Email | Resend 6, sender `alerts@dogsrun.org` | Inline HTML templates in route files |
| Rate limit | Upstash Redis | Only `/api/contact` (5/15m) and `/api/register` (3/h); no-ops when env unset |
| Monitoring | Sentry (client, server, edge, replay-on-error, tunnel `/monitoring`) | |
| Styling | Tailwind 4, hard-coded hex colors | No shared UI primitives |
| Image handling | `browser-image-compression` (client), `next/image` with `unoptimized` everywhere | |
| Tests | Playwright (`tests/`), assert-based `src/lib/matching.test.ts` | CI runs neither |
| CI | GitHub Actions: `tsc`, `eslint`, `next build` with placeholder env | |
| Hosting | Vercel; `main` auto-deploys to dogsrun.org | DNS on Cloudflare |

## 3. Directory map

```
src/
  proxy.ts                 auth gate for /dashboard/* (redirects to /auth/login?redirect=…)
  instrumentation*.ts      Sentry bootstrap
  sentry.{server,edge}.config.ts
  lib/
    auth-context.ts        getAuthContext / requireAuthContext / dashboardPathFor
    supabase.ts            browser client (anon key)
    supabase-server.ts     server client (anon key + cookies)
    matching.ts            dogMatchesCriteria, dogAgeRange, dogSizeClass  (+ matching.test.ts)
    html.ts                escapeHtml / escapeHtmlOrDash for email templates
    ratelimit.ts           Upstash limiters with allow-all fallback
    us-states.ts           50 states + DC
  components/              navbar, status-badge, euthanasia-countdown, approval-wall,
                           breed-select, color-picker, state-select, state-multi-select,
                           browse-state-filter
  app/
    layout.tsx             root: fonts, metadata, <Navbar/> + footer (applies to EVERY route)
    global-error.tsx       Sentry capture
    (public)/              /, /about, /faq, /contact, /merch, /register, /responded,
                           /dogs (browse: dogs|shelters|rescues tabs), /dogs/[id]
    auth/                  /auth/login, /auth/reset-password, /auth/update-password,
                           /auth/callback (PKCE code exchange), /auth/confirm (token_hash OTP)
    dashboard/             shelter + rescue app (layout requires an org row)
    admin/                 admin portal (layout requires admins row)
    api/                   route handlers (below)
scripts/seed-test.ts       authenticated smoke test against the real DB
tests/                     e2e.spec.ts (UI smoke), api-security.spec.ts (authz)
docs/                      SOP.md, ux-audit-2026-07.md, this file, audit-2026-10.md
```

## 4. Data model (inferred from queries — no schema in repo)

**organizations** — one row per org account; `id` = Supabase auth user id.
`id, name, email, city, state, type ('shelter'|'rescue'), approval_status ('pending'|'approved'|'rejected'), is_active, is_test, tax_doc_url (storage path, not a URL), created_at`

**admins** — `id, email`. Admin status is looked up **by email**, independent of organizations.

**dogs** — `id, dogsrun_id, shelter_id → organizations.id, name, breed, mix, age_years, weight_lbs, sex ('male'|'female'|'unknown'), color text[], state, description, photo_url, status, parvo, tripod, blind, other_issues, other_issues_notes, intake_date, euthanasia_date, created_at`
Status values: `available, urgent, pending, rescue_requested, placed, adopted, deceased, transferred`. Public pages only show `available` and `urgent`.

**rescue_criteria** — one per rescue (upsert `onConflict: rescue_id`).
`id, rescue_id, breeds[], colors[], age_ranges[], size_classes[], sex_preference ('any'|'male'|'female'), accepts_mixes, states_served[], accepts_parvo, accepts_tripod, accepts_blind, accepts_other, is_active`

**alerts** — one per (dog, rescue); unique on `(dog_id, rescue_id)`.
`id, dog_id, rescue_id (FK alerts_rescue_id_fkey), criteria_id, status ('sent'|'responded'|'declined'), sent_at`

**Storage buckets** — `dog-photos` (public, path `{uuid}/{original filename}`), `tax-docs` (private, path `{user_id}/501c3.pdf`, viewed via 120s signed URL).

## 5. Auth & authorization model

- **Session**: Supabase cookies via `@supabase/ssr`. `proxy.ts` refreshes the session and redirects anonymous users away from `/dashboard/*` only.
- **Org users**: `getAuthContext()` loads `organizations` by `id = user.id` plus an `admins` lookup by email. `dashboard/layout.tsx` redirects users without an org to `/admin` (admins) or `/register`.
- **Approval**: `/dashboard` and `/dashboard/rescue` render `<ApprovalWall>` unless `approval_status = 'approved'`. Other dashboard pages do **not** check approval (see audit).
- **Admins**: `admin/layout.tsx` calls `requireAuthContext()` and redirects non-admins. Each `/api/admin/*` route re-checks the `admins` table itself. `admin/page.tsx` relies on the layout.
- **Writes**: most writes go through API routes with the service-role key. Exceptions that use the browser client and rely on RLS: dog **insert** (`new-dog-form.tsx`), rescue criteria **upsert** (`criteria-form.tsx`), storage uploads (photos, tax docs).

### Route-level access

| Route | Who | Check |
|---|---|---|
| `/dashboard` | approved shelter | layout + page (rescue → `/dashboard/rescue`) |
| `/dashboard/dogs`, `/dogs/new`, `/dogs/[id]/edit` | shelter (owner for edit) | page checks `type`, not approval |
| `/dashboard/dogs/[id]` | owner shelter, admin, or rescue with an alert for the dog | page |
| `/dashboard/rescue` | approved rescue | page |
| `/dashboard/criteria` | rescue | page |
| `/dashboard/welcome` | any org | page; redirects once a dog/criteria exists |
| `/dashboard/admin` | — | redirect to `/admin` |
| `/admin` | admin | layout only |

## 6. API surface

| Method & path | Auth | Purpose |
|---|---|---|
| `POST /api/register` | none (rate-limited); verifies `user_id` ↔ email via admin API and that the tax doc exists | create `organizations` row (pending), email all admins |
| `POST /api/contact` | none (rate-limited) | email admin@dogsrun.org |
| `POST /api/dogs/update` | owner shelter | update whitelisted `EDITABLE_DOG_FIELDS`, validates sex/status/age/weight/color |
| `POST /api/alerts` | approved owner shelter or admin | run matching for one dog, insert alerts, email each new match |
| `POST /api/alerts/respond` | rescue that owns the alert | set alert status; on `responded` email the shelter |
| `GET /api/respond?alert_id&action` | **none** (link in alert email) | set alert status; on `interested` email the shelter; redirect to `/responded` |
| `POST /api/notify-shelter` | rescue owning the alert, or admin | email shelter (unused by the app; issue #19) |
| `PATCH /api/admin/orgs` | admin | toggle `is_active` |
| `POST /api/admin/orgs/approve` | admin | approve/reject, email the org; on rescue approval send a match digest |
| `POST /api/admin/orgs/digest` | admin | send a match digest to an approved rescue, upsert alerts |
| `POST /api/admin/orgs/signed-url` | admin | 120s signed URL for a tax doc |
| `PATCH /api/admin/dogs` | admin | set status / euthanasia_date |
| `DELETE /api/admin/dogs` | admin | delete a dog's alerts, then the dog |
| `GET /auth/callback` | — | exchange PKCE code; admin-only users → `/admin`, else `?next` (default `/dashboard/welcome`) |
| `GET /auth/confirm` | — | verify `token_hash` OTP; recovery → `/auth/update-password` |

## 7. Core flows

### Registration
1. `/register` (client): `supabase.auth.signUp` → upload PDF to `tax-docs/{uid}/501c3.pdf` from the browser (avoids Vercel timeouts) → `POST /api/register` → `signInWithOtp` (second email).
2. API verifies the auth user's email matches, the file exists, and no org exists; inserts `approval_status = 'pending'`; emails every row in `admins`.
3. Admin approves in `/admin` → approval email; approved rescues with criteria already saved also get a digest.

### Dog intake → matching → alerts
1. Shelter submits `/dashboard/dogs/new`: compress + upload photo, **insert dog via the browser client**, then fire-and-forget `POST /api/alerts`.
2. `/api/alerts` loads all `rescue_criteria` where `is_active`, skips: the shelter itself, unapproved orgs, `is_test` orgs, rescues already alerted for this dog. Runs `dogMatchesCriteria`.
3. For each match: insert `alerts` row (`sent`) then send an email with an **Interested** link → `GET /api/respond?alert_id=…&action=interested`.
4. "Resend Alerts" (shelter edit page and admin dogs table) re-runs step 2; only rescues not yet alerted get emailed.
5. Editing a dog (`/api/dogs/update`) does **not** re-run matching.

### Matching rules (`src/lib/matching.ts`)
- Special needs: a dog flagged parvo/tripod/blind/other is rejected unless the matching `accepts_*` is truthy (null = reject).
- Breed: case-insensitive **substring** — criteria `"lab"` matches dog `"Labrador Retriever"`. Empty list = any.
- Color: any overlap; empty criteria or uncolored dog = pass.
- Age: `puppy <1`, `youth <2`, `adult <8`, `senior 8+`. Unknown (or 0) age = pass.
- Size: `xsmall <20`, `small <30`, `medium <50`, `large <90`, `xlarge 90+` lbs. Unknown weight = pass.
- Sex: `any`/null = pass, else exact.
- Mix: rejected only if `accepts_mixes === false` (null = accept).
- State: matches `dog.state` against `states_served`; empty list **or dog without a state** = pass.

### Rescue response
- From email: `GET /api/respond` (no login). From portal: `AlertActions` → `POST /api/alerts/respond`. `responded` emails the shelter with the rescue's name and email. A rescue can undo a pass, but not an interest.

### Digest
- Same logic in `approve/route.ts` (`sendRescueApprovalDigest`) and `digest/route.ts`: all dogs with `status = 'available'`, run matching, upsert alerts (`ignoreDuplicates`), send one summary email.

## 8. Email inventory

| Trigger | To | File |
|---|---|---|
| New registration | all admins | `api/register/route.ts` |
| Contact form | admin@dogsrun.org | `api/contact/route.ts` |
| Dog match | rescue | `api/alerts/route.ts` |
| Rescue interested | shelter | `api/respond`, `api/alerts/respond`, `api/notify-shelter` (three copies) |
| Approved / rejected | org | `api/admin/orgs/approve/route.ts` |
| Match digest | rescue | `approve/route.ts`, `digest/route.ts` (two copies) |
| Signup confirm, magic link, password reset | user | Supabase Auth templates (not in repo) |

All templates interpolate user data through `escapeHtml`/`escapeHtmlOrDash`, with the exceptions listed in the audit. `resend.emails.send` never throws; it returns `{ error }`, which no call site checks.

## 9. Configuration

`.env.local` (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL/TOKEN` (optional), `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`.
Hard-coded: production origin `https://dogsrun.org` in every email link, the Supabase hostname in `next.config.ts`, admin inbox `admin@dogsrun.org`.

## 10. Testing & tooling

- `npm test` runs Playwright against `localhost:3000` **and the Supabase project in `.env.local`**. There is one Supabase project, so tests write to production data (they clean up after themselves).
- `npx tsx src/lib/matching.test.ts` runs the matching assertions (no npm script).
- `npm run seed` runs `scripts/seed-test.ts`, an end-to-end smoke test that creates real users, orgs and dogs and calls `/api/alerts`.
- `.husky/pre-commit`: blocks dependency changes and `console.*`/`debugger` in staged code; its ESLint step never runs (see audit).
- CI: typecheck, lint, build. No tests.
