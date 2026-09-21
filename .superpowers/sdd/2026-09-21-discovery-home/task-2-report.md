# Task 2 Report: Home hero search + collections

**Status:** DONE

## Failing check (Step 1)

Run from `D:\ManipuriTourism\apps\web` (PowerShell 5.1, so `Select-String`
instead of the brief's `grep ... ||`):

`MISSING hero search form` — confirmed pre-edit (hero had CTA links only, no form).

## What was changed

Modified only `apps/web/src/app/page.tsx` (server component preserved —
no `"use client"`, no client state; Jewel-Emerald tokens kept):

1. **Import** — added `import { COLLECTIONS } from "@/data/discovery";`
   (Task 1 output, consumed verbatim).
2. **Derivation helpers** (top of `Home`, after `featured`, verbatim per brief):
   `byDistrict`, `byCategory`, `collectionPlaces(c)` — district-first, then
   category, else `[]`. All counts derive from the live
   `seedRetriever.listAll()` result, never hardcoded.
3. **Hero form** — inserted after the CTA row inside the emerald hero,
   verbatim per brief: `<form action="/places" method="get">` with
   `<input name="q" placeholder="Search Loktak, Kangla, trek, market…">`
   and gold `Search` submit button.
4. **Collections section** — new `<section>` after the stats strip, before
   the pillars block (Task 3's lower-page territory left untouched):
   `SectionTitle` kicker `Collections` / title `Browse by collection`, grid of
   `Card`s each rendering first-photo (`items[0].photos[0]`), title, blurb,
   `{n} place(s)` count, and `Explore →` link to `c.href`. Cards with
   `collectionPlaces(c).length === 0` return `null` (hidden).

## Live-filter evidence (prior findings honored)

Counts computed from the live seed via `node`:

- `Bishnupur` → 4 (`loktak-lake`, `keibul-lamjao`, `sendra-resort`,
  `ina-memorial`) — renders.
- `Imphal West` → 2 (`kangla-fort`, `ima-keithel`) — renders; Govindajee
  correctly absent (prose-only in the collection blurb, not a seed place).
- `Trek` → 2 (`shirui-peak`, `dzukou-valley`) — renders.

No collection is empty, so all three render; the hide-empty guard is in place
for future seed changes.

## Test command + output (Step 3)

Run from `D:\ManipuriTourism\apps\web`:

- `npm run build` → **compiled successfully**, `/` prerendered as static
  content (`○ /`), all 22 pages generated, TypeScript clean.
- Post-edit presence checks → `FOUND hero search form`,
  `FOUND input name=q`, `OK still server component`.
- Manual visual check `hero search → /places?q=loktak` not run in-browser
  (no browser harness invoked); the form is a plain GET to `/places` with
  `name="q"`, matching the brief's contract.

## Files changed

- Modified: `apps/web/src/app/page.tsx` (import + derivation + hero form +
  collections section only).
- Step 4 commit intentionally **not attempted** — no git repo exists in
  `D:\ManipuriTourism`; work done in-place per task instructions.

## Concerns

- `/places?q=...` deep-link: the catalogue page (`apps/web/src/app/places/page.tsx`)
  is a client component that initialises its search/facet state to empty and
  does not hydrate from URL query params, so a hero search landing on
  `/places?q=loktak` currently shows the unfiltered list until the user types.
  Pre-existing behaviour, out of Task 2 scope — flagging for a follow-up
  (read `searchParams` into initial state) if the visual `?q=loktak` test is
  expected to filter on landing.

---

## Fix round 1/5 (review findings 1 + 2)

**Status:** DONE

Reviewer findings addressed (verbatim): (1) hero GET `/places?q` did not work
end-to-end — `places/page.tsx` `useState("")` never read `?q`, landing showed
unfiltered; (2) same bug killed collection links (`?district`, `?category`
ignored).

**Change** — minimally edited only `apps/web/src/app/places/page.tsx`
(client component, no redesign, Jewel-Emerald classes untouched):

1. Renamed the existing component to `PlacesInner` and hydrated initial
   filter state from the URL via `useSearchParams` (lazy `useState`
   initialisers): `q` + `debounced` from `?q=`, `district` from `?district=`,
   `category` from `?category=`. State is independent after mount, so user
   edits, debounce, and facet fetching work exactly as before.
2. Added a default-export `PlacesPage` wrapper with a `<Suspense>` boundary
   (minimal Catalogue-styled `Loading…` fallback) to satisfy Next's
   `useSearchParams` prerender requirement.
3. `Clear filters` now also clears the URL (`window.history.replaceState`
   to `window.location.pathname`) in addition to resetting state.

**Verification** (from `D:\ManipuriTourism\apps\web`):

- `npm run build` → compiled successfully, all 22 pages generated,
  TypeScript clean; `/places` still prerenders (`○ /places`).
- `FOUND useSearchParams in places/page.tsx`, `FOUND Suspense boundary`,
  `FOUND hero form still GET /places` (home hero untouched).
- End-to-end logic: `/places?q=loktak` initialises `q`/`debounced` to
  `loktak` so the existing fetch effect queries `/api/places?q=loktak` on
  mount; `/places?district=Bishnupur` and `/places?category=Trek` likewise
  initialise the facet selects. No browser-harness run; no commits (no git).

**Concerns:** none remaining on these findings — URL params unknown to the
page (e.g. a mistyped district) simply yield zero results via the existing
API path, same as manual filter selection.
