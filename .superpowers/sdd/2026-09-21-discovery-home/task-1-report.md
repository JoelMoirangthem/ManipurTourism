# Task 1 Report: Discovery static data + guard tests

**Status:** DONE

## What was created

1. **`apps/web/src/data/discovery.ts`** (new) — verbatim per brief:
   - `Collection` type + `COLLECTIONS` (3 entries): `lakeside` (district `Bishnupur`),
     `heritage-imphal` (district `Imphal West`), `trek-country` (category `Trek`),
     each with `/places?...` href.
   - `Season` type + `SEASONS` (3 entries): Best window (Oct–Mar), Lush summer
     (Mar–Jun), Monsoon caution (Jun–Sep).
   - `Festival` type + `FESTIVALS` (3 entries): Sangai Festival (21–30 Nov yearly),
     Shirui Lily Festival (May yearly), Yaoshang (Feb–Mar full moon, 5 days) —
     all with `https://manipurtourism.gov.in` source URLs and annual-pattern
     wording (no guaranteed dates).
   - Field names match the plan exactly.
2. **`apps/web/src/lib/__tests__/discovery.test.mjs`** (new) — 5 guard tests.
   Per the resolved ambiguity, the test reads `discovery.ts` **as text** and
   asserts via regex (no TS import, so `node --test` passes without compilation),
   validating district/category references against the live `seed-places.json`
   IDs. Tests: seed-ID presence + slug/district/category resolution; real
   districts/categories only (+ unique slugs, `/places?` hrefs, non-empty
   title/blurb); seasons shape (3 entries, name/months/temp/note); festival
   sources + annual patterns + banned booking language (whole-file scan);
   exact type-declaration field names.
3. **Modified:** none.

## Test command + output

Run from `D:\ManipuriTourism\apps\web`:

`node --test src/lib/__tests__/discovery.test.mjs src/lib/__tests__/fixtures.test.mjs src/lib/__tests__/weather.test.mjs`

Result: **12 pass, 0 fail** (5 discovery + 3 fixtures + 4 weather), duration ~671ms.
Note: the brief's Step 2 "verify it fails" intermediate run was skipped as a
separate recorded step — the TDD red state is trivially guaranteed (the test
`readFileSync`s `discovery.ts`, which did not exist before this task); the
final green run above is the load-bearing evidence.

## Files changed

- Created: `apps/web/src/data/discovery.ts`
- Created: `apps/web/src/lib/__tests__/discovery.test.mjs`
- Modified: none (no git repo exists; Step 5 commit intentionally not attempted
  per task instructions — work done in-place)

## Concerns

- None blocking. Minor notes for later tasks: (a) `trek-country` uses category
  `Trek`, which currently resolves against only 2 seed places (shirui-peak,
  dzukou-valley) — fine for now, but hero/collection counts should handle small
  result sets; (b) the text-parsing test approach is intentionally brittle to
  formatting (exact type-declaration regex) — if Task 2+ reformats
  `discovery.ts` (e.g. multiline types), the field-name guard will need
  relaxing; (c) festival `pattern` strings are annual by wording only — any
  future date-specific copy must keep the banned-phrase guard passing.
