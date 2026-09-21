# Task 4 report — Redirects + nav + inquire links

## Status
Done. All 5 file edits applied per brief (Steps 1–6). Step 7 skipped (no git repo).

## Changes
1. `apps/web/src/app/threads/page.tsx` — entire contents replaced with `ThreadsRedirect` stub (`redirect("/messages")`), exact text from brief.
2. `apps/web/src/app/inbox/page.tsx` — entire contents replaced with `InboxRedirect` stub (`redirect("/messages")`), exact text from brief.
3. `apps/web/src/app/inquiries/[id]/page.tsx` — entire contents replaced with async `InquiryRedirect` stub (`redirect(\`/messages/${id}\`)`), exact text from brief.
4. `apps/web/src/app/layout.tsx` — line 25: `{ href: "/threads", label: "My threads" }` → `{ href: "/messages", label: "Messages" }`. Nothing else touched.
5. `apps/web/src/app/inquire/page.tsx` — line 138: success-block link `` `/inquiries/${sentId}` `` → `` `/messages/${sentId}` ``. Surrounding copy unchanged; no other link in that block touched.

Backend untouched. No other files modified.

## Verification — commands + outputs
Workdir: `D:\ManipuriTourism\apps\web`

1. `npx tsc --noEmit 2>&1 | Select-String -Pattern "^src/"`
   - Output: (no output) — PASS, no type errors under `src/`.
2. `npx eslint src/app/threads/page.tsx src/app/inbox/page.tsx "src/app/inquiries/[id]/page.tsx" src/app/layout.tsx src/app/inquire/page.tsx`
   - Output: 1 error, in `src/app/inquire/page.tsx:39:5` (`react-hooks/set-state-in-effect`, `setActorId(readActorCookieClient())` synchronously in effect body).
   - The 4 other files: 0 errors. The flagged lines were not touched by this task (pre-existing) — left unfixed per brief.

Dev server on :3000 was not needed (static stub/redirect edits + tsc/eslint sufficient); none started.

## Files
- Modified: the 5 files listed above, and only those.
- Stub contents verified byte-for-byte against the brief after writing (re-read all three — exact match, including comments).

## Self-review
- [x] Three stubs match brief exactly (imports, comments, component names, redirect targets, async `params` on inquiry redirect).
- [x] Old 115-line threads list, 281-line inbox client, and 164-line inquiry detail view fully removed (replaced, not merged) — no leftover exports or `"use client"` directives.
- [x] `layout.tsx` diff is the single nav entry; `NAV` otherwise intact, `MORE_NAV` untouched per brief.
- [x] `inquire/page.tsx` diff is the single `href` in the sent-success block; preview/send logic, copy, and `Send another` reset untouched.
- [x] Grep for `/threads|/inbox|/inquiries/` across `apps/web/src`: remaining hits are out-of-scope items listed under Concerns; no missed edit within the 5 allowed files. `/api/inquiries/*` hits are backend API routes and correctly retained.

## Concerns
1. Pre-existing lint error (untouched lines, not fixed per brief): `src/app/inquire/page.tsx:39` — `react-hooks/set-state-in-effect` (`setActorId` called synchronously in `useEffect`). Recommend a follow-up, not part of this task.
2. Out-of-scope leftover old-route links (brief allowed modifying only the 5 files, so left as-is — flagging for a follow-up): `src/app/layout.tsx:30` (`MORE_NAV` still has `{ href: "/inbox", label: "Inbox" }`, which will now hit the redirect stub rather than a real page) and `src/app/messages/[id]/page.tsx:148` (`<Link href="/inbox">`, same situation). If intended, a later task should repoint/remove these.
3. `src/app/messages/page.tsx:3` comment mentions "replaces /threads + /inbox" — documentation only, no action needed.
