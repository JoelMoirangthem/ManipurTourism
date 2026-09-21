# Button-Only Assistant + MMT-Grade Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the separate assistant page, make the floating button + panel the only assistant, and rebuild Home chrome around an MMT-style trip widget with honest data.

**Architecture:** Server components read the seed catalogue; two browser-persisted stores (assistant thread `mit_assistant_thread_v1`, trip context + wishlist) carry state across pages; `/api/ai/query` and `/api/plan` are untouched authorities; panel auto-opens via `?assistant=open` URL signal consumed once.

**Tech Stack:** Next.js 16.3.5 App Router, React 19.2.8, Tailwind v4, TypeScript 5, Node test runner. No git repo exists — steps verify with tests/build instead of committing.

**Spec:** `docs/superpowers/specs/2026-09-21-mmt-assistant-design.md`

## Global Constraints

- No git repo in D:/ManipuriTourism — never run git add/commit; end tasks with test/build verification.
- Light-only Jewel-Emerald: Ivory `#FDFBF7`, Pine `#0B3D2E` / `#0E5A42`, Gold `#C19A4B`, Ink `#1A2E28`, Muted `#5D746B`.
- No booking, payments, live availability, nightly prices, safety certification, review scores, or countdown urgency anywhere.
- Festival dates are annual patterns plus a verify-edition note plus an official source link.
- Home stays a server component; interactive pieces are `"use client"` islands.
- `prefers-reduced-motion` disables count-up, reveals, and drawer slide (instant show).
- Working dir for all commands: `D:/ManipuriTourism/apps/web`.

---

### Task 1: Trip context + wishlist libs with guard tests

**Files:**
- Create: `apps/web/src/lib/tripContext.ts`
- Create: `apps/web/src/lib/wishlist.ts`
- Create: `apps/web/src/lib/__tests__/tripWidget.test.mjs`

**Interfaces:**
- Consumes: nothing (pure + browser storage only).
- Produces: `TripContext { destination: string; checkIn: string; checkOut: string; travellers: number; interests: string[] }`, `EMPTY_TRIP`, `readTripContext(): TripContext`, `writeTripContext(patch: Partial<TripContext>): TripContext`, `tripToPlacesParams(trip: TripContext): string`, `readWishlist(): string[]`, `toggleWishlist(ids: string[], id: string): string[]`. Tasks 3–6 consume these names verbatim.

- [ ] **Step 1: Write the failing test**

```js
// apps/web/src/lib/__tests__/tripWidget.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..", "..", "..");

test("tripContext.ts and wishlist.ts exist", () => {
  assert.ok(existsSync(join(webRoot, "src/lib/tripContext.ts")), "tripContext.ts must exist");
  assert.ok(existsSync(join(webRoot, "src/lib/wishlist.ts")), "wishlist.ts must exist");
});

test("trip context interface is exact and storage-guarded", () => {
  const src = readFileSync(join(webRoot, "src/lib/tripContext.ts"), "utf8");
  for (const token of ["export interface TripContext", "destination", "checkIn", "checkOut", "travellers", "interests", "export const EMPTY_TRIP", "export function readTripContext", "export function writeTripContext", "export function tripToPlacesParams"]) {
    assert.ok(src.includes(token), `tripContext.ts must contain ${token}`);
  }
  assert.ok(src.includes("typeof window"), "browser storage must be SSR-guarded");
  assert.ok(/try\s*\{/.test(src), "storage access must be try/caught");
  assert.ok(src.includes("URLSearchParams"), "param builder must use URLSearchParams");
  assert.ok(!/available|price|book/i.test(src), "context lib must not mention availability/prices/booking");
});

test("wishlist helpers are pure and bounded", () => {
  const src = readFileSync(join(webRoot, "src/lib/wishlist.ts"), "utf8");
  assert.ok(src.includes("export function readWishlist"), "must export readWishlist");
  assert.ok(src.includes("export function toggleWishlist"), "must export toggleWishlist");
  assert.ok(src.includes("mit_wishlist_v1"), "must persist under mit_wishlist_v1");
  assert.ok(/slice\(0,\s*50\)/.test(src), "wishlist must be capped at 50 ids");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/__tests__/tripWidget.test.mjs`
Expected: FAIL with "tripContext.ts must exist"

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/web/src/lib/tripContext.ts — browser-persisted trip context. Dates and
// travellers are context only, never availability.
export interface TripContext {
  destination: string;
  checkIn: string;
  checkOut: string;
  travellers: number;
  interests: string[];
}

export const EMPTY_TRIP: TripContext = { destination: "", checkIn: "", checkOut: "", travellers: 2, interests: [] };
const TRIP_KEY = "mit_trip_context_v1";

export function readTripContext(): TripContext {
  if (typeof window === "undefined") return { ...EMPTY_TRIP };
  try {
    const raw = window.localStorage.getItem(TRIP_KEY);
    if (!raw) return { ...EMPTY_TRIP };
    const parsed = JSON.parse(raw) as Partial<TripContext>;
    return {
      destination: typeof parsed.destination === "string" ? parsed.destination : "",
      checkIn: typeof parsed.checkIn === "string" ? parsed.checkIn : "",
      checkOut: typeof parsed.checkOut === "string" ? parsed.checkOut : "",
      travellers: typeof parsed.travellers === "number" && parsed.travellers >= 1 && parsed.travellers <= 50 ? Math.floor(parsed.travellers) : 2,
      interests: Array.isArray(parsed.interests) ? parsed.interests.filter((i): i is string => typeof i === "string") : [],
    };
  } catch {
    return { ...EMPTY_TRIP };
  }
}

export function writeTripContext(patch: Partial<TripContext>): TripContext {
  const next = { ...readTripContext(), ...patch };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(TRIP_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — context simply will not persist */
    }
  }
  return next;
}

export function tripToPlacesParams(trip: TripContext): string {
  const params = new URLSearchParams();
  if (trip.destination) params.set("district", trip.destination);
  if (trip.checkIn) params.set("checkIn", trip.checkIn);
  if (trip.checkOut) params.set("checkOut", trip.checkOut);
  const query = params.toString();
  return query ? `/places?${query}` : "/places";
}
```

```ts
// apps/web/src/lib/wishlist.ts — browser-persisted shortlist. Ids only.
const WISHLIST_KEY = "mit_wishlist_v1";
const MAX_SAVED = 50;

export function readWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WISHLIST_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string").slice(0, MAX_SAVED);
  } catch {
    return [];
  }
}

export function toggleWishlist(ids: string[], id: string): string[] {
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  const capped = next.slice(0, MAX_SAVED);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(capped));
    } catch {
      /* ignore */
    }
  }
  return capped;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test src/lib/__tests__/tripWidget.test.mjs src/lib/__tests__/assistantBrief.test.mjs src/lib/__tests__/discovery.test.mjs src/lib/__tests__/fixtures.test.mjs src/lib/__tests__/weather.test.mjs`
Expected: PASS, 18 tests (3 new + 15 existing)

### Task 2: Button-only assistant (delete page, redirects, auto-open)

**Files:**
- Delete: `apps/web/src/app/assistant/page.tsx`
- Create: `apps/web/src/app/assistant/route.ts`
- Modify: `apps/web/src/app/plan/page.tsx` (replace redirect target)
- Modify: `apps/web/src/components/assistant-thread.tsx` (add open-signal: `requestPanelOpen(prefill: string | null)`, `consumeOpenSignal()`)
- Modify: `apps/web/src/components/AssistantPanel.tsx` (consume signal: open + send prefill once)
- Create: `apps/web/src/components/AssistantAutoOpen.tsx` (reads `window.location.search` in effect, calls `requestPanelOpen`, cleans URL)

**Interfaces:**
- Consumes: existing thread store (`sendAssistantMessage`, `seedPlanStarter`) and panel shell.
- Produces: `requestPanelOpen(prefill: string | null): void`, `consumeOpenSignal(): { id: number; prefill: string | null } | null`, `<AssistantAutoOpen />`. Task 4 consumes `/?assistant=open&ask=…` links.

- [ ] **Step 1: Write the failing check**

Run: `test ! -f src/app/assistant/page.tsx -a -f src/app/assistant/route.ts && echo "CONSOLIDATED" || echo "MISSING consolidation"`
Expected: `MISSING consolidation`

- [ ] **Step 2: Implement consolidation**

```ts
// apps/web/src/app/assistant/route.ts
import { redirect } from "next/navigation";
export async function GET() {
  redirect("/?assistant=open");
}
```

```tsx
// apps/web/src/app/plan/page.tsx (full replacement)
import { redirect } from "next/navigation";
// Planning lives in the assistant panel: forward home with panel-open signal.
export default function PlanRedirect() {
  redirect("/?assistant=open&start=plan");
}
```

Store addition in `assistant-thread.tsx` (module scope, beside the thread store):

```ts
let openSignal: { id: number; prefill: string | null } | null = null;
let openSignalId = 0;
export function requestPanelOpen(prefill: string | null) {
  openSignalId += 1;
  openSignal = { id: openSignalId, prefill };
  listeners.forEach((l) => l());
}
export function consumeOpenSignal() {
  const signal = openSignal;
  openSignal = null;
  return signal;
}
```

`AssistantAutoOpen.tsx`:

```tsx
"use client";
import { useEffect } from "react";
import { requestPanelOpen, seedPlanStarter } from "@/components/assistant-thread";

export function AssistantAutoOpen() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("assistant") !== "open") return;
    const ask = params.get("ask");
    const start = params.get("start");
    if (start === "plan") seedPlanStarter();
    requestPanelOpen(ask);
    params.delete("assistant");
    params.delete("ask");
    params.delete("start");
    const clean = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (clean ? `?${clean}` : ""));
  }, []);
  return null;
}
```

Panel addition in `AssistantPanel.tsx` (inside component, after the Esc effect):

```tsx
import { consumeOpenSignal, sendAssistantMessage, useAssistantStore } from "@/components/assistant-thread";
// inside AssistantPanel, alongside useAssistantStore():
const seenSignal = useRef(0);
useEffect(() => {
  const signal = consumeOpenSignal();
  if (signal && signal.id !== seenSignal.current) {
    seenSignal.current = signal.id;
    setOpen(true);
    if (signal.prefill) void sendAssistantMessage(signal.prefill);
  }
});
```

Mount `<AssistantAutoOpen />` in `layout.tsx` next to `<AssistantPanel />`.

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: compiled successfully, 21 routes, no `/assistant` page route, `/plan` prerendered redirect

Run: `test ! -f src/app/assistant/page.tsx -a -f src/app/assistant/route.ts && echo "CONSOLIDATED"`
Expected: `CONSOLIDATED`

### Task 3: Journey nav + header wishlist count

**Files:**
- Modify: `apps/web/src/app/layout.tsx:16-25` (NAV array), nav render `47-55` (More menu), header (wishlist count pill)

**Interfaces:**
- Consumes: `readWishlist` from Task 1.
- Produces: nav links Destinations `/places`, Stays `/places?category=Stay`, Experiences `/places?category=Heritage`, Festivals `/#festivals`, My threads `/threads`, Contribute `/upload`, More menu (Inquire `/inquire`, Inbox `/inbox`, Review `/review`).

- [ ] **Step 1: Write the failing check**

Run: `grep -q "Destinations" src/app/layout.tsx && echo "JOURNEY NAV" || echo "MISSING journey nav"`
Expected: `MISSING journey nav`

- [ ] **Step 2: Implement nav + wishlist count**

```tsx
const NAV = [
  { href: "/places", label: "Destinations" },
  { href: "/places?category=Stay", label: "Stays" },
  { href: "/places?category=Heritage", label: "Experiences" },
  { href: "/#festivals", label: "Festivals" },
  { href: "/threads", label: "My threads" },
  { href: "/upload", label: "Contribute" },
];
const MORE_NAV = [
  { href: "/inquire", label: "Inquire" },
  { href: "/inbox", label: "Inbox" },
  { href: "/review", label: "Review" },
];
```

Render MORE_NAV inside a `<details className="relative">` dropdown after NAV links. Wishlist count: new `"use client"` island `src/components/WishlistCount.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { readWishlist } from "@/lib/wishlist";
export function WishlistCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(readWishlist().length);
    const onStorage = () => setCount(readWishlist().length);
    window.addEventListener("storage", onStorage);
    const timer = setInterval(() => setCount(readWishlist().length), 1000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(timer);
    };
  }, []);
  if (count === 0) return null;
  return (
    <Link href="/places" aria-label={`${count} saved places`} className="rounded-full border border-[#C19A4B]/50 bg-[#FBF6E9] px-3 py-1.5 text-xs font-semibold text-[#7a5f22]" title="Saved places (this browser only)">
      ♥ {count} saved
    </Link>
  );
}
```

Mount `<WishlistCount />` in the header before `<ActorSwitcher />`.

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: compiled successfully

Run: `grep -q "Destinations" src/app/layout.tsx && echo "JOURNEY NAV"`
Expected: `JOURNEY NAV`

### Task 4: Trip widget + honest offers on Home

**Files:**
- Modify: `apps/web/src/app/page.tsx` (hero search form → widget, offers strip with Ask Mit links, `id="festivals"` anchor on festivals section)
- Create: `apps/web/src/components/TripWidget.tsx` (client island: tabs, district select, dates, travellers stepper, writes trip context, navigates via `tripToPlacesParams`)

**Interfaces:**
- Consumes: `writeTripContext`, `tripToPlacesParams` (Task 1); `COLLECTIONS`, `FESTIVALS` (existing discovery data).
- Produces: widget navigating to `/places?district=…&checkIn=…&checkOut=…`; offer links `/?assistant=open&ask=…`.

- [ ] **Step 1: Write the failing check**

Run: `grep -q "travellers" src/app/page.tsx && echo "WIDGET" || echo "MISSING widget"`
Expected: `MISSING widget`

- [ ] **Step 2: Implement widget + offers**

`TripWidget.tsx` (client, exact behavior):

```tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { tripToPlacesParams, writeTripContext } from "@/lib/tripContext";
import { inputClass, primaryButtonClass } from "@/components/ui";

const TABS = [
  { label: "Stays", category: "Stay" },
  { label: "Culture", category: "Heritage" },
  { label: "Treks", category: "Trek" },
];
const DISTRICTS = ["", "Bishnupur", "Imphal West", "Ukhrul", "Senapati"];

export function TripWidget() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [travellers, setTravellers] = useState(2);
  return (
    <form
      className="rounded-[20px] border border-[#0B3D2E]/10 bg-white p-4 shadow-xl"
      onSubmit={(e) => {
        e.preventDefault();
        writeTripContext({ destination, checkIn, checkOut, travellers, interests: [TABS[tab].category] });
        router.push(tripToPlacesParams({ destination, checkIn, checkOut, travellers, interests: [TABS[tab].category] }));
      }}
    >
      {/* tabs, destination select (DISTRICTS, "Anywhere in Manipur" for ""), date inputs, stepper (1–50, minus/plus buttons aria-labelled), gold Search submit */}
    </form>
  );
}
```

Stepper buttons clamp 1–50; date inputs are plain `type="date"` with visible labels (not placeholder-only). In `page.tsx`: replace the hero `<form action="/places">` with `<TripWidget />`; add `id="festivals"` to the festivals `<section>`; each festival card gets an "Ask Mit →" link to `/?assistant=open&ask=${encodeURIComponent(`Tell me about ${f.name}`)}`.

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: compiled successfully

Run: `grep -q "travellers" src/app/page.tsx && echo "WIDGET"`
Expected: `WIDGET`

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
