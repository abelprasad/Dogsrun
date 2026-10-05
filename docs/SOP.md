# DOGSRUN — Standard Operating Procedures

This doc covers two things: how to run the platform day-to-day (approving orgs, adding admins), and what to do when something breaks. It's written for both non-technical admins (Steven, Amy) and developers — sections marked **For developers** need a GitHub/Vercel/Supabase login and code knowledge; everything else just needs the admin portal at [dogsrun.org/admin](https://dogsrun.org/admin).

---

## Part 1 — Day-to-Day Operations

### Approving a new shelter or rescue

1. Log in at dogsrun.org/admin
2. The **Organizations** tab shows pending approvals at the top
3. Open their uploaded 501(c)(3) document and confirm it's real and current
4. Click **Approve** or **Reject** — an email goes out to them automatically either way
5. Once approved, a shelter can add dogs and a rescue can set matching criteria
6. If you approve a rescue that has **already** saved matching criteria, they also get an automatic digest of matching dogs. Rescues that set criteria after approval get nothing until a new dog is added, so send them a Digest (below) once their criteria are in.

### Deactivating an organization

The **Deactivate** button in the Organizations tab currently only changes a label. It does **not** stop alerts, hide their dogs, or block their login (tracked in `docs/audit-2026-10.md`, H5). To actually stop an org, ask a developer to set their `approval_status` to `rejected` in Supabase.

### Adding a new admin

Admin-only users do **not** register through the normal sign-up form — that would incorrectly create an organization for them.

1. **For developers:** insert their email into the `admins` table in Supabase:
   ```sql
   INSERT INTO admins (email) VALUES ('newperson@example.com');
   ```
2. In the Supabase dashboard → Authentication → Users → **Invite user**, enter their email. This sends them a login link automatically.
3. They set a password on first login and are taken straight to `/admin`.

### Sending a rescue their available matches manually (Digest)

Matching happens automatically **only when a shelter adds a new dog**. It does not run when a rescue saves or changes its criteria, or when a shelter edits a dog (changing status back to available, adding a euthanasia date, etc.). So a rescue that just set up its criteria won't hear about dogs that were already listed until you push a digest:

1. Admin portal → **Organizations** tab → find the rescue → click **Digest**
2. This checks every dog with status **Available** against their criteria and emails them one summary of all matches. Dogs marked **Urgent** are currently left out of digests (audit M3); use the dog's **Resend Alerts** button for those.
3. It won't create duplicate alert records, but every click sends the full summary email again, so click once.

For a single dog that was edited after it was listed, use **Resend Alerts** (admin Dogs tab, or the shelter's dog edit page). It only emails rescues that haven't already been alerted about that dog.

### "This rescue/shelter says they're not getting any alerts"

This has happened before and the cause was almost always the same thing: **the organization was registered as the wrong type** (a rescue accidentally set up as a shelter, or vice versa). This fails completely silently — no error, just zero matches.

**For developers**, to check and fix:
1. Look up the org in the `organizations` table in Supabase
2. Confirm whether `type` should be `shelter` or `rescue` based on what they actually do
3. If it's wrong:
   ```sql
   UPDATE organizations SET type = 'rescue' WHERE id = '...';  -- or 'shelter'
   ```
4. If they had dogs listed incorrectly (a rescue with dog rows, which shouldn't happen), clear those out
5. Tell the org to (re)set their matching criteria if they're a rescue, then consider running a manual Digest for them (see above)

### A dog needs an urgent euthanasia-date update

Shelters can update this themselves on the dog's edit page in their dashboard. Admins can also do it directly from the **Dogs** tab in the admin portal — the dog automatically gets an "at-risk" or "critical" badge as the date approaches. Known quirk: the countdown treats the date as midnight UTC, so on the East Coast a dog shows "Past Due" from about 8pm the evening **before** its date (audit M7).

Setting or changing a euthanasia date sends no emails. Rescues already alerted about the dog aren't told it became urgent, so contact the interested ones directly if time is short.

---

## Part 2 — Incident Response

### Something feels broken — where to look first

| Symptom | Check here |
|---|---|
| Site won't load at all | [Vercel dashboard](https://vercel.com) — is the latest deploy green? |
| Errors happening in the app | [Sentry](https://dogsrun.sentry.io) — new errors show up here in real time |
| Emails not sending | [Resend dashboard](https://resend.com) — check delivery logs |
| Something wrong with data (dogs, orgs, alerts) | [Supabase dashboard](https://supabase.com/dashboard/project/tnaddnxudfegrsbpgfwq) |

If you're not sure which of these applies, start with Sentry — most issues show up there with a stack trace, even for non-developers it usually names the page or feature that broke.

### The site is completely down

**For developers:**
1. Check the [Vercel dashboard](https://vercel.com) — look at the latest deployment for `main`. If it failed, the previous good deployment is still serving traffic, so this usually isn't a full outage.
2. If a bad deploy did go live, redeploy the last known-good commit from the Vercel dashboard ("Redeploy" on an older deployment), or revert the commit on `main` and push.
3. Check Supabase status (status.supabase.com) — an outage on their end will look like a Dogsrun outage.

### Alert emails aren't going out

**For developers:**
1. Check Resend's dashboard for delivery failures or bounces first. This is the only place email failures show up: the app doesn't check Resend's response, so a failed send produces no Sentry error, and the alert is still recorded as "sent" in Supabase (audit H3).
2. Confirm `RESEND_API_KEY` is still valid in Vercel's environment variables.
3. Check Sentry for errors thrown inside `/api/alerts` — if the matching logic itself is throwing, no emails will send at all even though the dog/rescue data looks fine.
4. If a specific rescue isn't getting matches at all (but others are), see "wrong org type" above before assuming it's a system-wide issue. Also check their criteria: an empty breed list matches all breeds, but a breed spelled differently from the shelter's (e.g. "German Shepherd Dog" vs "German Shepherd") won't match.
5. A rescue whose alert email failed won't be retried by **Resend Alerts**, because the app thinks they were already alerted. A developer has to delete that row from the `alerts` table first.

### Login is broken for everyone

**For developers:**
1. Check Supabase Auth status — Authentication → Users, confirm the service is responding
2. Check `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct and unexpired in Vercel
3. Check Sentry for errors in `auth-context.ts`, `auth/login`, or `auth/callback`

### Who to contact

- **Product / org questions (approvals, org type, non-technical issues):** Steven Gandia — stevengandia@gmail.com
- **Technical issues (bugs, outages, deploys):** Abel Prasad — abel@dogsrun.org
- **Admin access issues:** either of the above can invite/remove admins in Supabase

---

*Keep this file up to date — if you fix something that wasn't covered here, add it so the next person doesn't have to rediscover it.*
