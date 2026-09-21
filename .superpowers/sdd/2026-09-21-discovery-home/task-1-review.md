# Task 1 Review: Discovery static data + guard tests

**Scope reviewed:** brief `task-1-brief.md`, report `task-1-report.md`, implementation `apps/web/src/data/discovery.ts`, test `apps/web/src/lib/__tests__/discovery.test.mjs`, spec `docs/superpowers/specs/2026-09-21-discovery-home-design.md` §4–5, plan `docs/superpowers/plans/2026-09-21-discovery-home.md` Global Constraints + Task 1 interfaces.

## Verdicts

- **Spec compliance: PASS** — no missing load-bearing items; minor spec-§5 shape drift inherited from plan (see F1).
- **Task quality: Approved** — no Critical/Important issues; 3 Minor process/brittleness notes (see F2–F4). No re-run; implementer evidence (12 pass) accepted as non-suspicious.

## Spec compliance checks (§4–5 + Global Constraints + plan interfaces)

- [x] Field names match plan exactly: `Collection { slug; title; blurb; district?; category?; href }`, `Season { name; months; temp; note }`, `Festival { name; pattern; venues; sourceUrl; sourceLabel }` — char-for-char in `discovery.ts:1,8,15`, pinned by exact-regex test.
- [x] Districts/categories exist in live seed: `Bishnupur` (3 seed rows), `Imphal West` (2 rows), `Trek` (shirui-peak, dzukou-valley) — all resolve; test validates against live `seed-places.json` dynamically.
- [x] Festivals carry https sources + annual patterns: 3/3 `https://manipurtourism.gov.in/...` with `sourceLabel`; patterns `21–30 Nov yearly` / `May yearly` / `Feb–Mar full moon, 5 days` all satisfy annual-pattern regex.
- [x] No banned booking language: whole-file scan clean for `available now|rooms available|per night|book now|guaranteed 2026`; no prices, availability, safety certification, or coordinates invented.
- [x] Tests actually guard (not vacuous): 5 tests assert seed-ID presence, slug set, live district/category resolution, unique slugs, `/places?` hrefs, non-empty title/blurb, 3× seasons shape, 3× festival source/pattern/banned, exact type declarations.
- [x] Global Constraints: no booking/payments/availability/prices (PASS); festivals as patterns + official links (PASS); light-only Jewel-Emerald N/A to data-only task (no violation).

## Findings

- **[Minor] F1 — Spec §5 shape drift (plan-inherited, not implementer fault):** spec §5 wants `filter:{district?|category?}`, `Season.tone`, `Festival.verifyNote`; plan/brief flattened to `district?/category?` and dropped `tone`/`verifyNote`. Implementer followed brief verbatim — correct. Task 3 must render static `Verify current edition before travel` note and tone via presentation, not data.
- **[Minor] F2 — TDD red step skipped:** report admits Step 2 fail-run not recorded separately; red state trivially guaranteed (file did not exist). Process deviation only, no product impact.
- **[Minor] F3 — Text-regex test brittleness + no runtime import proof:** test reads `discovery.ts` as text (brief-permitted fallback) so a TS syntax breakage that still matches regex textually would pass; exact type-declaration regex will break on innocent reformatting. Accept for Task 1; Task 4 build (`npm run build`) remains the real import gate. Do not reformat `discovery.ts` in Tasks 2–3 without relaxing the guard.
- **[Minor] F4 — Blurb name-drops non-seed place:** `heritage-imphal` blurb mentions Govindajee (not in 8-ID seed); collection itself correctly filters by `Imphal West` district. Brief-verbatim, honest as prose, but Task 2 card counts must derive from seed filter (2 places), not blurb nouns.

## Evidence relied on (no re-run per instructions)

- Report claim: `node --test src/lib/__tests__/discovery.test.mjs src/lib/__tests__/fixtures.test.mjs src/lib/__tests__/weather.test.mjs` → 12 pass, 0 fail — accepted (file contents corroborate: 5 discovery guards are substantive, implementation matches every asserted literal).
- No commit: excused — no git repo exists per report; in-place work only, no stray modifications.
