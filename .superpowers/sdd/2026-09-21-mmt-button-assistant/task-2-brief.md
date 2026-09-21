### Task 2: Button-only assistant (delete page, redirects, auto-open)


**Files:**
- Delete: `apps/web/src/app/assistant/page.tsx`
- Create: `apps/web/src/app/assistant/route.ts`
- Modify: `apps/web/src/app/plan/page.tsx` (replace redirect target)
- Modify: `apps/web/src/components/assistant-thread.tsx` (add open-signal: `requestPanelOpen(prefill: string | null)`, `consumeOpenSignal()`)
- Modify: `apps/web/src/components/AssistantPanel.tsx` (consume signal: open + send prefill once)
- Create: `apps/web/src/components/AssistantAutoOpen.tsx` (reads `window.location.search` in effect, calls `requestPanelOpen`, cleans URL)

**Interfaces:**
- Consumes: existing thread store (`sendAssistantMessage`, `seedPlanStarter`) and panel shell.
- Produces: `requestPanelOpen(prefill: string | null): void`, `consumeOpenSignal(): { id: number; prefill: string | null } | null`, `<AssistantAutoOpen />`. Task 4 consumes `/?assistant=open&ask=…` links.

- [ ] **Step 1: Write the failing check**

Run: `test ! -f src/app/assistant/page.tsx -a -f src/app/assistant/route.ts && echo "CONSOLIDATED" || echo "MISSING consolidation"`
Expected: `MISSING consolidation`

- [ ] **Step 2: Implement consolidation**

```ts
// apps/web/src/app/assistant/route.ts
import { redirect } from "next/navigation";
export async function GET() {
  redirect("/?assistant=open");
}
```

```tsx
// apps/web/src/app/plan/page.tsx (full replacement)
import { redirect } from "next/navigation";
// Planning lives in the assistant panel: forward home with panel-open signal.
export default function PlanRedirect() {
  redirect("/?assistant=open&start=plan");
}
```

Store addition in `assistant-thread.tsx` (module scope, beside the thread store):

```ts
let openSignal: { id: number; prefill: string | null } | null = null;
let openSignalId = 0;
export function requestPanelOpen(prefill: string | null) {
  openSignalId += 1;
  openSignal = { id: openSignalId, prefill };
  listeners.forEach((l) => l());
}
export function consumeOpenSignal() {
  const signal = openSignal;
  openSignal = null;
  return signal;
}
```

`AssistantAutoOpen.tsx`:

```tsx
"use client";
import { useEffect } from "react";
import { requestPanelOpen, seedPlanStarter } from "@/components/assistant-thread";

export function AssistantAutoOpen() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("assistant") !== "open") return;
    const ask = params.get("ask");
    const start = params.get("start");
    if (start === "plan") seedPlanStarter();
    requestPanelOpen(ask);
    params.delete("assistant");
    params.delete("ask");
    params.delete("start");
    const clean = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (clean ? `?${clean}` : ""));
  }, []);
  return null;
}
```

Panel addition in `AssistantPanel.tsx` (inside component, after the Esc effect):

```tsx
import { consumeOpenSignal, sendAssistantMessage, useAssistantStore } from "@/components/assistant-thread";
// inside AssistantPanel, alongside useAssistantStore():
const seenSignal = useRef(0);
useEffect(() => {
  const signal = consumeOpenSignal();
  if (signal && signal.id !== seenSignal.current) {
    seenSignal.current = signal.id;
    setOpen(true);
    if (signal.prefill) void sendAssistantMessage(signal.prefill);
  }
});
```

Mount `<AssistantAutoOpen />` in `layout.tsx` next to `<AssistantPanel />`.

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: compiled successfully, 21 routes, no `/assistant` page route, `/plan` prerendered redirect

Run: `test ! -f src/app/assistant/page.tsx -a -f src/app/assistant/route.ts && echo "CONSOLIDATED"`
Expected: `CONSOLIDATED`

