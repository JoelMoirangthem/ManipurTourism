# Task 1 Report: Trip context + wishlist libs with guard tests

Status: DONE_WITH_CONCERNS

## What was created

1. `apps/web/src/lib/__tests__/tripWidget.test.mjs` — guard test copied verbatim from the brief (3 tests: file existence, trip-context interface/storage-guard/no-availability wording, wishlist pure/bounded/key/cap).
2. `apps/web/src/lib/tripContext.ts` — `TripContext` interface (`destination`, `checkIn`, `checkOut`, `travellers`, `interests`), `EMPTY_TRIP` (travellers: 2), `readTripContext()`, `writeTripContext(patch)`, `tripToPlacesParams()` using `URLSearchParams`; SSR-guarded (`typeof window`) + try/catch storage against `mit_trip_context_v1`.
3. `apps/web/src/lib/wishlist.ts` — `readWishlist()` / `toggleWishlist(ids, id)` persisted under `mit_wishlist_v1`, capped at 50 ids, SSR-guarded + try/catch.

Exported names match the brief verbatim: `TripContext`, `EMPTY_TRIP`, `readTripContext`, `writeTripContext`, `tripToPlacesParams`, `readWishlist`, `toggleWishlist`.

## Test commands + output

- RED step: `node --test src/lib/__tests__/tripWidget.test.mjs` → FAIL, 0 pass / 3 fail with `tripContext.ts must exist` as expected.
- GREEN step: `node --test src/lib/__tests__/tripWidget.test.mjs src/lib/__tests__/assistantBrief.test.mjs src/lib/__tests__/discovery.test.mjs src/lib/__tests__/fixtures.test.mjs src/lib/__tests__/weather.test.mjs` → **PASS, 18/18 tests** (3 new + 15 existing).
- Typecheck: `npx tsc --noEmit -p tsconfig.json` → exit 0, no errors.

## Files changed

- Created: `apps/web/src/lib/__tests__/tripWidget.test.mjs`
- Created: `apps/web/src/lib/tripContext.ts`
- Created: `apps/web/src/lib/wishlist.ts`
- No other files touched. No git commands run (no repo exists, per instructions).

## Concerns (brief contradicts itself — deviations required to go green)

1. **Verbatim `tripContext.ts` fails its own guard.** The brief's code contains the word "availability" in the header comment ("never availability") and "unavailable" in the catch comment ("storage unavailable"), both of which trip the guard regex `/available|price|book/i`. Reworded to "never live inventory" and "storage inaccessible". All exported names and logic are unchanged.
2. **Verbatim `wishlist.ts` fails its own guard.** The brief's code uses `.slice(0, MAX_SAVED)` but the guard regex requires the literal text `slice(0, 50)`. Replaced the `MAX_SAVED` const with the literal `50` in both `slice` calls (same runtime cap). Exported names and behaviour unchanged.
3. Recommend the brief author fix the verbatim snippets (or relax the two guard regexes) so future implementers don't have to deviate. Later tasks (3–6) can rely on the exported names, which are exactly as specified.
