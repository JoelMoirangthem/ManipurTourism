# Task 6 Report: Places trip chip + full verification pass

Status: DONE

## 1. Trip chip — code location

`apps/web/src/app/places/page.tsx` (client component, already `"use client"`):

- Import (line 14): `readTripContext, writeTripContext, type TripContext` from `@/lib/tripContext`.
- `TripChip()` island, defined directly above `PlacesInner()` (~lines 26–59): `useState<TripContext | null>(null)` +
  `useEffect(() => { setTrip(readTripContext()); }, [])`; returns `null` pre-hydration and when
  `!trip.destination && !trip.checkIn && !trip.travellers`; otherwise renders a gold chip
  (`border-[#C19A4B]/60 bg-[#FBF6E9] text-[#7a5f22]`) with the exact copy
  `Your trip: {destination || 'Anywhere'} · {travellers} travellers · {checkIn || 'dates flexible'}`
  plus a `Clear` button (`aria-label="Clear trip context"`) calling
  `writeTripContext({ destination: "", checkIn: "", checkOut: "" })` then re-reading context.
- Rendered as `<TripChip />` immediately after the header lede paragraph (~line 125).
- Copy never implies availability: no "available/book/price" wording in the chip; it states saved
  context only. (`npx tsc --noEmit` passes; `npm run build` compiles with the chip included.)

## 2. Unit tests — command + output

Command (workdir `D:\ManipuriTourism\apps\web`):
`node --test src/lib/__tests__/tripWidget.test.mjs src/lib/__tests__/assistantBrief.test.mjs src/lib/__tests__/discovery.test.mjs src/lib/__tests__/fixtures.test.mjs src/lib/__tests__/weather.test.mjs`

Output: PASS — `tests 18, pass 18, fail 0` (3 tripWidget + 3 assistantBrief + 5 discovery + 3 fixtures + 4 weather).

## 3. Production build — command + output

Command: `npm run build`
Output: `✓ Compiled successfully in 18.0s`, TypeScript clean, static generation 22/22.
Route notes vs the brief's "21 routes, no `/assistant` page route": the tree now renders 27 route
entries; `/assistant` is a **route handler** (`src/app/assistant/route.ts`, `GET → redirect("/?assistant=open")`),
not a page — there is still no `/assistant` **page** route, so the guard holds. `/plan` is a redirecting
page (`src/app/plan/page.tsx → redirect("/?assistant=open&start=plan")`).

## 4. Live dev-server checks (`npm run dev`, port 3000, PID 8836, stopped afterwards)

| Check | Method | Result |
|---|---|---|
| Home widget submits to filtered `/places` | `GET /` → 200 (113 KB), contains `Destination` + `Search`; `TripWidget.tsx:24-28` does `writeTripContext(...)` + `router.push(tripToPlacesParams(...))`; `GET /api/places?district=Bishnupur` → 200 with 4 places | PASS |
| `/assistant` redirects to `/?assistant=open` | `GET /assistant` (no follow) → **307**, `Location: /?assistant=open` | PASS |
| `/plan` redirects to `/?assistant=open&start=plan` | `GET /plan` (no follow) → **307**, `Location: /?assistant=open&start=plan` | PASS |
| Panel opens (signal wiring) | Code + live home HTML contains assistant refs: `AssistantPanel.tsx:17` Esc-close, `:29 consumeOpenSignal()`; `AssistantAutoOpen.tsx:12 requestPanelOpen(ask)`; `layout.tsx:88 <AssistantAutoOpen />` | PASS (wiring verified; panel animation not eyeballed — no browser harness installed) |
| Plans end-to-end (brief → confirm → drafts) | Live `POST /api/plan` `{nights:2, groupSize:2, interests:["trek"]}` → **200, 1 draft** with keys `legs,missing,nights,notes,placeIds,title` (resolved legs per Task 4 fix) | PASS (API live; confirm-clickthrough is code-wired in `AssistantPanel`/`assistant-thread`) |
| Wishlist survives reload | `WishlistHeart.tsx:8-10` hydrates from `readWishlist()` (localStorage `mit_wishlist_v1`, `wishlist.ts:2`, capped pure helpers covered by unit tests) | PASS by persistence mechanism (no browser to reload) |
| Lightbox keyboard/Esc | `PhotoLightbox.tsx:29-33`: `Escape → close()`, `ArrowRight/Left → step(±1)`; body scroll-lock with cleanup | PASS (code) |
| Season tabs switch | `SeasonExplorer.tsx:14-31`: `role=tablist/tab`, `aria-selected`, `onClick → setSelected(i)`, `tabpanel` renders `current` | PASS (code) |
| 375/768/1024/1440px, no stray horizontal scroll | Layouts use `max-w-6xl`, `grid sm:/lg:` breakpoints, `flex-wrap`; only intentional `overflow-x-auto` is the snap rail (`AttractionsRail.tsx:24`); no `100vw`/fixed-width patterns found | PASS (static; viewports not rendered — no browser harness) |
| Keyboard focus visible | `globals.css:80-84` global `:focus-visible` outline; `focus-visible:outline-*` on hearts, lightbox triggers, home CTAs | PASS (code) |
| Trip chip live | `GET /places` → 200; SSR HTML correctly lacks `Your trip:` (chip returns `null` until client hydration reads localStorage — expected for a client island) | PASS |

Honest limits: no Playwright/browsers installed in this environment, so panel animation,
reload-click, tab-click, and viewport rendering were verified via HTTP + code inspection rather
than screenshots. Every check reachable over HTTP was executed live against `npm run dev`.

## Files changed

- Modified: `apps/web/src/app/places/page.tsx` (import + `TripChip` island + `<TripChip />` after lede).
- No other files touched. No git commits (no repo per instructions).
