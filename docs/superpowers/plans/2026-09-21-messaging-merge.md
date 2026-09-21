# S1 Messaging Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge `/threads`, `/inbox`, and `/inquiries/[id]` into role-aware `/messages` + `/messages/[id]` with zero backend changes and redirects preserving old URLs.

**Architecture:** Pure frontend consolidation. The scope-enforced backend (`inquiryStore.ts`: `listInquiries`, `getInquiryScoped`, `postMessage`; routes `GET/POST /api/inquiries`, `GET /api/inquiries/[id]`, `POST /api/inquiries/[id]/messages`) is untouched. The provider reply form is extracted from the 281-line client `inbox/page.tsx` into a reusable client island `ReplyForm.tsx`; the thread view moves verbatim from `inquiries/[id]/page.tsx` (server component, async params per Next 16); old routes become one-line `redirect()` stubs.

**Tech Stack:** Next.js 16.3.5 (App Router, Turbopack), React 19, Tailwind 4, `node --test` for unit tests (repo has no test runner; follow `scripts/nearby.test.mjs` pattern importing `../src/lib/*.ts` with Node 24 type-stripping).

**Spec:** `D:\ManipuriTourism\docs\superpowers\specs\2026-09-21-production-architecture-design.md` (§3; S1 in §8)

## Global Constraints

- No `git` repo exists in this workspace: SKIP all commit steps; verify via test commands instead.
- Zero backend changes: never edit `src/lib/inquiryStore.ts`, `src/lib/actors.ts`, or any file under `src/app/api/inquiries/`.
- Scope enforcement stays server-side: pages/APIs keep calling `resolveActor` + `getInquiryScoped`/`listInquiries`; never filter by role in client code alone.
- Next 16: route `params` are async (`{ params }: { params: Promise<{ id: string }> }`); `redirect()` from `next/navigation` in server components for old paths.
- Client components that read `useSearchParams` need a `Suspense` boundary (see `inquire/page.tsx`, `places/page.tsx`).
- `NEXT_PUBLIC_` env only for the Maps key; messaging uses no secrets.
- Dev server runs on port 3000 (`npm run dev` in `D:\ManipuriTourism\apps\web`); reuse a running server, never boot a second one.

---

## File Structure

- Create `src/lib/messages.ts` — pure helpers: `threadUrl(id)`, `roleCopy(role)` (list title/lede per role), `KIND_LABEL` map moved here (currently duplicated in `inbox/page.tsx:48-52` and `inquiries/[id]/page.tsx:17-21`).
- Create `src/components/ReplyForm.tsx` — client island extracted from `inbox/page.tsx:54-281` (reply textarea + availability kind/quantity/date inputs + POST to `/api/inquiries/[id]/messages` + expiry display). Props: `{ inquiryId: string; disabled?: boolean }`.
- Create `src/app/messages/page.tsx` — role-aware list (visitor: own threads like `threads/page.tsx`; provider: + awaiting-provider badges like inbox list; reviewer/admin: all, read-only note). Fetches `GET /api/inquiries` + `GET /api/places?limit=50` for place names (same as today).
- Create `src/app/messages/[id]/page.tsx` — move of `inquiries/[id]/page.tsx` verbatim, plus `<ReplyForm>` rendered only when actor role is `provider` (actor resolved server-side), breadcrumb back to `/messages`.
- Modify `src/app/threads/page.tsx` → stub: `import { redirect } from "next/navigation"; export default function ThreadsRedirect() { redirect("/messages"); }` (keep file so old links 307, then delete in S4 cleanup — NO, delete now per plan: replace with stub, S4 removes).
- Modify `src/app/inbox/page.tsx` → same stub → `/messages`.
- Modify `src/app/inquiries/[id]/page.tsx` → stub redirecting to `/messages/${id}` (needs `params` await first).
- Modify `src/app/layout.tsx:24` — nav `{ href: "/threads", label: "My threads" }` → `{ href: "/messages", label: "Messages" }`.
- Modify `src/app/inquire/page.tsx` — post-send success link `/inquiries/${sentId}` → `/messages/${sentId}` (find `sentId` render block).
- Test `scripts/messages.test.mjs` — node:test for `lib/messages.ts`.

---

### Task 1: Message URL/copy helpers with TDD

**Files:**
- Create: `src/lib/messages.ts`
- Test: `scripts/messages.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `threadUrl(id: string): string`, `roleCopy(role: string): { title: string; lede: string }`, `KIND_LABEL: Record<string,string>` for Tasks 2–3.

- [ ] **Step 1: Write the failing test**

```js
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { threadUrl, roleCopy, KIND_LABEL } from "../src/lib/messages.ts";

describe("messages lib", () => {
  it("builds thread URLs under /messages", () => {
    assert.equal(threadUrl("abc-123"), "/messages/abc-123");
  });
  it("titles the list per role", () => {
    assert.equal(roleCopy("visitor").title, "My messages");
    assert.equal(roleCopy("provider").title, "Messages for your listings");
    assert.match(roleCopy("reviewer").lede, /read-only/);
  });
  it("labels all availability kinds", () => {
    assert.equal(KIND_LABEL.reported_available, "Host reports available");
    assert.equal(KIND_LABEL.reported_unavailable, "Host reports unavailable");
    assert.equal(KIND_LABEL.needs_details, "Host needs more details");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/messages.test.mjs` (workdir `D:\ManipuriTourism\apps\web`)
Expected: FAIL with `ERR_MODULE_NOT_FOUND` (file does not exist yet)

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/messages.ts — pure, client-safe helpers for the merged /messages surface.
export function threadUrl(id: string): string {
  return `/messages/${id}`;
}

export function roleCopy(role: string): { title: string; lede: string } {
  if (role === "provider-demo" || role === "provider")
    return {
      title: "Messages for your listings",
      lede: "Threads addressed to listings you own. Replies are host-reported and expire — never reservations.",
    };
  if (role === "reviewer-demo" || role === "reviewer" || role === "admin-demo" || role === "admin")
    return {
      title: "All message threads",
      lede: "Moderation view — read-only. Scope is enforced server-side.",
    };
  return {
    title: "My messages",
    lede: "Threads you started. Only you and the addressed host can read them.",
  };
}

export const KIND_LABEL: Record<string, string> = {
  reported_available: "Host reports available",
  reported_unavailable: "Host reports unavailable",
  needs_details: "Host needs more details",
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/messages.test.mjs`
Expected: PASS 3/3

---

### Task 2: Unified `/messages` list page

**Files:**
- Create: `src/app/messages/page.tsx`
- Consumes: `GET /api/inquiries`, `GET /api/places?limit=50`, `roleCopy` from Task 1, `readActorCookieClient` from `@/components/ActorSwitcher`, `Badge, Card, inputClass` from `@/components/ui`.

**Interfaces:**
- Consumes: Task 1 `roleCopy`.
- Produces: route `/messages` rendering rows `{ id, placeId, partySize, checkIn, checkOut, state, messageCount, updatedAt, awaitingProvider }` linking to `threadUrl(id)` for Task 4 verification.

- [ ] **Step 1: Create the page** as `"use client"` copying `src/app/threads/page.tsx:1-115` exactly, then apply only these changes:
  1. Title/lede from `roleCopy(role)` instead of hardcoded "My threads".
  2. Row link `href` changes from `` `/inquiries/${r.id}` `` to `threadUrl(r.id)` (import from `@/lib/messages`).
  3. When `role` starts with `"provider"`, show an `awaitingProvider` gold `Badge` ("Needs your reply") per row (field already in API response; inbox list already renders this pattern).
  4. Back-link/copy mentioning `/threads` → `/messages`.

- [ ] **Step 2: Typecheck + lint the new file**

Run: `npx tsc --noEmit 2>&1 | Select-String -Pattern "^src/app/messages"` → expect no output; `npx eslint src/app/messages/page.tsx` → expect 0 errors (the `react-hooks/set-state-in-effect` rule flags synchronous `setState` in effect bodies: fetch-then-set inside `.then()` callbacks is allowed, direct `setX()` in the effect body is not — follow the `NearbyMap.tsx` pattern of doing state updates only in async callbacks).

- [ ] **Step 3: Manual verify in browser** (dev server on :3000): open `/messages` as visitor → list renders, each row links to `/messages/<id>` (href check, do not click yet — detail page comes in Task 3).

---

### Task 3: `/messages/[id]` thread view + extracted ReplyForm

**Files:**
- Create: `src/components/ReplyForm.tsx`
- Create: `src/app/messages/[id]/page.tsx`
- Consumes: `KIND_LABEL` from Task 1.

**Interfaces:**
- Consumes: Task 1 `KIND_LABEL`, `threadUrl`.
- Produces: route `/messages/[id]`; `ReplyForm({ inquiryId })` posts `POST /api/inquiries/[id]/messages` with `{ text, availability: { kind, startDate, endDateExclusive, quantity, quotePaise } | null }` and calls `onSent()` to refresh.

- [ ] **Step 1: Extract ReplyForm** — move the reply form block out of `src/app/inbox/page.tsx` (the `reply/kind/quantity` state + date inputs + submit handler posting to `/api/inquiries/${id}/messages`) into `src/components/ReplyForm.tsx` with props `{ inquiryId: string; onSent: () => void }`. Keep validation: text 1–2000 chars; availability dates `YYYY-MM-DD`; quantity integer ≥ 0. Import `KIND_LABEL` from `@/lib/messages` instead of the local copy. `"use client"`.

- [ ] **Step 2: Create the detail page** — copy `src/app/inquiries/[id]/page.tsx` to `src/app/messages/[id]/page.tsx`, then change only: breadcrumb link `/threads` → `/messages` (label "Messages"); import `KIND_LABEL` from `@/lib/messages` and delete the local copy; after the messages list, render `<ReplyForm inquiryId={id} onSent={refresh} />` ONLY when `actor.role === "provider"` (actor is already resolved server-side at the top of the file — pass nothing client-side; wrap ReplyForm in a tiny client boundary is unnecessary since ReplyForm is itself `"use client"` and server components may render client components directly). Reviewer/visitor see the existing read-only view unchanged.

- [ ] **Step 3: Typecheck + lint both files** (same commands as Task 2, paths swapped). Expect zero `src/` errors.

---

### Task 4: Redirects + nav + inquire links

**Files:**
- Modify: `src/app/threads/page.tsx`, `src/app/inbox/page.tsx`, `src/app/inquiries/[id]/page.tsx`, `src/app/layout.tsx`, `src/app/inquire/page.tsx`

- [ ] **Step 1: Replace `src/app/threads/page.tsx` entire contents** with:

```tsx
import { redirect } from "next/navigation";
// S1 merge: threads live at /messages now. Stub kept so old links 307.
export default function ThreadsRedirect() {
  redirect("/messages");
}
```

- [ ] **Step 2: Replace `src/app/inbox/page.tsx` entire contents** with the same stub redirecting to `/messages` (rename function to `InboxRedirect`).

- [ ] **Step 3: Replace `src/app/inquiries/[id]/page.tsx` entire contents** with:

```tsx
import { redirect } from "next/navigation";
// S1 merge: thread view lives at /messages/[id] now.
export default async function InquiryRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/messages/${id}`);
}
```

- [ ] **Step 4: Edit `src/app/layout.tsx`** nav entry `{ href: "/threads", label: "My threads" }` → `{ href: "/messages", label: "Messages" }`.

- [ ] **Step 5: Edit `src/app/inquire/page.tsx`** — find the sent-success block rendering `` `/inquiries/${sentId}` `` and change to `` `/messages/${sentId}` `` (keep the "Sent to service — not read" note).

- [ ] **Step 6: Typecheck + lint all five files.** Expect zero `src/` errors.

---

### Task 5: End-to-end verification (all three roles)

**Files:** none (verification only). Uses `scripts/verify-messages.py` created in Step 1.

- [ ] **Step 1: Write the probe script** `scripts/verify-messages.py`:

```python
"""S1 verification: old URLs redirect, /messages works per role."""
from playwright.sync_api import sync_playwright
BASE = "http://localhost:3000"
CHECKS = [
    ("visitor-demo", "/messages", "My messages"),
    ("provider-demo", "/messages", "Messages for your listings"),
]
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for actor, slug, heading in CHECKS:
        ctx = browser.new_context()
        ctx.add_cookies([{"name": "mt_actor", "value": actor, "url": BASE}])
        page = ctx.new_page()
        page.goto(f"{BASE}{slug}", wait_until="domcontentloaded")
        page.wait_for_selector("main h1", timeout=30000)
        assert heading in page.content(), f"{actor}: missing heading"
        print(f"{actor} {slug}: OK", flush=True)
        page.close(); ctx.close()
    # redirects (no auto-follow inspection via request context)
    ctx = browser.new_context()
    for old, new in [("/threads", "/messages"), ("/inbox", "/messages")]:
        page = ctx.new_page()
        page.goto(f"{BASE}{old}", wait_until="domcontentloaded")
        page.wait_for_url(f"**{new}", timeout=15000)
        print(f"{old} -> {new}: OK", flush=True)
        page.close()
    browser.close()
    print("VERIFY OK", flush=True)
```

- [ ] **Step 2: Run full verification** (workdir `D:\ManipuriTourism\apps\web`, dev server already on :3000):

```powershell
node --test scripts/messages.test.mjs
npx tsc --noEmit 2>&1 | Select-String -Pattern "^src/"
npx eslint src/lib/messages.ts src/components/ReplyForm.tsx src/app/messages/page.tsx "src/app/messages/[id]/page.tsx" src/app/threads/page.tsx src/app/inbox/page.tsx "src/app/inquiries/[id]/page.tsx" src/app/layout.tsx src/app/inquire/page.tsx
python scripts/verify-messages.py
```

Expected: unit PASS; tsc no `src/` lines (ignore `.next/dev/types/routes.d.ts` — pre-existing generated-file corruption from the old `/assistant` conflict, unrelated to S1); eslint 0 errors; probe prints 4 OK + VERIFY OK.

## Self-Review

1. **Spec coverage:** §3 merge table → Tasks 2–4 (list, detail, redirects, nav, inquire link). Role-aware scoping → Task 2 copy + server-side actor checks preserved by moving (not rewriting) backend calls. `/plan` fold and `/review` demote are S2/S4 scope, correctly excluded. Role rename is S2, excluded — plan keeps `provider`/`reviewer` names with S2-ready `roleCopy` fallbacks for `admin`/`authority` already included.
2. **Placeholder scan:** no TBD/TODO; every code step ships exact code; test commands exact with workdir.
3. **Type consistency:** `Row`/`Thread`/`Message` shapes reused verbatim from `threads`/`inbox` pages; `KIND_LABEL` single-sourced in Task 1 and both consumers import it (Tasks 2–3 delete local copies — stated explicitly); `threadUrl` used by list (Task 2) and verified in probe (Task 5).

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-21-messaging-merge.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
