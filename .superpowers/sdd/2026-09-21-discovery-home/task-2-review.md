# Task 2 Review: Home hero search + collections

**Verdict: FAIL end-to-end (PASS in-scope, BLOCKED on integration). Do not mark Task 2 DONE until `/places` hydrates from URL params.**

## Scope reviewed

- Brief: `.superpowers/sdd/2026-09-21-discovery-home/task-2-brief.md` (Steps 1–4)
- Report: `.superpowers/sdd/2026-09-21-discovery-home/task-2-report.md`
- Diff: `apps/web/src/app/page.tsx` (full read, focus hero form L90–93 + collections L33–39, L117–156)
- Spec: `docs/superpowers/specs/2026-09-21-discovery-home-design.md` §2–3
- Cross-check: `apps/web/src/app/places/page.tsx` (full read), `apps/web/src/data/discovery.ts` (COLLECTIONS hrefs)
- Global constraints: server component, live-filter counts, hide-empty, Jewel-Emerald

## Key question: does hero GET `/places?q` work end-to-end?

**No.** Verified against current code:

- Hero form is correct in isolation: `<form action="/places" method="get">` + `<input name="q">` (page.tsx:90–93). Submitting navigates to `/places?q=loktak` as the brief contracts.
- Destination drops it: `places/page.tsx:22–26` is `"use client"` with `useState("")` for `q`/`district`/`category`, debounced fetch built only from that state (L38–45). No `useSearchParams`, no `searchParams` prop, no hydration effect. `?q=` in the URL is never read.
- Result: landing on `/places?q=loktak` shows the **unfiltered** list until the user re-types. The brief's own test (`visual hero search → /places?q=loktak`) would FAIL if run.
- Same root cause breaks all three collection deep-links: `discovery.ts` hrefs are `/places?district=Bishnupur`, `/places?district=Imphal%20West`, `/places?category=Trek`, and `places/page.tsx` ignores `district`/`category` URL params identically. So 4 of 4 outbound discovery links from this task are dead on landing.
- The report (§Concerns) discloses this accurately and admits the in-browser visual check was **not run**. Credit for honesty — but disclosure does not cure the broken contract. This is pre-existing `/places` behaviour, out of Task 2's file scope, yet it is load-bearing for Task 2's stated test.

## Spec compliance (§2–3)

| Requirement | Status |
|---|---|
| §2 Home stays server component reading `seedRetriever.listAll()` | PASS — no `"use client"`, async server component preserved (page.tsx:28–29) |
| §2 Collections derived via district/category filters, never hardcoded IDs | PASS — `byDistrict`/`byCategory`/`collectionPlaces`, district-first, verbatim per brief (L33–39) |
| §2 Hero search links to `/places?q=` (existing API), no new search logic | PARTIAL — link shape correct, but end-to-end non-functional (see above); no new logic added, which is correct |
| §2 Reuses `ui.tsx` (Card/SectionTitle), tokens, Fraunces+Inter, `max-w-6xl` left-aligned | PASS — Card + SectionTitle used, Pine/Gold/Ivory tokens, `max-w-6xl`, no token drift |
| §3 Hero: kicker, serif H1, search input → `/places?q`, quick chips, stats | PARTIAL — kicker/H1/form/stats present; **quick chips (Loktak, Kangla, trek, market) missing**. Brief did not ask for them, so not a Task 2 code fault, but §3 is not fully met |
| §3 Collections: 3 cards, 1 photo, count, link to filtered `/places` | PARTIAL — card content correct (first-photo `items[0].photos[0]`, `{n} place(s)`, `Explore →` to `c.href`, L124–154); links non-functional per key question |
| §3 Hide-empty | PASS — `if (items.length === 0) return null` (L126), lede states the rule (L121) |

## Quality

- **Good, in-scope:** verbatim brief snippet, import of Task 1 `COLLECTIONS` verbatim, no scope creep into Task 3 territory (pillars/lower page untouched), Jewel-Emerald styling consistent (gold submit, `focus:border-[#C19A4B]`, `premium-card-hover`).
- **Live-filter evidence:** report's counts (Bishnupur 4, Imphal West 2, Trek 2) are consistent with the derivation code; hide-empty guard in place for future seed changes. Acceptable without re-running.
- **Testing gap:** `npm run build` clean is claimed but output not pasted; visual `?q=loktak` check explicitly skipped. Given the integration defect, the skipped visual check is exactly the check that would have caught it. Per `verification-before-completion`, a DONE claim requires the visual test to actually pass.
- **Report honesty:** high — failing check confirmed pre-edit, files-changed accurate, commit correctly not attempted (no git repo), concern flagged rather than hidden. The defect is in the code tree, not in the reporting.

## Findings (ordered)

1. **[Blocking] `/places?q` / `?district=` / `?category=` ignored on landing** — `places/page.tsx:22–26,38–45`. Breaks Task 2's user-visible contract. Fix in follow-up (not in this file): hydrate initial `q`/`district`/`category` from URL — e.g. `useSearchParams()` initial state or a server wrapper passing `searchParams` to the client component. Then re-run the brief's visual test for `?q=loktak`, `?district=Bishnupur`, `?category=Trek`.
2. **[Spec gap, non-blocking for Task 2] Hero quick chips missing** — spec §3(1) requires them; brief Step 2 omits them. Either amend the brief/spec or schedule chips as a follow-up slice. Do not sneak them into this review's fix.
3. **[Minor] Build evidence not pasted** — accept `npm run build` claim provisionally; re-verify with output when the `/places` fix lands.

## Recommendation

- Keep Task 2 code as-is (do not revert — in-scope work is correct).
- File one follow-up task: "`/places` honours URL query params (`q`, `district`, `category`) as initial filter state" with acceptance `hero search → /places?q=loktak` filters on landing + collection hrefs filter on landing.
- Re-verify Task 2 DONE only after that follow-up passes `npm run build` + the three visual deep-link checks.
