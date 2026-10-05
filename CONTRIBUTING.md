# Contributing to DOGSRUN

## Setup

```bash
npm install
cp .env.example .env.local   # fill in real values, ask the project owner for keys
npm run dev                  # → http://localhost:3000
```

## Workflow

No long-lived `dev` branch — branch straight off `main`, one logical change per branch:

```bash
git checkout main
git pull
git checkout -b feat/short-description   # feat/, fix/, chore/, refactor/
# make the change, verify locally
git push -u origin feat/short-description
# open a PR, check the Vercel preview URL, merge once green
```

Vercel auto-deploys `main` to https://dogsrun.org within about a minute of merge.

## Before opening a PR

- `npm run lint`
- `npx tsc --noEmit`
- `npx tsx src/lib/matching.test.ts` if you touched `src/lib/matching.ts`
- `npm test` if your change touches auth, routing, or an API route. Needs `npm run dev` running and `.env.local` pointed at Supabase (ask the project owner). There is currently only one Supabase project, so **tests run against production data**. They clean up after themselves, but don't interrupt a run halfway.
- Don't run `npm run seed` for now: it creates non-test orgs and can email real rescues (see `docs/audit-2026-10.md` H1).

CI only runs lint, typecheck and build, so the test steps above are on you.

## Pre-commit hook

`.husky/pre-commit` blocks commits that change `package.json` dependencies or add `console.*` / `debugger` lines. If you think you need a new dependency, raise it with the project owner first. Its ESLint step doesn't currently run, so run `npm run lint` yourself.

## Project conventions

See [`CLAUDE.md`](./CLAUDE.md) for route architecture, auth patterns, and the design system, and [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for how the system fits together. Known bugs are in [`docs/audit-2026-10.md`](./docs/audit-2026-10.md); check it before "fixing" something that looks wrong. The critical patterns listed there (org lookup by `id` not `email`, service-role writes, HTML-escaping in emails, etc.) are not optional — PRs that violate them will be asked to change.

## Picking up an issue

Open issues are labeled by type (`bug`, `enhancement`, `tech-debt`, `testing`, `audit`). Comment on the issue before starting work so two people don't duplicate effort.
