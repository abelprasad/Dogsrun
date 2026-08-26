# DOGSRUN

Shelter-to-rescue dog placement platform. Live at dogsrun.org.

## Stack

Next.js 15 (App Router), TypeScript, Supabase (Postgres + Storage + Auth), Resend (email), Upstash Redis (rate limiting), Sentry, Playwright.

## Route architecture

Three separate route trees, each with its own layout, no shared nav/footer bleed:

- `src/app/(public)/` — public pages, has `<Navbar />` + footer
- `src/app/dashboard/` — shelter + rescue dashboards, has `<DashboardNav>`
- `src/app/admin/` — standalone admin portal, independent of org auth, own top bar
- `src/app/auth/` — login/reset/callback, bare layout

Root `layout.tsx` is a minimal shell only (metadata, fonts, body).

## Auth

Centralized in `src/lib/auth-context.ts`. Always use `getAuthContext()` (no redirect) or `requireAuthContext()` (redirects to `/auth/login`). Never roll a custom session fetch in a page file.

Admin auth is separate from org auth: checks the `admins` table by email, no org row needed or expected. Don't create admin accounts via `/register`, that creates an org row and breaks their routing. See vault DOGSRUN/CONTEXT.md for the full add-new-admin SQL steps.

## Critical patterns (do not violate)

- Org lookup: always `.eq('id', user.id)`, never `.eq('email', ...)`
- All writes go through API routes using the service role key — RLS blocks browser client writes
- Public Server Components that join `organizations` must use the service role client — anon client returns null due to RLS
- `setAll` in the server Supabase client must be wrapped in try/catch
- `next/headers cookies()` and `searchParams` must both be awaited (Next.js 15)
- Email templates always go through `escapeHtml`/`escapeHtmlOrDash` from `src/lib/html.ts`, never raw string interpolation
- Dog update API (`/api/dogs/update`) only ever passes fields in `EDITABLE_DOG_FIELDS` — never spread the full request body
- `DashboardNav` is a client component (`usePathname`) — no server-only imports in it

## Design system

Two-tier aesthetic, don't mix them:

- **Public + Admin** — dark editorial. `bg-[#111]`/`bg-[#13241d]`, headline `text-[#f4b942]`, body `bg-[#f5f0e8]`, cards `bg-[#fff9ef]` with thin dark outline, no rounded corners, uppercase buttons.
- **Dashboard** — soft internal. White/cream, `rounded-xl`, `border-gray-200`, amber `#f59e0b`.

## Testing

Playwright e2e + API security specs in `tests/`. Run before any PR that touches auth, routing, or API routes.

## Where deeper context lives

Full project history, known bugs/gotchas, digest system internals, data source integration plan, and DB state snapshots live in the Obsidian vault at `100 - Projects/DOGSRUN/` (CONTEXT.md, HANDOFF.md, LEARNINGS.md, TODO.md). This file stays intentionally short — pull from the vault notes when a task needs that depth, don't duplicate it here.
