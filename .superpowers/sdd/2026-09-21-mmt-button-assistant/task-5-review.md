# Task 5 review — Attractions rail, season explorer, decision cards, lightbox

Verdict: **PASS** (with two additive-safe extensions explicitly approved below — nothing to revert).

Build: `npm run build` in `apps/web` completes cleanly (route table emitted, no type/lint errors). `AttractionsRail` present in `src/app/page.tsx` (INTERACTIVE). Note: repo root is `D:\ManipuriTourism`, code lives under `apps/web/src/...`; the brief/report abbreviate to `src/...`.

## Contract checks (brief verbatim)

- **WishlistHeart** (`components/WishlistHeart.tsx`): props `{ placeId: string }` exact. `useState(false)` + `useEffect` hydrating from `readWishlist().includes(placeId)`; click calls `toggleWishlist(readWishlist(), placeId)` (matches `lib/wishlist.ts` signature `(ids, id) => string[]`). Heart SVG fills `#C19A4B` gold when saved, `none` otherwise. `aria-pressed={saved}`, `aria-label="Save place"` verbatim. `h-11 w-11` = 44px touch target. Extra `preventDefault + stopPropagation` is required, not a deviation — hearts render inside card `<Link>`s and would otherwise navigate. Extra `window.dispatchEvent(storage)` is harmless.
- **AttractionsRail**: props `{ places: { id; name; district; summary; photo: string | null }[] }` exact. Rail is `flex ... overflow-x-auto` with `snap-x snap-mandatory` + `snap-start` cards. Rank `String(i + 1).padStart(2, "0")` verbatim. Each card links `/places/{id}`, carries `WishlistHeart`, heading "Top attractions in Manipur" verbatim.
- **SeasonExplorer**: props `{ seasons: { name; months; temp; note }[] }` exact. `useState(0)`, tab buttons `role="tab"` + `aria-selected`, panel shows months/temp/note from props only. No invented copy — `page.tsx` passes `SEASONS` straight through.
- **PhotoLightbox**: props `{ photos: {...}[]; startIndex?: number }` with one additive optional field (see below). Thumbnail grid buttons open fullscreen `role="dialog" aria-modal="true"` overlay. Prev/next buttons (`aria-label="Previous/Next photo"`) + `ArrowLeft`/`ArrowRight` + `Esc` close all present. Caption + attribution + license shown per photo. Body scroll locked (`overflow = "hidden"`, restored in effect cleanup).
- **page.tsx**: `<AttractionsRail places={...}/>` rendered after collections, mapping `id/name/district/summary/photo: p.photos[0]?.storageKey ?? null` from seed records. Seasons grid replaced with `<SeasonExplorer seasons={SEASONS} />`. Featured cards carry `<WishlistHeart placeId={p.id} />` + decision-info line (season tag + `verified facts: {p.claims.length}`).
- **places/page.tsx**: same decision-info line + heart per card. `Card` type extended with `claimsCount: number` (consumes the new API field).
- **places/[id]/page.tsx**: seed-photos grid replaced with `<PhotoLightbox photos={seedPhotos.map(ph => ({storageKey, caption, attribution, license, sourcePage}))} />`.

## Binding checks

- Rank numbers padded: yes. `aria-selected` (tabs), `aria-pressed` + `aria-label="Save place"` (hearts), lightbox `aria-label`s: yes. Esc/arrows/scroll-lock: yes.
- Task 4 lines preserved in `page.tsx`: `<TripWidget />` + "Dates and travellers are context only" caption, `id="festivals"` anchor untouched, festival "Ask Mit →" links with `encodeURIComponent(Tell me about ...)` intact, `capacityWording(p)` on featured cards, honest-limits section intact.
- No invented scores/prices: confirmed. Decision chips use `p.claims.length` / new `claimsCount` (derived from verified claims) and site-wide `SEASONS[0]` tag. The `SEASONS[0]`-for-every-card choice is the honest option — seed records carry no per-place season field, so per-place mapping would be invented copy; the report discloses this. No ratings, prices, or permits added (repo-wide grep for price/rating/score hits only pre-existing assistant/budget/inquiry code and search-relevance internals).
- Extra islands `CountUp` + `Reveal`: acceptable. Both resolve instantly / skip hiding under `prefers-reduced-motion: reduce` (CountUp sets value directly; Reveal sets visible + `motion-reduce:` classes). `Reveal` wraps rail, explorer, and featured sections only; `id="festivals"` anchor untouched.

## claimsCount ruling: ADDITIVE-SAFE — keep, do not revert

- No contract break: the `/api/places` catalogue branch previously omitted claims entirely; the change adds one numeric field `claimsCount: p.claims.length` and touches no existing field (`id/name/district/category/summary/capacity/photo/photoAttribution/facets/count` all unchanged). The `near=` branch shape (`results[]`) is untouched — pre-existing asymmetry, not introduced here.
- Derived from verified claims: value is `p.claims.length`, the same source the brief mandates for the `verified facts: N` chip. It ships a count, not claim bodies — smaller payload, no provenance leak.
- Required by the brief's own design: `places/page.tsx` is a client component fetching via the API, so "same decision-info line" there cannot use `p.claims.length` directly without over-fetching full claim arrays. The derived count is the minimal correct wiring.

Same logic approves `PhotoLightbox`'s optional `sourcePage?: string | null`: accepts a superset of the brief's four-field photo shape, preserves the pre-existing per-photo "source" links across the grid swap, values mapped verbatim. Backwards-compatible, disclosed in the report.

## Findings / nits (non-blocking)

1. `SeasonExplorer` tabs lack arrow-key tab navigation (`role="tablist"` without arrow-key handling); brief does not require it — leave as is.
2. Report's PowerShell `Select-String`-instead-of-`grep` note is accurate for this shell; independently confirmed `AttractionsRail` in `page.tsx` and successful build.
3. Path shorthand: brief/report say `src/...`, actual tree is `apps/web/src/...`. No action — consistent throughout the task series.

Quality: high. Contracts verbatim, disclosures complete and accurate, Task 4 surface untouched, build clean.
