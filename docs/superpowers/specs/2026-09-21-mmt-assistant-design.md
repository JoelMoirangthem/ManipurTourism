# MMT-Grade Home + Button-Only Assistant

Date: 2026-09-21
Status: proposed — awaiting user review before implementation plan
Scope: Approach A. MMT look + widgets on honest data. No booking, payments,
live availability, nightly prices, or safety certification anywhere.

## 1. Goal
Make the site feel like a MakeMyTrip-grade tourism experience — trip widget,
journey nav, decision-rich cards, honest offers, interactive attraction
showcase — while planning and Q&A live only in the floating assistant button
+ side panel. No separate assistant page.

## 2. Architecture & routes
- Delete `src/app/assistant/page.tsx`. Assistant exists only as
  `AssistantPanel`, mounted once in `layout.tsx`, on the existing
  localStorage thread store (`mit_assistant_thread_v1`).
- `/plan` keeps redirecting, but into the panel: it becomes a route that
  sends the visitor to `/` with the panel auto-opened and a planning starter
  seeded. All existing `/plan` links (nav, home CTAs, place detail) keep
  working with zero edits.
- New `src/lib/tripContext.ts` (localStorage): `{ destination, checkIn,
  checkOut, travellers, interests }`. Home widget writes it; `/places`
  hydrates filters + shows a "your trip" chip; the panel reads it to pre-fill
  briefs. No backend, no new APIs. `/api/ai/query` and `/api/plan` untouched.
- Reuse from the existing tree: `assistant-thread.tsx` (store + thread UI),
  `AssistantPanel.tsx` (button + drawer shell), `assistantBrief.ts` (parser).
  New: `tripContext.ts`, home widget, attractions rail, wishlist, lightbox,
  season explorer. Deleted: `assistant/page.tsx` only.

## 3. Home trip widget + journey nav
- Emerald hero overlaid by an MMT-style widget card: tabs Stays /
  Experiences / Treks (map to `category` filters), destination district
  select, check-in/out date inputs (optional), travellers stepper, gold
  Search button → `/places?district=…&category=…&checkIn=…&checkOut=…` plus
  saved trip context.
- Below: honest offers strip (festival windows + best-season cards, each with
  source link + "ask host to confirm"), then existing collections/seasons.
- Nav becomes journey-oriented: Destinations (`/places`), Stays
  (`/places?category=Stay`), Experiences (`/places`), Festivals (home
  anchor), My threads, Contribute. Assistant/Plan/Inbox/Review move to a
  compact "More" menu. No new routes.

## 4. Cards, offers, attraction showcase (interactive)
- Place cards gain decision info from verified records only: best-season tag
  (discovery seasons), suggested duration labeled estimate, district +
  distance-from-Imphal note where coordinates exist, one-line "why go" hook
  from the summary, capacity line restyled as "listed capacity — availability
  on enquiry". Trust chip "verified facts: N" with claim count. No invented
  scores or ratings UI.
- Offers strip: 3 honest cards (Sangai Nov window, Shirui Lily May, winter
  best-season Oct–Mar) with festival source links, "dates shift yearly —
  confirm before travel", and "Ask Mit" CTA opening the panel with a
  pre-filled question. No prices, discounts, or countdowns.
- Top-attractions rail: horizontal scroll-snap showcase with large imagery
  and rank numbers 01–08 from verified places, "why go" hook each.
- Wishlist hearts on cards, persisted in browser localStorage, count in
  header. No account, no backend.
- Place-detail gallery lightbox: fullscreen photo viewer with captions +
  attribution, keyboard navigable, Esc closes.
- Season explorer tabs (Oct–Mar / Mar–Jun / Jun–Sep) switching what-to-do
  content, replacing static columns.
- One orchestrated motion moment: count-up stats + single scroll reveal for
  the rail; everything else still; `prefers-reduced-motion` shows static
  numbers and no reveal.

## 5. Honesty guards & errors
- Empty-destination search falls back to the full catalogue, never invents.
- Dates/travellers render as a "your trip" context chip on `/places`, never
  as availability.
- Festival/offer cards always carry source + verify-edition note; no urgency
  patterns of any kind.
- Panel keeps existing guards: budget without basis forces the basis pick;
  drafts show missing-confirmations; replies-are-not-bookings disclaimer on
  panel and thread.
- `/assistant` URL serves a clean redirect to home with the panel opened, so
  bookmarks never strand. `/plan` same treatment.

## 6. Testing
- Unit (node --test): trip-context read/write/merge; brief parser (existing
  guards + merge tests); widget param builder (full + empty-safe query
  strings); wishlist add/remove/persist logic (pure helpers).
- Build: `npm run build` clean, 21 routes (`/assistant` gone).
- Live dev-server: widget submits to filtered `/places`; `/assistant` and
  `/plan` open home + panel; panel plans end-to-end (brief → confirm →
  drafts); wishlist survives reload; lightbox keyboard/Esc; season tabs
  switch; count-up static under reduced-motion.
- Responsive 375/768/1024/1440px, keyboard + Esc handling, contrast 4.5:1,
  no horizontal scroll outside the snap rail.

## 7. Non-goals
No map, no CMS, no PostGIS, no bookings/payments, no accounts/server
history, no turn-by-turn routing, no review scores.

## Spec self-review
- Placeholders: none — every component, file, param, and copy rule is
  concrete; blurbs derive from existing seed fields.
- Consistency: static content never claims live status; widget params feed
  only filters + context chips; panel remains the single assistant surface;
  no new backend assumed anywhere.
- Scope: one Home + global-chrome slice plus deletions; fits a single
  implementation plan; no cross-page rewrites beyond cards/nav.
- Ambiguity: "attraction style" pinned to the 5 listed interactions;
  "MMT-like" pinned to look + widgets on honest data per user lock;
  festival dates explicitly patterns + verify notes.
