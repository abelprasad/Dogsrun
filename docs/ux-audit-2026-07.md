# DOGSRUN UX Audit — July 2026

Audited from code only (no rendered pages). Items marked **NVC** = Needs visual confirmation before acting.

Files reviewed: dashboard (page, nav, layout), My Dogs, new/edit dog forms, rescue portal, alert-actions, criteria form, admin (page, tabs, org-table, dogs-table, layout), navbar, browse page, login, status-badge, breed-select, state-multi-select. Not yet reviewed in depth: homepage, about/faq/contact/merch, register, dog public profile, approval-wall, color-picker, euthanasia-countdown. These get a follow-up pass before their branches start.

---

## Findings

Severity: **C**ritical / **H**igh / **M**edium / **L**ow. Effort: S (<1h) / M (1-4h) / L (day+).

### Cross-cutting / design system

| # | Sev | Issue | Why it hurts | Fix | Effort |
|---|-----|-------|--------------|-----|--------|
| X1 | H | **Two clashing visual languages inside the dashboard itself.** New-dog form uses the flat editorial style (no radius, uppercase labels), edit-dog form uses `rounded-lg` cards, sentence-case labels, different input padding (`py-3` vs `py-2.5`), different label styles. Same user, same workflow, two different apps. | Shelter staff add a dog then edit it and the UI visibly changes underneath them. Undermines trust and looks unfinished. | Pick one form language (the flat editorial one, since it matches everything else) and align edit-form to new-form. | M |
| X2 | H | **Navbar is on a third design system.** Navbar uses `#111` bg, `#f59e0b` amber, `#9ca3af` gray, `rounded-lg` buttons. Everything else uses `#13241d`, `#f4b942`, flat corners. Two ambers, two dark greens, gray-400 vs the palette's `#5d6a64`. | The very first element every visitor sees doesn't match the rest of the site. | Align navbar to `#13241d` / `#f4b942` / flat corners. This is shade normalization, not a palette change. | S |
| X3 | H | **No shared UI primitives at all.** Every button, badge, table header, input, and pagination control is inline Tailwind, copy-pasted with drift. At least 4 distinct primary-button recipes, 3 badge recipes (StatusBadge, org type pill, approval pill), 2 table header styles. | Every future change costs N edits; drift is guaranteed; this is the root cause of X1/X2. | Introduce `src/components/ui/`: Button, Badge, Input, Label, Table shell, Pagination. Extract-and-swap, no behavior change. Do this FIRST, per-surface branches then consume it. | L |
| X4 | H | **`alert()` and `confirm`-style flows everywhere for errors and destructive feedback** (new-dog-form, edit-form, dog-row-actions, alert-actions, criteria-form, org-table, dogs-table). Digest success also uses `alert()`. | Native alerts block the thread, look broken on mobile, can't be styled, and dismissal loses the message. Error text like raw Supabase messages leaks to users. | Add one small toast component (in-house, ~50 lines, no dependency) + inline field errors. Replace alerts surface by surface. | M |
| X5 | M | **Tracking/letter-spacing abuse.** `tracking-[0.24em]` uppercase 10-12px text is used for labels, nav links, buttons, body-adjacent metadata, helper text, pagination. When everything is a kicker, nothing is. Helper text ("Use decimals for puppies") set as 10px uppercase bold is genuinely hard to read. | Scanning suffers; the one style that should mark section headers marks everything. | Define a 4-step type scale: display / heading / body / kicker. Kicker (uppercase-tracked) reserved for section labels only. Helper text becomes normal-case 12-13px. | M |
| X6 | M | **Focus states inconsistent and sometimes removed.** Login input uses `focus:ring-0`, most inputs use amber ring, buttons and Link-buttons have no visible focus style anywhere (`outline-none` patterns). Keyboard users can't see where they are. | Accessibility failure (WCAG 2.4.7), and it's the kind that's invisible until someone complains. | Global `focus-visible` ring (amber, 2px) on all interactive elements via one utility class or globals.css. | S |
| X7 | M | **Contrast risks.** `text-[#f5f0e8]/40` and `/30` on `#13241d` (dashboard nav inactive links, admin top bar links, org name) computes to roughly 2:1 against the dark green. `text-[#f4b942]/70` table headers likely borderline. **NVC** for exact ratios but /30 and /40 white-on-dark are almost certainly failing. | Low-vision users can't read nav state; these are primary navigation elements. | Raise inactive nav text to /60 or a solid tint; verify with contrast checker on the preview. | S |
| X8 | L | **Custom checkbox in new-dog special-needs toggle is a `<button>` painting its own box; real checkboxes elsewhere are unlabeled to screen readers** (no `htmlFor`/`id` pairing except the mix checkbox in edit form; new-dog "mix" label has `id="mix"` on input but label isn't `htmlFor`-linked). | Screen reader users get unlabeled controls. | Pair every input with a real `<label htmlFor>`; use a styled native checkbox for the disclosure toggle. | S |

### Shelter workflow (highest priority surface)

| # | Sev | Issue | Why it hurts | Fix | Effort |
|---|-----|-------|--------------|-----|--------|
| S1 | H | **Add-dog is one monolithic vertical form with a footgun submit label.** ~10 sections of scrolling; "Post to Network" fires alert emails to every matching rescue instantly, with zero review step and no way to save a draft. One mistyped weight = wrong email blast + a "resend alerts" cleanup. | The most consequential action in the app has the least friction and no confirmation of what's about to happen. | Add a lightweight review/confirm step (or at minimum a summary line above submit: "This will alert matching rescues immediately"). Keep it one page, don't wizard-ify. | M |
| S2 | H | **Name is the only implicitly required field, and nothing is marked required.** Form has no `required` attrs except HTML defaults; you can submit a dog with no breed, age, weight, sex unknown, no state, no photo. Rescue matching quality depends directly on these fields. | Sparse dogs match poorly and look bad publicly; shelters don't know what matters. | Mark required fields, add inline validation, and show a "match completeness" nudge (e.g. "adding weight + age helps rescues find this dog"). | M |
| S3 | M | **Client-side insert then fire-and-forget `/api/alerts` with no error surface.** If the alerts call fails after insert, the shelter never knows; the dog silently gets no alerts (same failure class as the Canines & Kitties silent-zero-alerts bug). | Silent failure in the core pipeline. | Await alerts response, surface "X rescues alerted" success state, or an explicit retry on failure. | S |
| S4 | M | **My Dogs list has no search, no status filter, no sort.** PG County has 150 dogs; a shelter at that scale pages through 15 pages of 10 to find one dog. Pagination renders every page number as a button — 15 buttons at 150 dogs. | Finding a specific dog is O(pages). | Add name search + status filter (server-side, URL-driven like browse page already does), truncate pagination to prev/1/…/n/next. | M |
| S5 | M | **Status change on My Dogs takes select → Apply, but the same action in admin dogs-table is select → instant save.** Two different mental models for the same operation. Also, changing status to `available` may not re-fire alerts (open question already tracked in vault TODO). | Inconsistent interaction pattern; users learn one, get burned by the other. | Standardize on the dirty-state Apply pattern (safer) in both places. | S |
| S6 | L | **Rescue-interest info is buried.** "2 rescues interested" is a green text line on card/row; there's no way from the list to see WHICH rescues without entering edit page. For a shelter, that's the payoff moment of the whole product. | The most valuable signal in the shelter's world is two clicks deep. | Make interested-count a link/popover to rescue names + contact, or bring responses onto the dog row expansion. | M |

### Rescue workflow

| # | Sev | Issue | Why it hurts | Fix | Effort |
|---|-----|-------|--------------|-----|--------|
| R1 | H | **Alert feed has no filtering, no urgency sorting, and no unread distinction.** Everything sorts by sent_at; a dog with a euthanasia date tomorrow renders identically in position 8 as a safe dog. Declined and responded alerts stay in the same list forever with no way to view "new only". | The entire point of the product is rescues acting fast on urgent dogs; the feed doesn't prioritize them. | Sort at-risk/urgent to top (or add an Urgent section), add status filter tabs (New / Interested / Passed), badge count of unactioned alerts in nav. | M |
| R2 | M | **Alert cards omit weight, color, and special needs** — three of the criteria the rescue explicitly filtered on. Rescue must open the public profile to see if a matched dog is actually viable. | Extra click per alert times every alert, forever. | Add the missing fields to the card (data is already fetched via `dogs(*)`). | S |
| R3 | M | **No "why this matched" explanation.** The match engine checks breed/color/age/weight/sex/mix/state/special-needs, but the card shows nothing about which criteria hit. | Rescues can't calibrate their criteria when matches feel off; support burden lands on Steven/admins. | Small "Matched: breed, state, size" line on the card. Matching predicate is already extracted to `lib/matching.ts`, so the fields are computable server-side. | M |
| R4 | L | **Criteria view-mode capitalizes values via CSS `capitalize`** including state codes and sex — fine — but shows "All" for empty without clarifying that empty = match-everything, which was exactly the confusion class behind silent-no-match support issues. | Users misread "All" as "not set". | Label as "Any (matches all)". | S |

### Admin portal

| # | Sev | Issue | Why it hurts | Fix | Effort |
|---|-----|-------|--------------|-----|--------|
| A1 | H | **Admin page loads every org, every dog, and every alert with `select('*')` and no pagination.** At 150 dogs it's fine; at 21 more NM orgs plus Petfinder sync it degrades fast, and the dogs table renders all rows client-side. | Scaling time bomb on the exact surface you use most, right before a bulk onboarding. | Server-side pagination + count queries for stats (dashboard page already does count-only queries correctly — copy that pattern). | M |
| A2 | M | **Org table: 9 columns, horizontal scroll on anything below wide desktop, actions crammed into last cell.** Email column alone eats huge width. **NVC** on exact breakpoint behavior. | Admin work on a laptop means constant horizontal scrolling. | Collapse Location+Joined into secondary text under org name, move Doc/Digest/Deactivate into a row kebab menu, keep Approve/Reject prominent only in the pending section. | M |
| A3 | M | **Destructive actions under-protected, digest feedback via alert().** Deactivate has no confirm at all; dog delete has inline confirm (good) but deactivating an org silently kills their access. | One misclick deactivates a real shelter. | Inline confirm on Deactivate matching the delete pattern; toast for digest results. | S |
| A4 | L | **Activity tab caps at 20 with no filter or link-through** to the dog/org involved. | Investigating "did rescue X get alerted about dog Y" requires SQL. | Make dog/rescue names link to filtered views; raise limit with pagination. | S |
| A5 | L | **Tabs reset on refresh** (useState, not URL-driven, unlike browse page which does this right). | Deep-linking "check the pending orgs" isn't possible; refresh loses place. | Drive active tab from `?tab=` like `/dogs` does. | S |

### Public + auth

| # | Sev | Issue | Why it hurts | Fix | Effort |
|---|-----|-------|--------------|-----|--------|
| P1 | H | **`TEST_EMAILS` hardcoded in the public browse page source** to hide Abel's and Amy's orgs, with emails shipped in the bundle... actually this is a Server Component so emails stay server-side, but the filter itself is a data-model smell flagged in your own TODO comment. | Admin/test orgs leak into public listings the moment someone forgets the filter on a new query (it's already only applied on 2 of 3 tabs' queries — dogs tab does NOT exclude them, so Philadelphia Animal Care & Control's dogs would show publicly). | Add `is_test` or `hidden` boolean on organizations; filter centrally. Small schema change, not UI — flag for its own tiny branch. | S |
| P2 | M | **Shelter cards link to `/dogs?tab=dogs` (all dogs), not that shelter's dogs.** "View Dogs →" implies filtered results; there is no shelter filter param. | Broken expectation on every shelter card. | Add `?shelter=` param to dogs tab query. | S |
| P3 | M | **Browse pagination renders all page numbers** — with Petfinder-scale data (thousands of dogs) that's hundreds of links. Same issue as S4. | Future-breaking. | Truncated pagination component (shared, from X3's ui kit). | S |
| P4 | M | **Login page: no loading guard on double-submit for magic link, error shows raw Supabase strings, and password mode never sets `setLoading(false)` on success** (fine because of redirect, but if routing fails the button hangs on "Signing in..." forever). | Confusing failure states at the front door. | Friendly error mapping, disable during flight, finally-block the loading state. | S |
| P5 | L | **Mobile navbar has no menu at all** — links are `hidden md:flex` with no hamburger. On phones, Browse/About/FAQ/Contact/Shop are simply unreachable from the nav. | Mobile visitors can't navigate the public site. This might be the single worst mobile issue in the app. | Add a disclosure menu. Severity arguably H for mobile traffic; **NVC** on what share of traffic is mobile (check Vercel analytics). | M |

### Mobile (code-level signals, all **NVC** on real device)

| # | Sev | Issue | Fix | Effort |
|---|-----|-------|-----|--------|
| M1 | H | Navbar: no mobile menu (see P5). | Hamburger disclosure. | M |
| M2 | M | Admin tables: `overflow-x-auto` is the only mobile strategy for 9-column tables. | Card-collapse below `md`. | M |
| M3 | M | My Dogs rows: photo + text + select + Apply + Edit in one flex row will crush on 375px. | Stack actions below content on mobile. | S |
| M4 | L | Touch targets: several `px-2 py-1` text-xs buttons (~28px tall) below 44px guideline. | Bump padding on mobile via the shared Button. | S |

---

## Top 10 by impact

| Rank | Item | Impact | Effort | Branch |
|------|------|--------|--------|--------|
| 1 | X3 shared UI primitives (Button/Badge/Input/Table/Pagination, extract-and-swap) | Unblocks everything else, kills drift at the root | L | `refactor/ui-primitives` |
| 2 | P1 dogs-tab missing TEST_EMAILS filter + `hidden` flag on orgs | Test data visible publicly right now | S | `fix/hide-test-orgs` |
| 3 | R1 alert feed urgency sorting + status filters | Core product value: rescues act on urgent dogs first | M | `feat/redesign-matching` |
| 4 | S1+S2+S3 add-dog: required fields, alert confirmation, alert-failure surfacing | Most important workflow, currently silent-failure-prone | M | `feat/redesign-shelter-workflow` |
| 5 | M1/P5 mobile navbar menu | Entire public nav unreachable on phones | M | `feat/redesign-public` |
| 6 | X1 unify edit-dog form with new-dog form styling | Most visible inconsistency in the main workflow | M | `feat/redesign-shelter-workflow` |
| 7 | X4 toast + inline errors replacing alert() | Every surface benefits; unblocks polished error UX | M | `refactor/ui-primitives` (component) then per-surface adoption |
| 8 | A1 admin pagination before NM bulk onboarding | Prevents the admin panel from degrading right when 21 orgs land | M | `feat/redesign-admin` |
| 9 | S4 My Dogs search/filter + truncated pagination | Shelter scale usability | M | `feat/redesign-shelter-workflow` |
| 10 | X6/X7 focus states + contrast fixes | Accessibility baseline, cheap | S | `refactor/ui-primitives` |

## Quick wins (<30 min each)

- X2: navbar shade alignment to `#13241d`/`#f4b942`
- P2: shelter card links to filtered dogs (`?shelter=` param)
- R2: add weight/color/special-needs to alert cards (data already fetched)
- R4: "Any (matches all)" label in criteria view
- A3: inline confirm on org Deactivate
- A5: URL-driven admin tabs
- X6: global focus-visible ring
- P4: login loading/error cleanup
- S5: unify status-change pattern (Apply everywhere)

## Recommended sequencing

1. `fix/hide-test-orgs` — it's a live data-exposure bug, ship first
2. `refactor/ui-primitives` — foundation; extract-and-swap only, zero visual change intended, verified against preview
3. `feat/redesign-shelter-workflow` — highest-value surface
4. `feat/redesign-matching` — rescue feed
5. `feat/redesign-admin` — before NM onboarding lands
6. `feat/redesign-public` — includes mobile nav
7. Follow-up audit pass on homepage/register/profile/approval-wall before their branch

## Token recommendations (document only, not implemented)

- Spacing: 4px base, sections use 24/40/64
- Radius: 0 for public+admin (editorial), 12px dashboard — keep the two-tier system, it's intentional per vault design system
- Type scale: 12 kicker (uppercase tracked, section labels ONLY) / 14 body / 16-18 emphasized / 36-48 display
- Focus: 2px `#f4b942` focus-visible ring, universal
- The two ambers (`#f4b942` vs `#f59e0b`) and two darks (`#13241d` vs `#111`) should collapse to one each — this is shade normalization within the existing brand, not a palette change
