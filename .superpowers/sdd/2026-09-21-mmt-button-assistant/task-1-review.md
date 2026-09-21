# Task 1 Review: Trip context + wishlist libs with guard tests

Verdict: **PASS — spec-compliant and quality-acceptable** (2 Minor notes, 0 blocking issues)

Scope: brief `task-1-brief.md`, report `task-1-report.md`, implementation `apps/web/src/lib/tripContext.ts` + `apps/web/src/lib/wishlist.ts` + `apps/web/src/lib/__tests__/tripWidget.test.mjs`.
Binding constraints checked: exact exported names, SSR guards, try/catch storage, URLSearchParams builder, 50-cap, no availability/price/booking language.

## Verification evidence (fresh, this review)

- `node --test src/lib/__tests__/tripWidget.test.mjs src/lib/__tests__/assistantBrief.test.mjs src/lib/__tests__/discovery.test.mjs src/lib/__tests__/fixtures.test.mjs src/lib/__tests__/weather.test.mjs` (workdir `apps/web`) → **18 pass / 0 fail**.
- Grep `available|price|book` in `tripContext.ts` → no matches (guard satisfied).
- Grep `wishlist.ts` → `typeof window` ×2, `try` ×2, `slice(0, 50)` ×2 (both read and toggle paths).
- `npx tsc --noEmit -p tsconfig.json` → no output, exit 0.
- Test file matches brief Step 1 snippet verbatim (3 tests, same tokens/regexes).

## Spec compliance (all binding constraints met)

| Constraint | Result |
|---|---|
| Exact exported names (`TripContext`, `EMPTY_TRIP`, `readTripContext`, `writeTripContext`, `tripToPlacesParams`, `readWishlist`, `toggleWishlist`) + exact signatures | PASS — all present with brief-exact signatures |
| SSR guards (`typeof window`) | PASS — read returns safe default on server; write/toggle skip persistence on server |
| try/catch storage | PASS — all `localStorage` access wrapped, catch returns safe default / swallows |
| URLSearchParams builder | PASS — `new URLSearchParams()`, sets `district`/`checkIn`/`checkOut`, returns `/places?...` or `/places` |
| 50-cap | PASS — `slice(0, 50)` in both `readWishlist` and `toggleWishlist` |
| No availability/price/booking language | PASS — neither lib mentions them |
| Storage keys | PASS — `mit_trip_context_v1` / `mit_wishlist_v1` |
| Guard test copied verbatim | PASS |

## Quality

- `tripContext.ts`: defensive parse (type-guards each field, travellers clamped 1–50 + `Math.floor` else default 2, interests filtered to strings), returns copies (`{ ...EMPTY_TRIP }`) so callers can't mutate the constant, write merges `read + patch` and persists best-effort. Good.
- `wishlist.ts`: read validates `Array.isArray`, filters non-strings, caps; toggle removes-if-present else appends, caps, persists capped copy, returns new array without mutating input. Good.
- No regressions: all 15 pre-existing tests still pass alongside the 3 new ones.

## Deviations from verbatim snippets (both judged Minor — behavior/names preserved)

1. **Minor — comment rewording (required, correct):** brief snippet's `"never availability"` and `"storage unavailable"` trip its own guard regex `/available|price|book/i`. Implementer reworded to `"never live inventory"` / `"storage inaccessible"`. Comment-only change; logic and names untouched. Report's diagnosis confirmed — the brief contradicts itself and the implementer chose the only green path. Recommend fixing the brief snippet, not the implementation.
2. **Minor — literal `50` instead of `MAX_SAVED` const (required, correct):** brief snippet uses `.slice(0, MAX_SAVED)` but its guard requires literal `slice(0, 50)`. Implementer inlined `50` in both slice calls. Same runtime cap, same exports/behavior. Slight maintainability cost (magic number) forced by the guard; a future brief could allow `const MAX_SAVED = 50` alongside a literal use, but as written this deviation is the right call.

## Findings

- Critical: none.
- Important: none.
- Minor: the two items above (both brief-forced, both correctly handled, no follow-up needed in code).
- Brief fix suggestion (non-blocking): remove `available`/`unavailable` from the `tripContext.ts` snippet comments and either use literal `50` in the `wishlist.ts` snippet or relax the `slice(0, 50)` guard regex to also accept a named const.

Downstream Tasks 3–6 may rely on all seven exported names verbatim — safe to proceed.
