# DOGSRUN

Shelter-to-rescue dog placement platform. Live at dogsrun.org.

## Stack

Next.js 16 (App Router; middleware lives in `src/proxy.ts`), React 19, TypeScript, Supabase (Postgres + Storage + Auth), Resend (email), Upstash Redis (rate limiting), Sentry, Playwright.

## Route architecture

Route trees, each with its own layout:

- `src/app/(public)/` — public pages
- `src/app/dashboard/` — shelter + rescue dashboards, has `<DashboardNav>`; layout requires an org row
- `src/app/admin/` — standalone admin portal, independent of org auth, own top bar
- `src/app/auth/` — login/reset/update-password pages, `callback` + `confirm` route handlers
- `src/app/api/` — route handlers (see `docs/ARCHITECTURE.md` for the full list)

Known deviation: root `layout.tsx` currently renders `<Navbar />` + footer, so they show on every route (dashboard, admin, auth too). The intended design is Navbar + footer in `(public)/layout.tsx` and a minimal root shell. Don't add more shared chrome to the root layout.

## Auth

Centralized in `src/lib/auth-context.ts`. Always use `getAuthContext()` (no redirect) or `requireAuthContext()` (redirects to `/auth/login`). Never roll a custom session fetch in a page file. `proxy.ts` only gates `/dashboard/*`. Every page or route that reads with the service role must do its own auth check; don't rely on a layout alone.

Admin auth is separate from org auth: checks the `admins` table by email, no org row needed or expected. Don't create admin accounts via `/register`, that creates an org row and breaks their routing. To add a new admin: insert their email into the `admins` table, then invite them via Supabase Auth so they get a login.

Org gating: `approval_status` must be `'approved'` to use the product; `is_active` is set by admins but not yet enforced anywhere (see audit H5).

## Critical patterns (do not violate)

- Org lookup: always `.eq('id', user.id)`, never `.eq('email', ...)`
- All writes go through API routes using the service role key. Existing exceptions still write from the browser client and depend on RLS: dog insert (`new-dog-form.tsx`), rescue criteria upsert (`criteria-form.tsx`), storage uploads. Don't add more; move these to API routes when touching them.
- Public Server Components that join `organizations` must use the service role client — anon client returns null due to RLS
- `setAll` in the server Supabase client must be wrapped in try/catch
- `next/headers cookies()`, `params` and `searchParams` must all be awaited
- Email templates always go through `escapeHtml`/`escapeHtmlOrDash` from `src/lib/html.ts`, never raw string interpolation
- `resend.emails.send()` never throws, it returns `{ error }`. Check it.
- Dog update API (`/api/dogs/update`) only ever passes fields in `EDITABLE_DOG_FIELDS` — never spread the full request body
- Test orgs must have `is_test = true`, or alerts go to real rescues and the orgs show on the public site
- `DashboardNav` is a client component (`usePathname`) — no server-only imports in it

## Design system

Brand palette: dark green `#13241d`, gold `#f4b942`, cream body `#f5f0e8`, cards `#fff9ef`, accent `#d95f4b`, muted text `#5d6a64`.

- **Public + Admin** — dark editorial. `bg-[#13241d]` headers, headline `text-[#f4b942]`, body `bg-[#f5f0e8]`, cards `bg-[#fff9ef]` with thin dark outline, no rounded corners, uppercase tracked buttons.
- **Dashboard** — target is a softer internal tier (rounded corners). In practice most dashboard pages currently use the editorial style above; edit-dog and dog-profile pages use `rounded-lg`. Match the page you're editing; see `docs/ux-audit-2026-07.md` X1-X3 for the planned cleanup.
- The navbar still uses the older `#111` / `#f59e0b` shades (UX audit X2) — don't copy them into new code.

## Testing

- `npx tsx src/lib/matching.test.ts` — matching rules, no DB, run whenever `src/lib/matching.ts` changes.
- `npm test` — Playwright e2e + API security specs in `tests/`. Run before any PR that touches auth, routing, or API routes. Needs `npm run dev` running. **Writes to the Supabase project in `.env.local`, which is production** (cleans up after itself).
- `npm run seed` — end-to-end smoke script, also against production. Do not run until it marks its orgs `is_test` (audit H1).
- CI runs `tsc`, `eslint`, `next build` only.

## Deeper context

- `docs/ARCHITECTURE.md` — data model, API surface, flows, matching rules, email inventory
- `docs/audit-2026-10.md` — known bugs and gotchas, ranked
- `docs/ux-audit-2026-07.md` — UX/design findings
- `docs/SOP.md` — operations and incident response

The data source integration plan (issue #21) isn't in-repo; ask the project owner.
