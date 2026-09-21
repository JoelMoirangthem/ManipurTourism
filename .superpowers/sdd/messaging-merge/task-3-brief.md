# Task 3 brief — `/messages/[id]` thread view + extracted ReplyForm
(Source: plan Task 3. Read this first — it is your requirements.)

## Files
- Create: `D:\ManipuriTourism\apps\web\src\components\ReplyForm.tsx`
- Create: `D:\ManipuriTourism\apps\web\src\app\messages\[id]\page.tsx`
- Reference (read, do NOT modify): `D:\ManipuriTourism\apps\web\src\app\inquiries\[id]\page.tsx` (164 lines, server component),
  `D:\ManipuriTourism\apps\web\src\app\inbox\page.tsx` (reply form block: `reply/kind/quantity` state + date inputs + POST to `/api/inquiries/${id}/messages`),
  `D:\ManipuriTourism\apps\web\src\lib\messages.ts` (`KIND_LABEL`).
- Workdir: `D:\ManipuriTourism\apps\web`

## Context
S1 merges messaging into /messages. Backend untouched (`getInquiryScoped`,
`POST /api/inquiries/[id]/messages` accepting `{ text, availability: { kind,
startDate, endDateExclusive, quantity, quotePaise } | null }`). Dev server on
:3000 — reuse it, never start another.

## Steps
- [ ] Step 1: Create `src/components/ReplyForm.tsx` (`"use client"`, props
  `{ inquiryId: string; onSent: () => void }`): move the reply form out of
  `inbox/page.tsx` — textarea (1–2000 chars), availability kind select, start/end
  date inputs (`YYYY-MM-DD`), quantity input (integer ≥ 0), submit POSTing to
  `/api/inquiries/${inquiryId}/messages`, then `onSent()`. Import `KIND_LABEL`
  from `@/lib/messages`. Show server error text on failure.
- [ ] Step 2: Create `src/app/messages/[id]/page.tsx`: copy
  `src/app/inquiries/[id]/page.tsx` verbatim, then change ONLY: breadcrumb link
  `/threads` ("My threads") → `/messages` ("Messages"); import `KIND_LABEL` from
  `@/lib/messages` and delete the local copy; after the messages list render
  `<ReplyForm inquiryId={id} onSent={...} />` ONLY when the server-resolved
  `actor.role === "provider"` — since this is a server component, refreshing
  means revalidating server data: use `router.refresh()` from
  `next/navigation`… NOTE: `router.refresh()` needs a client boundary. Instead:
  render ReplyForm inside the existing server layout and pass `onSent` as a
  `() => window.location.reload()` closure defined in a tiny `"use client"`
  wrapper is overkill — simplest correct approach: ReplyForm calls
  `window.location.reload()` itself after successful POST, so `onSent` prop is
  NOT needed. Props: `{ inquiryId: string }` only. (This supersedes the plan's
  onSent sketch — record the deviation in your report.)
  Visitors/reviewers see the existing read-only view unchanged.
- [ ] Step 3: `npx tsc --noEmit 2>&1 | Select-String -Pattern "^src/(components/ReplyForm|app/messages)"`
  → no output; `npx eslint src/components/ReplyForm.tsx "src/app/messages/[id]/page.tsx"` → 0 errors
  (state updates only in async callbacks, per repo pattern).
- [ ] Step 4: SKIP commits (no git repo).

## Interfaces
- Consumes Task 1 `KIND_LABEL`; produces route `/messages/[id]` for Tasks 4–5.
