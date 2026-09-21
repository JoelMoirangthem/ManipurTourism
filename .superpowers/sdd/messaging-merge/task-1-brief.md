# Task 1 brief — Message URL/copy helpers with TDD
(Source: plan Task 1, copied verbatim. Zero-context implementer: read this first.)

## Files
- Create: `D:\ManipuriTourism\apps\web\src\lib\messages.ts`
- Test: `D:\ManipuriTourism\apps\web\scripts\messages.test.mjs`
- Workdir for all commands: `D:\ManipuriTourism\apps\web`

## Context
S1 merges /threads + /inbox + /inquiries/[id] into /messages + /messages/[id].
This task creates the tiny pure helper module later tasks import. Follow the
existing pattern in `scripts/nearby.test.mjs` (node:test, imports
`../src/lib/*.ts` directly — Node 24 type-strips; run with `node --test`).

## Steps
- [ ] Step 1: Write the failing test — create `scripts/messages.test.mjs`:

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

Note: `roleCopy` takes the bare role name (`"visitor"`, `"provider"`, `"reviewer"`,
`"admin"`) — NOT the demo cookie ids. Also accept `"provider-demo"` etc. as aliases.
- [ ] Step 2: Run `node --test scripts/messages.test.mjs` → expect FAIL with ERR_MODULE_NOT_FOUND.
- [ ] Step 3: Write minimal `src/lib/messages.ts`:

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

- [ ] Step 4: Run `node --test scripts/messages.test.mjs` → expect PASS 3/3.
- [ ] Step 5: SKIP (no git repo — do not commit; verification commands are the record).

## Interfaces (for later tasks — implement exactly these names)
- Produces: `threadUrl(id)`, `roleCopy(role)`, `KIND_LABEL`.
