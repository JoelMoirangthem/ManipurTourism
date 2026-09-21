# Final Review — discovery-home branch (2026-09-21)

Scope: plan `docs/superpowers/plans/2026-09-21-discovery-home.md`, spec
`docs/superpowers/specs/2026-09-21-discovery-home-design.md`, ledger
`.superpowers/sdd/2026-09-21-discovery-home/progress.md`, code
`apps/web/src/data/discovery.ts`, `apps/web/src/app/page.tsx`,
`apps/web/src/app/places/page.tsx`, tests `discovery` / `fixtures` / `weather`.

## Verdict: CHANGES REQUESTED (conditional — no new design needed)

No Critical honesty violations. 3 must-fix items, all small (two ~1-line,
one ~6-line). Do not merge until M1–M3 are addressed or explicitly waived
with a ledger entry.

## Verification evidence (run 2026-09-21, in `apps/web`)

- `node --test src/lib/__tests__/discovery.test.mjs
  src/lib/__tests__/fixtures.test.mjs src/lib/__tests__/weather.test.mjs` →
  **12 pass, 0 fail** (5 discovery + 3 fixtures + 4 weather).
- `npm run build` (Next 16.3.5 Turbopack) → **compiled successfully**,
  TypeScript clean, `/` prerendered static, `/places` static shell with
  client hydration.
- Banned-word scan (`book now|per night|available now|rooms available|
  guaranteed 2026|vacancy|safety certif`) over `discovery.ts`, home
  `page.tsx`, `places/page.tsx` → only hit is the honesty line
  ("never a reservation, and never a safety guarantee"), which is the
  required disclaimer direction. **Clean.**
- `action="/places"` + `input name="q"` present in hero; `Verify current
  edition before travel.` present per festival card + festivals lede.
- `/api/places` route supports `q`, `district`, `category`, returns facets —
  matches the params the hero form and collection hrefs emit.

## Must-fix before merge

### M1. Collection blurb names a non-seed place (honesty/catalogue accuracy)
`discovery.ts:4` "Heritage Imphal" blurb names "Govindajee", which is not in
`seed-places.json`. The card then shows a live count of "2 places" while the
blurb implies 3. Same file, "Lakeside" blurb names 3 places while the live
Bishnupur filter yields 4 (includes INA Memorial Moirang). Fix: reword both
blurbs so they never read as an exhaustive member list, e.g. Heritage →
"Kangla Fort and Ima Keithel — Meitei royalty and living markets.";
Lakeside → "Phumdis, Sangai habitat and lake views around Loktak.".
(This is deferred F4 — triaged as must-fix, not shippable, because the
blurb/count mismatch is user-visible on the merged page.)

### M2. `/places` filter state goes stale on client-side param changes
`places/page.tsx:28-31` seeds `q`/`district`/`category` state from
`useSearchParams()` in `useState` initializers only; no effect re-syncs when
the URL params change without a remount (client navigation / back-forward
between two `/places?...` URLs). Add a sync effect, e.g.
`useEffect(() => { setQ(searchParams.get("q") ?? ""); setDebounced(...);
setDistrict(...); setCategory(...); }, [searchParams])`. ~6 lines, no API
change. (This hardens the Task 2 hero-search contract the ledger already
flagged as BLOCKING once — the current fix covers mount but not update.)

### M3. Spec §3 quick chips missing (or record a waiver)
Spec layout step 1 requires hero quick chips (Loktak, Kangla, trek, market);
neither the plan nor `page.tsx` implements them. Either add the chip row
(`<Link href="/places?q=loktak">` etc., ~10 lines in the hero under the form)
or append an explicit waiver to the ledger ("chips deferred to follow-up,
hero search + collections cover entry"). Strict gate does not accept silent
spec drift — pick one.

## Deferred minors triage (from ledger)

- **F1 (spec §5 `filter` nesting / `tone` / `verifyNote` flattened) → CAN SHIP.**
  Internal naming only, no external consumer; field-name test pins the plan
  shapes exactly; per-card "Verify current edition" note renders
  presentationally. Note: spec §5 lowercase names vs plan uppercase remain
  divergent on paper — harmless.
- **F2 (TDD red step skipped) → CAN SHIP.** Process-only; the suite now
  exists and passes 12/12 with the build green.
- **F3 (regex guards brittle) → CAN SHIP.** The landed test parses
  `discovery.ts` as text with block/field extraction plus seed cross-checks —
  materially stronger than the plan sketch; build is the real gate and passes.
- **F4 (Govindajee prose) → MUST FIX, see M1.** Not shippable as-is.
- **`rel="noreferrer"` vs `noopener` → CAN SHIP.** `noreferrer` implies
  `noopener` in all modern browsers; no opener leak. No change needed.

## Cross-task consistency check

| Check | Result |
|---|---|
| Field names plan→code | PASS — `Collection/Season/Festival` types match plan verbatim (pinned by test) |
| Collections resolve live | PASS — `Bishnupur`, `Imphal West`, `Trek` all exist in seed; hrefs use supported API params; empty hides (`items.length === 0 → null`); cover photo live from `items[0]` |
| Hero search contract | PASS on mount (form GET `?q=` + hydration), M2 covers update path |
| Festival verify-notes | PASS — annual patterns + per-card verify line + source links (`https://`) |
| Home stays server component | PASS — no `"use client"` in home; `async` server component over `seedRetriever.listAll()` |
| `/places` Suspense boundary | PASS — `useSearchParams` correctly wrapped |
| Jewel-Emerald light-only | PASS — Ivory/Pine/Gold/Ink/Muted tokens only; `max-w-6xl` left-aligned; `premium-card`; global `:focus-visible` ring (unlayered, beats `outline-none` utility); `prefers-reduced-motion` disables lift in `globals.css` |
| No booking/availability/prices/safety-cert | PASS — banned scan clean; `capacityWording` preserved; monsoon caution + honest-limits strip intact |
| Seasons values vs spec | PASS — Oct–Mar 8–25 / Mar–Jun 16–35 / Jun–Sep ~1500mm all match spec §3 |

## Minor follow-ups (ship-approved, not merge-blocking)

1. Yaoshang source is the generic `/events/` listing while the other two are
   edition-specific URLs — acceptable under the verify-note, but prefer an
   edition-specific URL when one exists.
2. Seasons lede cites "2026 travel guides" generically (spec §5 wants a
   `sourceLabel` per block) — consider naming 1–2 sources in the lede.
3. `font-display` is used on card `h3`s throughout although the global
   constraint says "H1/H2 only" — the plan's own snippets bless `h3` display
   type, so treat the constraint wording as drift; optionally reword it.
4. `Clear filters` uses `window.history.replaceState`, bypassing the Next
   router cache — works today, `router.replace` would be cleaner.
5. Stats strip sits below the hero rather than inside it per spec §3 —
   equivalent information, no action needed beyond noting the drift.
6. `places/page.tsx` catalogue photo uses `alt=""` — acceptable (link name
   comes from the `h2`), no change required.

## Important (non-blocking) note

- No subagents were used for this review (per instruction); all files and
  verification output were inspected directly.
- The repo has no git history here, so per-ledger ruling there are no commits
  to review — file content + test/build output above is the review basis.
