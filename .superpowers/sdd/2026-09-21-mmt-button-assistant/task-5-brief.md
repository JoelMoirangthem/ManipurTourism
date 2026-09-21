### Task 5: Attractions rail, season explorer, decision cards, lightbox


**Files:**
- Modify: `apps/web/src/app/page.tsx` (rail + explorer sections, card upgrades, wishlist hearts)
- Modify: `apps/web/src/app/places/page.tsx` (decision-info block + hearts on cards)
- Modify: `apps/web/src/app/places/[id]/page.tsx` (lightbox island)
- Create: `apps/web/src/components/AttractionsRail.tsx`, `SeasonExplorer.tsx`, `WishlistHeart.tsx`, `PhotoLightbox.tsx` (client islands)

**Interfaces:**
- Consumes: `toggleWishlist`, `readWishlist` (Task 1); place fields already on seed records.
- Produces: no new cross-task names (self-contained islands).

- [ ] **Step 1: Write the failing check**

Run: `grep -q "AttractionsRail\|SeasonExplorer\|PhotoLightbox" src/app/page.tsx "src/app/places/[id]/page.tsx" 2>/dev/null && echo "INTERACTIVE" || echo "MISSING interactive"`
Expected: `MISSING interactive`

- [ ] **Step 2: Implement islands (exact contracts)**

`WishlistHeart.tsx`: props `{ placeId: string }`; `useState` + `useEffect` hydrating from `readWishlist()`; click calls `toggleWishlist`; heart SVG fills gold when saved; `aria-pressed`, `aria-label="Save place"`; 44px touch target.

`AttractionsRail.tsx`: props `{ places: { id: string; name: string; district: string; summary: string; photo: string | null }[] }`; horizontal `overflow-x-auto snap-x` rail; rank numbers `String(i + 1).padStart(2, "0")`; each card links to `/places/{id}`; `WishlistHeart` on each; heading "Top attractions in Manipur".

`SeasonExplorer.tsx`: props `{ seasons: { name: string; months: string; temp: string; note: string }[] }`; `useState(0)` selected tab; tab buttons `aria-selected`; panel shows months/temp/note; content from props only (no invented copy).

`PhotoLightbox.tsx`: props `{ photos: { storageKey: string; caption: string; attribution: string; license: string }[]; startIndex?: number }`; thumbnail grid button opens fullscreen `role="dialog"` overlay; prev/next buttons + ArrowLeft/ArrowRight keys + Esc close; caption + attribution + license shown per photo; body scroll locked while open.

In `page.tsx`: render `<AttractionsRail places={...} />` after collections (map seed places to the prop shape); replace seasons grid with `<SeasonExplorer seasons={SEASONS} />`; add `<WishlistHeart placeId={p.id} />` to featured cards; add decision-info line (season tag + "verified facts: N" chip from `p.claims.length`).

In `places/page.tsx`: same decision-info line + heart per card (extend the `Card` type usage already there; `places` carry `id`).

In `places/[id]/page.tsx`: replace the seed-photos grid with `<PhotoLightbox photos={seedPhotos} />` (map `ph` fields verbatim).

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: compiled successfully

Run: `grep -q "AttractionsRail" src/app/page.tsx && echo "INTERACTIVE"`
Expected: `INTERACTIVE`

