# Task 3 report — `/messages/[id]` thread view + ReplyForm island

## Implementation
- Created `apps/web/src/components/ReplyForm.tsx` (`"use client"`, props `{ inquiryId: string }` only):
  textarea (server enforces 1–2000 chars, submit disabled when blank), availability kind
  select (labels from `KIND_LABEL` in `@/lib/messages`), start/end date inputs
  (`type="date"`, `YYYY-MM-DD`, defaults today/tomorrow — same fallback as the inbox form),
  quantity input (digits-only, integer ≥ 0). POSTs
  `{ text, availability: { kind, startDate, endDateExclusive, quantity, quotePaise: null } }`
  to `/api/inquiries/${inquiryId}/messages`; on success `window.location.reload()`;
  on failure shows server error text. No quote UI (brief's field list omits it).
- Created `apps/web/src/app/messages/[id]/page.tsx`: verbatim copy of
  `src/app/inquiries/[id]/page.tsx` with ONLY these changes: breadcrumb
  `/threads` ("My threads") → `/messages` ("Messages"); `KIND_LABEL` imported from
  `@/lib/messages`, local copy deleted; `<ReplyForm inquiryId={id} />` rendered after
  the messages list, gated on server-resolved `actor.role === "provider"`.
  Visitors/reviewers see the read-only view unchanged.
- Deviation recorded (per brief Step 2, supersedes plan's onSent sketch): ReplyForm takes
  `{ inquiryId: string }` only and calls `window.location.reload()` itself after POST —
  no `onSent` prop, no client wrapper. Rationale: the page is a server component with no
  client boundary for `router.refresh()`; a wrapper just to pass
  `() => window.location.reload()` is overkill.
- Backend untouched; no changes to reference files.

## Commands + outputs
- `npx tsc --noEmit 2>&1 | Select-String -Pattern "^src/(components/ReplyForm|app/messages)"` → no output (clean).
- `npx eslint src/components/ReplyForm.tsx "src/app/messages/[id]/page.tsx"` → no output, 0 errors.
- Runtime (reused dev server on :3000, none started): `GET /messages` → 200;
  `GET /messages/does-not-exist` → 404 via `notFound()` (same as `inquiries/[id]`);
  RSC payload confirms `messages/[id]/page.tsx` `ThreadView` executed server-side.
  No seed thread existed for the anon actor, so the provider-gated ReplyForm branch was
  verified by code inspection + typecheck, not live render.
- `Compare-Object` of new page vs `inquiries/[id]/page.tsx` → only the allowed diffs
  (2 added imports, breadcrumb swap, local KIND_LABEL deletion, one ReplyForm line).

## Files
- Create: `D:/ManipuriTourism/apps/web/src/components/ReplyForm.tsx`
- Create: `D:/ManipuriTourism/apps/web/src/app/messages/[id]/page.tsx`
- Read-only refs (unchanged): `src/app/inquiries/[id]/page.tsx`, `src/app/inbox/page.tsx`,
  `src/lib/messages.ts` (Task 1 `KIND_LABEL`), `src/lib/actors.ts`, `src/lib/inquiryStore.ts`,
  `src/app/api/inquiries/[id]/messages/route.ts`

## Self-review (exact-copy discipline + YAGNI)
- Page diff vs source is exactly the brief's three allowed changes; nothing else touched.
- ReplyForm adds nothing beyond the brief: no `quote` field, no `notice` state (reload
  makes it pointless), no `onSent` prop (deviation), no client-side maxLength (server is
  the validator, same as inbox). State updates only inside the async `sendReply` handler,
  per repo pattern.
- No backend, scope, or reference-file changes; Step 4 skipped (no git repo).

## Concerns
- Minor: ReplyForm date defaults (today/tomorrow) duplicate the inbox fallback; if Tasks 4–5
  pass thread dates in, defaults should yield to them — left as-is per `{ inquiryId }`-only props.
- Not live-verified: provider-gated ReplyForm render (no seed thread for this actor); recommend
  covering in Task 4/5 end-to-end checks.
