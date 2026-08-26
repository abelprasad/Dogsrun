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
- `npm test` if your change touches auth, routing, or an API route (needs `.env.local` pointed at a real Supabase project — ask the project owner)

## Project conventions

See [`CLAUDE.md`](./CLAUDE.md) for route architecture, auth patterns, and the design system. The critical patterns listed there (org lookup by `id` not `email`, service-role writes, HTML-escaping in emails, etc.) are not optional — PRs that violate them will be asked to change.

## Picking up an issue

Open issues are labeled by type (`bug`, `enhancement`, `tech-debt`, `testing`, `audit`). Comment on the issue before starting work so two people don't duplicate effort.
