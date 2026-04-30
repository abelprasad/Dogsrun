# DOGSRUN

Shelter-to-rescue dog matching platform. Shelters add dogs on intake, DOGSRUN automatically matches them against rescue organizations' criteria and sends instant email alerts.

## Live
- **Production:** https://dogsrun.net
- **Repo:** https://github.com/abelprasad/Dogsrun

## Stack
| Layer | Tool |
|---|---|
| Frontend | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Database + Auth | Supabase (PostgreSQL + RLS + Auth) |
| Email | Resend |
| Hosting | Vercel |

## Local Development
```bash
npm install
npm run dev
# → http://localhost:3000
```

Requires `.env.local` — see handoff doc for keys.

## Features
- Shelter dog intake with photo upload (Supabase Storage)
- Automatic rescue matching on intake
- Instant email alerts to matched rescues from `alerts@dogsrun.net`
- One-click Interested/Pass response links (no login required)
- Rescue portal with incoming alerts feed
- Editable matching criteria per rescue org
- End-to-end Playwright test suite

## Key URLs
- Supabase: https://supabase.com/dashboard/project/tnaddnxudfegrsbpgfwq
- Resend: resend.com
- DNS: Cloudflare (dogsrun.net)