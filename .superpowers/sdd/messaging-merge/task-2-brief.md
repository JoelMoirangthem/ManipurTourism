# Task 2 brief — Unified `/messages` list page
(Source: plan Task 2. Read this first — it is your requirements.)

## Files
- Create: `D:\ManipuriTourism\apps\web\src\app\messages\page.tsx`
- Reference (read, do NOT modify): `D:\ManipuriTourism\apps\web\src\app\threads\page.tsx` (copy this file's structure exactly — 115 lines),
  `D:\ManipuriTourism\apps\web\src\lib\messages.ts` (import `threadUrl`, `roleCopy`),
  `D:\ManipuriTourism\apps\web\src\components\ActorSwitcher.tsx` (`readActorCookieClient`),
  `D:\ManipuriTourism\apps\web\src\components\ui.tsx` (`Badge, Card, inputClass`).
- Workdir: `D:\ManipuriTourism\apps\web`

## Context
S1 merges /threads + /inbox + /inquiries/[id] into /messages + /messages/[id].
This task builds the role-aware list. Backend (`GET /api/inquiries`, scope-enforced)
is untouched. Row shape from the API: `{ id, placeId, partySize, checkIn, checkOut,
state, messageCount, updatedAt, awaitingProvider }`.

## Steps
- [ ] Step 1: Create `src/app/messages/page.tsx` as `"use client"`, copying
  `src/app/threads/page.tsx` exactly, then apply ONLY these changes:
  1. Title/lede from `roleCopy(role)` (import from `@/lib/messages`) instead of
     hardcoded "My threads" copy. `role` state already exists (from
     `readActorCookieClient()`); pass the raw cookie value straight to `roleCopy`
     (it handles `"visitor-demo"` etc.).
  2. Row links: `` `/inquiries/${r.id}` `` → `threadUrl(r.id)`.
  3. When `role` is `"provider-demo"` or `"provider"`, render a gold `Badge`
     "Needs your reply" on rows where `r.awaitingProvider` is true.
  4. Any copy/back-link mentioning `/threads` → `/messages`.
- [ ] Step 2: Typecheck + lint: `npx tsc --noEmit 2>&1 | Select-String -Pattern "^src/app/messages"`
  (expect no output) and `npx eslint src/app/messages/page.tsx` (expect 0 errors).
  NOTE on `react-hooks/set-state-in-effect`: state updates are allowed only inside
  async callbacks (`.then()`, geolocation/fetch handlers) — never as direct
  `setX()` calls in the effect body. The copied threads page already complies; keep it so.
- [ ] Step 3: Browser check (dev server already on :3000, reuse it — never start a
  second server): open `/messages` with `mt_actor=visitor-demo` cookie →
  list renders, each row's href starts with `/messages/` (inspect only; the detail
  page arrives in Task 3).
- [ ] Step 4: SKIP (no git repo — do not commit).

## Interfaces
- Consumes Task 1: `threadUrl(id)`, `roleCopy(role)`.
- Produces for Task 4/5: route `/messages` with row links to `threadUrl(id)`.
