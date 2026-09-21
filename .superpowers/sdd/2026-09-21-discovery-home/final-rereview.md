# Final Re-review — fix wave for M1/M2/M3 (2026-09-21)

Scope (only): `apps/web/src/data/discovery.ts`, `apps/web/src/app/places/page.tsx`,
`apps/web/src/app/page.tsx`, against Must-fix M1–M3 in
`.superpowers/sdd/2026-09-21-discovery-home/final-review.md`.
No subagents used; all files and verification output inspected directly.

## Fresh verification evidence (this re-review, not implementer report)

- `node --test src/lib/__tests__/discovery.test.mjs src/lib/__tests__/fixtures.test.mjs src/lib/__tests__/weather.test.mjs`
  (in `apps/web`) → **12 pass, 0 fail** (5 discovery + 3 fixtures + 4 weather).
- `npm run build` (Next 16.3.5 Turbopack) → **compiled successfully**, TypeScript clean,
  22/22 static pages generated, `/` static, `/places` static shell with client hydration.
- Banned-word scan (`book now|per night|available now|rooms available|guaranteed 2026|
  vacancy|safety certif`, case-insensitive) over the three in-scope files → **clean on all three**.
  (One `Govindajee` string remains in `discovery.ts:19` — see M1 note; it is outside the
  banned list and outside M1's scope.)
- Seed cross-check via `seed-places.json` (8 records): Bishnupur ×4
  (Loktak Lake, Keibul Lamjao, Sendra Resort, INA Memorial), Imphal West ×2
  (Kangla Fort, Ima Keithel), Trek category ×2 (Shirui Kashong Peak, Dzukou Valley).
- `searchPlaces` (`src/lib/adapters.ts:43,56-62`) lowercases query, district, category,
  and haystack → quick-chip query casing is irrelevant.

## Per-finding verdict

### M1 — Collection blurb names a non-seed place → ADDRESSED
- `discovery.ts:4` Heritage blurb now reads
  "Including Kangla Fort and Ima Keithel — Meitei royalty and living markets."
  `Govindajee` is gone from the blurb; the two named places are exactly the two
  Imphal West seed records, and the `Including` prefix marks the list non-exhaustive.
- `discovery.ts:3` Lakeside blurb now reads
  "Including Loktak, Keibul Lamjao and Sendra — phumdis, Sangai habitat, lake views."
  It still enumerates 3 of the 4 live Bishnupur records (INA Memorial not named), but the
  added `Including` prefix means it no longer reads as an exhaustive member list, which is
  the criterion the Must-fix stated ("never read as an exhaustive member list"). The
  live-count mismatch logic is resolved.
- Note (non-blocking): the suggested rewrite dropped place names entirely for Lakeside;
  the implementer kept names + `Including`. Acceptable under the "e.g." wording, but a
  future edit could name INA Memorial or drop enumeration for extra safety.
- `Govindajee` still appears once in `discovery.ts:19` Yaoshang `venues`
  ("Kangla Fort to local grounds, Govindajee Temple"). This is a free-text festival venue
  descriptor, not a catalogue-membership claim tied to a live count — out of M1 scope,
  not an honesty violation, no action required.

### M2 — `/places` filter state stale on client-side param changes → ADDRESSED
- `places/page.tsx:39-44` adds the requested sync effect verbatim in spirit:
  `useEffect(() => { setQ(...); setDebounced(...); setDistrict(...); setCategory(...); },
  [searchParams])`. Covers `q`/`district`/`category` update path (back/forward, Link
  between two `/places?...` URLs), not just mount. No API change.
- No loop risk: effect is driven by `searchParams` identity; sets identical values bail out.
  Debounce (220 ms), AbortController, facets, Suspense boundary (`PlacesPage`, lines 180-194),
  and `Clear filters` behaviour are untouched.

### M3 — Spec §3 quick chips missing → ADDRESSED (implemented, no waiver needed)
- `page.tsx:94-110` adds the chip row under the hero form with exactly the four spec labels:
  Loktak (`/places?q=Loktak`), Kangla (`/places?q=Kangla`), Trek (`/places?q=trek`),
  Market (`/places?q=market`). Mixed case is fine — search is case-insensitive (see evidence).
- Hero GET form (`action="/places"`, `input name="q"`, lines 90-93) preserved; chips carry
  `aria-label="Search places for …"` and focus-visible outline styles. Home remains an async
  server component with no `"use client"`.

## New breakage in fix diffs → NONE FOUND
- Tests 12/12 and clean build confirmed fresh above (not taken on trust).
- Collection `href`s unchanged and resolve against seed (`Bishnupur`, `Imphal West`, `Trek`);
  empty-hides guard (`items.length === 0 → null`) and live cover photo intact.
- Festival verify-lines + source links, seasons values, stats strip, honest-limits strip,
  `capacityWording`, Suspense boundary, and server-component home all intact.
- Pre-existing minors from final-review (festival URL granularity, seasons lede sourcing,
  `font-display` on h3, `replaceState` vs `router.replace`, stats placement, photo `alt=""`)
  are untouched by this fix wave — still deferred, still shippable.

## Overall
M1 ADDRESSED · M2 ADDRESSED · M3 ADDRESSED. No new breakage. Nothing further blocks merge
from this re-review's scope.
