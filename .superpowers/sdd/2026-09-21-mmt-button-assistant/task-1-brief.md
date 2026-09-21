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

