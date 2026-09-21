### Task 6: Places trip chip + full verification pass


**Files:**
- Modify: `apps/web/src/app/places/page.tsx` (trip chip reading `readTripContext()`)
- Modify: none otherwise (verification only)

**Interfaces:**
- Consumes: `readTripContext` (Task 1).

- [ ] **Step 1: Add the trip chip**

In `places/page.tsx`, after the header lede, render a client island (inline in the file or `TripChip` in `TripWidget.tsx`): reads `readTripContext()` in `useEffect`; if destination/checkIn/travellers set, shows gold chip "Your trip: {destination || 'Anywhere'} · {travellers} travellers · {checkIn || 'dates flexible'}" with a clear button calling `writeTripContext({ destination: "", checkIn: "", checkOut: "" })`. Copy never implies availability.

- [ ] **Step 2: Run all unit tests**

Run: `node --test src/lib/__tests__/tripWidget.test.mjs src/lib/__tests__/assistantBrief.test.mjs src/lib/__tests__/discovery.test.mjs src/lib/__tests__/fixtures.test.mjs src/lib/__tests__/weather.test.mjs`
Expected: PASS, 18 tests

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: compiled successfully, 21 routes, no `/assistant` page route

- [ ] **Step 4: Live dev-server checks**

Run `npm run dev`, then: home widget submits to filtered `/places`; `/assistant` redirects to `/?assistant=open`; `/plan` redirects to `/?assistant=open&start=plan`; panel opens, plans end-to-end (brief → confirm → drafts); wishlist survives reload; lightbox keyboard/Esc; season tabs switch; 375/768/1024/1440px with no stray horizontal scroll; keyboard focus visible throughout.

## Self-Review

- Spec coverage: §2 routes/store → Tasks 1–2; §3 widget/nav → Tasks 3–4; §4 cards/offers/rail/wishlist/lightbox/explorer/motion → Task 5 (+ count-up in Task 5 rail/stats edit); §5 guards → Tasks 2, 4, 6 chip copy; §6 tests → Task 6; §7 non-goals respected (no map/CMS/scores/accounts).
- Placeholder scan: no TBD/TODO/later/appropriate/edge-cases; every step carries exact paths, names, copy, and commands. Motion detail (count-up + single reveal, reduced-motion static) is specified in Task 5 acceptance via existing `premium-card` + media-query patterns — the implementer wires `prefers-reduced-motion` checks already in `globals.css`.
- Type consistency: `TripContext`/`EMPTY_TRIP`/`readTripContext`/`writeTripContext`/`tripToPlacesParams` and `readWishlist`/`toggleWishlist` spelled identically in Tasks 1, 3, 4, 6; `requestPanelOpen`/`consumeOpenSignal`/`AssistantAutoOpen` identical in Task 2 and Task 4 links; island prop shapes defined once in Task 5 and used verbatim.
