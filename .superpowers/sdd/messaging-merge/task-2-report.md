# Task 2 report — Unified `/messages` list page

## Implementation
- Created `D:\ManipuriTourism\apps\web\src\app\messages\page.tsx` (`"use client"`) as a faithful copy of `src/app/threads/page.tsx` (115-line structure preserved: `Row` type, `rows/names/loading/role/filter` state, both `useEffect` blocks, fetch of `/api/inquiries` + `/api/places?limit=50`, state filter, empty-state `Card`, footer cookie note) with ONLY these changes:
  1. Title/lede from `roleCopy(role)` (imported from `@/lib/messages`); raw cookie string from existing `role` state passed straight through. Lede appends `Acting as {role}` to preserve the original's role-visibility behavior.
  2. Row links `href={\`/inquiries/${r.id}\`}` → `href={threadUrl(r.id)}`.
  3. Added gold `Badge` "Needs your reply" gated on `(role === "provider-demo" || role === "provider") && r.awaitingProvider`, via a derived `isProvider` const (no new effects/state). Existing `waiting on host` badge kept untouched.
  4. Threads→messages wording: `aria-label="Filter messages by state"`, empty-state "No messages yet… / No message matches…". (No literal `/threads` route links existed in the source; grep confirms none exist in the new file and no `/inquiries/` hrefs remain — only an accurate code comment noting the merge replaces `/threads` + `/inbox`.)
- Reference files (`threads/page.tsx`, `lib/messages.ts`, `ActorSwitcher.tsx`, `ui.tsx`) read, NOT modified. No new dependencies. No git operations (no repo, per brief Step 4 SKIP).

## Test / verify commands + outputs (workdir `D:\ManipuriTourism\apps\web`)
1. `npx tsc --noEmit 2>&1 | Select-String -Pattern "^src/app/messages"` → **no output (PASS, scoped check clean).**
2. Full `npx tsc --noEmit` → errors ONLY in pre-existing `src/components/NearbyMap.tsx` (TS1381 @343, TS17002 @402, TS1005 @403, TS1109 @404; stray `)}` at line 343 + mismatched divs). Zero errors in `src/app/messages/`.
3. `npx eslint src/app/messages/page.tsx` → **1 error: `react-hooks/set-state-in-effect` at line 33** (`setRole(readActorCookieClient())` direct in effect body). **Pre-existing, inherited verbatim from the reference:** `npx eslint src/app/threads/page.tsx` fails identically at its line 31. The brief's premise ("copied threads page already complies") is factually wrong; I kept the exact pattern per the brief's "ONLY these changes" constraint rather than refactoring the reference's pattern unilaterally.
4. Browser check (Step 3) — **BLOCKED by pre-existing breakage:** `curl /messages`, `/threads` (pre-existing page), and `/api/inquiries` (with `mt_actor=visitor-demo`) ALL return HTTP 500; the dev server's error payload cites only the global Turbopack compilation failure in `NearbyMap.tsx` (import trace: `NearbyMap.tsx` ← `app/nearby/page.tsx`). This file is untouched by me and owned by another workstream, so I did not fix it. Static guarantee stands in for the href check: every row uses `threadUrl(r.id)`, and Task 1's reviewed-clean `threadUrl` returns `` `/messages/${id}` `` — all row hrefs start with `/messages/` by construction (grep confirms single `href={threadUrl(r.id)}`, no other hrefs).

## Files changed
- Created: `apps/web/src/app/messages/page.tsx` (+115 lines). No other files created, modified, or deleted.

## Self-review findings
- Completeness: all 4 brief changes present; interfaces satisfied (consumes Task 1 `threadUrl`/`roleCopy`; produces `/messages` route with `threadUrl` row links for Tasks 4/5).
- YAGNI: no extra features, no new state/effects/deps, no refactors; logic (fetch, filter, rendering) byte-equivalent to reference apart from the 4 items + necessary component rename (`ThreadsPage` → `MessagesPage`).
- Judgment calls (flagged, minimal): (a) kept the reference's direct-`setRole`-in-effect pattern despite the lint error, to honor "copy exactly / ONLY these changes" — the fix (lazy `useState` initializer) is a one-liner for whoever owns lint cleanup; (b) lede keeps an `Acting as {role}` code chip; (c) item-4 wording updates limited to user-facing "threads" copy.

## Concerns
1. **Step 3 browser verification blocked (environmental, pre-existing):** dev server on :3000 serves 500 for every route due to `NearbyMap.tsx` syntax error. Needs the nearby-workstream fix, then re-run: open `/messages` with `mt_actor=visitor-demo` and confirm rows + `/messages/` hrefs.
2. **ESLint `react-hooks/set-state-in-effect` error on the new file** — identical pre-existing failure on `threads/page.tsx`; brief expectation of "0 errors" is unattainable for an exact copy. Recommend either a repo-wide lint pass or explicit waiver; I did not silently refactor.
