# Task 5 report — Attractions rail, season explorer, decision cards, lightbox

Status: complete.

Test summary: `npm run build` compiled successfully (Next 16.3.5, 22 routes); `AttractionsRail` present in `src/app/page.tsx` (INTERACTIVE).

Concerns:
- `src/app/api/places/route.ts` gained an additive `claimsCount` field (from `p.claims.length`) because the places-cards decision line needs the verified-facts count and the API previously omitted claims; no existing fields changed.
- Season tag on decision lines uses site-wide `SEASONS[0]` ("Best window · Oct – Mar") since seed place records carry no per-place season field; per-place season mapping would be invented copy.
- `PhotoLightbox` photo type adds optional `sourcePage` beyond the brief's four fields so the existing per-photo "source" links survive the grid swap; values mapped verbatim.
- `WishlistHeart` calls `preventDefault` + `stopPropagation` on click because hearts render inside card `<Link>`s; without this, saving a place would navigate.
- Extra islands `CountUp.tsx` + `Reveal.tsx` (per task instruction motion rule) both resolve instantly / skip hiding under `prefers-reduced-motion: reduce`; `Reveal` wraps rail, explorer, and featured sections only, festivals anchor untouched.
- Shell is PowerShell without `grep`: Step 1/3 checks were run via `Select-String` equivalents (`MISSING` confirmed pre-edit by no-match, `INTERACTIVE` confirmed post-edit).
