# DOGSRUN

Shelter-to-rescue dog matching platform. Shelters add dogs on intake, DOGSRUN automatically matches them against rescue organizations' criteria and sends instant email alerts.

## Live
- **Production:** https://dogsrun.org
- **Repo:** https://github.com/abelprasad/Dogsrun

## Stack
| Layer | Tool |
|---|---|
| Frontend | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Database + Auth | Supabase (PostgreSQL + RLS + Auth + Storage) |
| Email | Resend |
| Rate limiting | Upstash Redis |
| Monitoring | Sentry |
| Hosting | Vercel |

## Local Development
```bash
npm install
npm run dev
# → http://localhost:3000
```

Requires `.env.local` — copy `.env.example` and fill in real values. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full workflow.

## Production Monitoring
Sentry is wired for client, server, edge, App Router render errors, source maps, and error-session replay.

Set these in Vercel:
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

## Features
- Org registration with 501(c)(3) upload and admin approval
- Shelter dog intake with photo upload (Supabase Storage)
- Automatic rescue matching when a dog is added (edits don't re-match; use "Resend Alerts")
- Instant email alerts to matched rescues from `alerts@dogsrun.org`
- One-click "Interested" link in alert emails (no login required); rescues can also respond or pass from the portal
- Rescue portal with incoming alerts feed
- Editable matching criteria per rescue org
- Public browse pages for dogs, shelters and rescues
- Admin portal: approvals, org/dog management, match digests
- Playwright e2e + API security tests

## Docs
- [`CLAUDE.md`](./CLAUDE.md) — conventions and critical patterns
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — data model, API routes, flows, matching rules
- [`docs/audit-2026-10.md`](./docs/audit-2026-10.md) — known issues, ranked
- [`docs/SOP.md`](./docs/SOP.md) — operations and incident response
- [`docs/ux-audit-2026-07.md`](./docs/ux-audit-2026-07.md) — UX findings

## Key URLs
- Supabase: https://supabase.com/dashboard/project/tnaddnxudfegrsbpgfwq
- Resend: resend.com
- DNS: Cloudflare (dogsrun.org)
