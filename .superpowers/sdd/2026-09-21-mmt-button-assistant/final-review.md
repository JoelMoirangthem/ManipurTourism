# Final whole-branch review — button-only assistant + MMT-grade home

Plan: `docs/superpowers/plans/2026-09-21-mmt-button-assistant.md`
Spec: `docs/superpowers/specs/2026-09-21-mmt-assistant-design.md`
Ledger: `.superpowers/sdd/2026-09-21-mmt-button-assistant/progress.md`
Scope: repo root `D:\ManipuriTourism`, app `D:\ManipuriTourism\apps\web`. No git — files read directly, verified via tests + build. No subagents used.

Verdict: **CLEAN** — no must-fix items. All deferred minors triaged below (all CLOSE / ACCEPT, none blocking). Two new observations recorded as non-blocking follow-ups, not gates.

## 1. Fresh verification evidence (this review, not quoted from reports)

- Unit tests (workdir `apps/web`):
  `node --test src/lib/__tests__/tripWidget.test.mjs src/lib/__tests__/assistantBrief.test.mjs src/lib/__tests__/discovery.test.mjs src/lib/__tests__/fixtures.test.mjs src/lib/__tests__/weather.test.mjs`
  → **18 pass / 0 fail** (3 tripWidget + 3 assistantBrief + 5 discovery + 3 fixtures + 4 weather).
- Production build `npm run build` → **compiled successfully, 22/22 static pages**. Route table (27 entries):
  `ƒ /assistant` (route handler, NOT a page), `○ /plan` (redirect), `○ /`, `○ /places`, `ƒ /places/[id]`. **No `/assistant` page route — guard holds.**
- `Test-Path src/app/assistant/page.tsx` → False; `src/app/assistant/` contains only `route.ts`. Confirmed on disk.
- `href="/assistant"` grep over `layout.tsx`, `page.tsx`, `places/page.tsx`, `places/[id]/page.tsx`, `components/*.tsx` → **zero hits**. T2 roundtrip debt is gone (see triage).
- `/?assistant=open` links present: home hero `page.tsx:84`, festival cards `page.tsx:217` (`encodeURIComponent(Tell me about …)`), places empty-state `places/page.tsx:180`.
- Shared-name grep: `TripContext`/`EMPTY_TRIP`/`readTripContext`/`writeTripContext`/`tripToPlacesParams` (`lib/tripContext.ts`, consumed in `TripWidget.tsx:4,26-27` and `places/page.tsx:12,33,45-46`), `readWishlist`/`toggleWishlist` (`lib/wishlist.ts`, consumed in `WishlistHeart.tsx:3,9,22`, `WishlistCount.tsx:4,8-11`), `requestPanelOpen`/`consumeOpenSignal` (`assistant-thread.tsx:97,102`, consumed in `AssistantAutoOpen.tsx:3,12` and `AssistantPanel.tsx:8,29`), `AssistantAutoOpen` mounted `layout.tsx:7,88`, storage keys `mit_assistant_thread_v1` (`assistant-thread.tsx:60`), `mit_trip_context_v1` (`tripContext.ts:12`), `mit_wishlist_v1` (`wishlist.ts:2`). **All spellings exact, no aliases.**
- Honesty grep over new/edited surfaces (`page.tsx`, `TripWidget`, `AttractionsRail`, `SeasonExplorer`, `WishlistHeart`, `WishlistCount`, `PhotoLightbox`, `CountUp`, `Reveal`, `places/page.tsx`, both libs) for `price|₹|discount|% off|only N left|hurry|rating|review score|nightly|per night|book now|available` → hits are **only honest-limits negations** (`page.tsx:121,314,317`, `domain.ts` capacity wording, assistant/budget pre-existing code). No invented scores, prices, permits, countdowns, or availability-as-fact.
- Palette: 126 hits for `#FDFBF7|#0B3D2E|#0E5A42|#C19A4B|#1A2E28|#5D746B` across home/layout/islands; `dark:` grep → zero hits. **Light-only Jewel-Emerald intact.**
- Server/client boundaries: home `page.tsx` and `places/[id]/page.tsx` have no `"use client"` (server, correct — they `await seedRetriever`); `places/page.tsx:1` is `"use client"` (required for `useSearchParams` + chip); all 12 islands (`TripWidget`, `WishlistHeart/Count`, `AttractionsRail`, `SeasonExplorer`, `PhotoLightbox`, `CountUp`, `Reveal`, `AssistantPanel`, `AssistantAutoOpen`, `assistant-thread`, `ActorSwitcher`) carry `"use client"`. `layout.tsx` stays server while mounting client islands — correct.
- Suspense: `places/page.tsx:229-239` wraps `PlacesInner` (`useSearchParams` at `:61`) with a loading fallback — correct per Next prerender requirement. (Sibling `inquire/page.tsx` has its own Suspense; untouched by this branch.)
- a11y: Esc closes panel (`AssistantPanel.tsx:17`) and lightbox (`PhotoLightbox.tsx:30`); arrows step lightbox (`:31-32`); body scroll-locked in both with cleanup; labels on every control (widget `tablist` + `aria-selected`, labelled select/dates, stepper `role=group` + `aria-labelledby` + `aria-live=polite`, hearts `aria-pressed` + `aria-label="Save place"`, season tabs `role=tab` + `aria-selected`, lightbox `role=dialog aria-modal` + per-photo labels, header/nav `aria-label`s); global `:focus-visible` outline (`globals.css:80-84`) plus `focus-visible:` rings on hearts/lightbox/CTAs; 44px targets on hearts (`h-11 w-11`) and lightbox buttons.
- Motion: `CountUp.tsx:10` and `Reveal.tsx:11` resolve instantly under `prefers-reduced-motion: reduce`; `Reveal.tsx:35` adds `motion-reduce:` fallbacks; `globals.css:86-93` kills all animation/transition durations globally; drawer slide is `transition-transform` (`AssistantPanel.tsx:70`) so it instant-shows under the global kill. Plan constraint satisfied.
- Freshness/honesty copy preserved: widget caption `page.tsx:98-100` ("context only — never live availability"), `capacityWording` split (`domain.ts:157-168`), festival cards keep source link + "Verify current edition before travel" (`page.tsx:214-215`), `id="festivals"` anchor (`page.tsx:206`), honest-limits section intact (`page.tsx:308-323`).

## 2. Cross-task consistency

| Contract | Evidence | Result |
|---|---|---|
| T1 → T3/T4/T6 names verbatim | Grep table above; `Card` type extended with `claimsCount: number` (`places/page.tsx:22`) consuming the additive API field | PASS |
| T2 → T4 signal query contract | `AssistantAutoOpen.tsx:7-12` reads `assistant/ask/start`, `seedPlanStarter` on `start=plan`, `requestPanelOpen(ask)`, strips params preserving the rest; festival/hero/empty-state links emit exactly `/?assistant=open&ask=…` | PASS |
| T2 vs T3 layout overlap | Task 2 mounts (`layout.tsx:6-7,87-88`) byte-identical after Task 3 nav edit; NAV/MORE_NAV verbatim (`layout.tsx:19-31`), `<details className="relative">` dropdown (`:62-77`), `<WishlistCount />` before `<ActorSwitcher />` (`:78-81`) | PASS |
| T4 vs T5 vs T6 shared pages | `<TripWidget />` + caption (`page.tsx:97-101`), `id="festivals"` + Ask Mit links (`:206-222`), `AttractionsRail` mapping (`:186-195`), `SeasonExplorer` (`:200-203`), hearts + decision lines (`:286,290-297`), `TripChip` after lede (`places/page.tsx:122`) — all co-present, none overwritten | PASS |
| No `/assistant` page route | Disk + build table (§1) | PASS |
| Redirects | Code: `assistant/route.ts` → `redirect("/?assistant=open")`, `plan/page.tsx` → `redirect("/?assistant=open&start=plan")`; live 307s confirmed in Task 6 report (no browser harness here to re-run dev server, code unchanged since) | PASS |
| claimsCount | Additive `claimsCount: p.claims.length` (`api/places/route.ts:51`); `near=` branch untouched; home uses `p.claims.length` directly (server), places list uses `claimsCount` (client fetch) — minimal correct wiring, no contract break | PASS, keep (see triage) |

## 3. Triage of ledger deferred minors

**T1-a — comment rewording for guard regex (tripContext.ts:1-2). Ruling: CLOSE, correctly handled.**
Brief snippet's "never availability" / "storage unavailable" trips its own `/available|price|book/i` guard. Implementer reworded to "never live inventory" / "storage inaccessible". Comment-only, logic and names untouched. Fresh grep for `available|price|book` in `tripContext.ts` → no matches. Non-issue in code; optional brief-text fix only, not a gate.

**T1-b — literal `50` instead of `MAX_SAVED` const (wishlist.ts:10,18). Ruling: CLOSE, correctly handled.**
Brief snippet uses `.slice(0, MAX_SAVED)` but its guard requires literal `slice(0, 50)`. Implementer inlined `50` in both read and toggle paths. Same runtime cap, same exports/behavior. Minor maintainability cost (magic number) forced by the guard; acceptable. No action.

**T2-a — stale full-page comments in panel/thread headers. Ruling: CLOSE, fixed by T3.**
Task 2 review flagged `AssistantPanel.tsx:1-3` ("full /assistant page") and `assistant-thread.tsx:1-4` ("continue on the page"). Task 3 report reworded both to panel-only; fresh grep for `full /assistant|full-page|/assistant page` → zero hits. Verified closed.

**T2-b — `/assistant` hrefs via redirect roundtrip. Ruling: CLOSE, fixed by T3/T4.**
Task 2 review listed `layout.tsx:21`, `page.tsx:78`, `places/page.tsx:145` as working-but-indirect. Task 3 removed the layout NAV entry; Task 4 repointed hero + empty-state to `/?assistant=open`. Fresh grep → zero `href="/assistant"` hits anywhere in app/components. No 404 risk ever existed (route handler caught all); now zero roundtrips too. Verified closed.

**T3 — `rel` attr note (`page.tsx:214` festival source link uses `rel="noreferrer"`, elsewhere `rel="noreferrer noopener"`). Ruling: ACCEPT as non-blocking minor, no gate.**
`assistant-thread.tsx:298` and `PhotoLightbox.tsx:120` use `noreferrer noopener`; the festival source anchor uses `noreferrer` alone. Modern browsers imply `noopener` from `noreferrer`, so there is no exploitable window-opener here — this is a consistency nit, not a vulnerability. One-word future cleanup; not worth a CHANGES REQUESTED on its own.

**claimsCount ruling (Task 5 review §24, ledger line 28). Ruling: UPHELD — additive-safe, keep, do not revert.**
The catalogue branch previously omitted claims entirely; the change adds one numeric field derived from the same verified source the brief mandates for the "verified facts: N" chip, touches no existing field, and the client-side places list cannot use `p.claims.length` without over-fetching. Same logic covers `PhotoLightbox`'s optional `sourcePage?: string | null` (superset of the brief's four-field shape, preserves pre-existing source links, mapped verbatim). Both disclosed in the Task 5 report. Keep.

## 4. New observations (non-blocking, recorded so they are not mistaken for oversights)

1. `TripChip` empty-state condition (`places/page.tsx:36`: `if (!trip.destination && !trip.checkIn && !trip.travellers) return null`) can never be true because `readTripContext()` defaults `travellers` to 2 (truthy) — so the chip always renders after hydration ("Anywhere · 2 travellers · dates flexible" for first-time visitors) and `Clear` (which resets only destination/checkIn/checkOut per the brief verbatim) never dismisses it. Implementation is **verbatim to the Task 6 brief**, copy never implies availability, and the default-2 context object is documented — so this is a brief-level UX wart, not a correctness or honesty violation. Suggest a future slice (hide when context equals `EMPTY_TRIP`; reset travellers on Clear) but do not gate this branch on a deviation from its own brief.
2. Widget tabs (`Stays/Culture/Treks`) write `interests: [category]` to trip context but `tripToPlacesParams` emits only `district/checkIn/checkOut` (Task 1 verbatim), so the tab does not filter `/places` via `category=`. The spec §3 sketch shows a `category=…` param, but the plan — the binding authority — defines the param builder without it, and changing the signature now would break the Task 1 guard test. Recorded as a plan-vs-spec divergence for a future plan revision, not a defect in this implementation.
3. Closed panel (`AssistantPanel.tsx:66-71`) keeps `aria-hidden={!open}` over focusable children without `inert` — focus can theoretically enter the off-canvas panel via keyboard when closed. Brief-verbatim shell, low practical impact (translate-x-full + overlay pointer-events-none), no user complaint path in this slice. Candidate for a future a11y-hardening slice (`inert` + focus trap + return focus), not a gate.

## 5. Must-fix list

None.

## 6. Final statement

Branch is internally consistent, spec-honest (no invented scores/prices/availability/urgency), palette-constrained, boundary-correct, Suspense-correct, and a11y/motion-guarded. Tests 18/18 and build 22/22 freshly verified. Every ledger deferred minor is either fixed (T2-a, T2-b) or correctly accepted as brief-forced/minor (T1-a, T1-b, T3-rel, claimsCount). **Verdict: CLEAN — approve, no rework required.**
