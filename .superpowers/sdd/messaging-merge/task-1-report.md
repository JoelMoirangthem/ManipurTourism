# Task 1 report — Message URL/copy helpers with TDD

## Status
DONE — all brief steps completed (Steps 1–4; Step 5 skipped per brief, no git repo).

## What was implemented
- `apps/web/src/lib/messages.ts` (new): pure, client-safe helpers for the merged `/messages` surface, exactly per brief —
  `threadUrl(id)`, `roleCopy(role)`, `KIND_LABEL`.
- `apps/web/scripts/messages.test.mjs` (new): node:test file, verbatim from brief (3 tests), following the existing `scripts/nearby.test.mjs` pattern (imports `../src/lib/messages.ts` directly; Node 24 type-strips).

## TDD evidence

### RED — Step 2: `node --test scripts/messages.test.mjs` (before `messages.ts` existed)
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'D:\ManipuriTourism\apps\web\src\lib\messages.ts'
  imported from D:\ManipuriTourism\apps\web\scripts\messages.test.mjs
...
ℹ tests 1 / ℹ pass 0 / ℹ fail 1
✖ failing tests: test at scripts\messages.test.mjs:1:1 / ✖ scripts\messages.test.mjs
```
Expected failure observed: `ERR_MODULE_NOT_FOUND`. (Workdir: `D:\ManipuriTourism\apps\web`, Node v24.20.0.)

### GREEN — Step 4: `node --test scripts/messages.test.mjs` (after minimal implementation)
```
▶ messages lib
  ✔ builds thread URLs under /messages
  ✔ titles the list per role
  ✔ labels all availability kinds
✔ messages lib
ℹ tests 3 / ℹ suites 1 / ℹ pass 3 / ℹ fail 0
```
PASS 3/3. (Only output besides results is the benign `MODULE_TYPELESS_PACKAGE_JSON` warning, also present for the existing `nearby.ts` pattern — no `package.json` change made.)

### Extra sanity check (aliases named in brief but not covered by the verbatim test)
One-liner importing `src/lib/messages.ts` directly and asserting:
`provider-demo` → "Messages for your listings"; `reviewer-demo` lede matches /read-only/;
`admin` and `admin-demo` → "All message threads"; `visitor` → "My messages"; `threadUrl('x')` → `/messages/x`.
Result: `alias check: all OK`.

## Files changed
- Created: `D:\ManipuriTourism\apps\web\scripts\messages.test.mjs` (verbatim from brief)
- Created: `D:\ManipuriTourism\apps\web\src\lib\messages.ts` (verbatim from brief)
- No other files touched. No commits (per brief Step 5 skip).

## Self-review
- **Completeness**: All three exports (`threadUrl`, `roleCopy`, `KIND_LABEL`) implemented with exact names/signatures/strings from the brief. Later tasks can import them as specified.
- **Naming**: Matches brief and plan interfaces exactly. No deviations.
- **YAGNI**: No extra helpers, validation, or encoding added — minimal code only. `roleCopy` falls through to visitor copy for unknown roles (per brief code); no extra error handling introduced.
- **Test quality**: Test file is verbatim from brief and covers the three behaviors (URL shape, per-role titles + reviewer read-only lede, all three kind labels). Verified RED→GREEN transition. Limitation (not fixed, out of scope): the verbatim test does not pin `provider-demo`/`admin` aliases or the default/unknown-role fallthrough — covered manually above instead of editing the brief-mandated test.

## Concerns
- None blocking. Minor note: `roleCopy`'s fallthrough means any unrecognized role silently gets visitor copy — intended per brief, but later tasks should pass only known roles.
- Minor note: Node emits a `MODULE_TYPELESS_PACKAGE_JSON` warning when type-stripping the `.ts` import; harmless and consistent with the existing `nearby.test.mjs` pattern.
