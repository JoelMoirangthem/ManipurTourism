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
