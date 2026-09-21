# Task 2 Report: Button-only assistant consolidation

## Status
DONE — all brief steps implemented verbatim in `D:\ManipuriTourism\apps\web`, in-place, no commits.

## Pre-flight
- Read brief: `.superpowers/sdd/2026-09-21-mmt-button-assistant/task-2-brief.md`
- Read before editing: `src/components/assistant-thread.tsx` (store shape, listeners, seedPlanStarter), `src/components/AssistantPanel.tsx` (Esc effect, structure), `src/app/layout.tsx` (mount point), `src/app/plan/page.tsx` (current redirect), `src/app/assistant/page.tsx` (to delete).
- Ledger ruling observed: Task 3 also touches `layout.tsx`, so existing mount lines preserved exactly; only ADDED the auto-open mount.

## Step 1: Failing check
- Brief command is bash (`test ... && ... || ...`); shell here is Windows PowerShell 5.1, so ran PowerShell equivalent:
  `if ((-not (Test-Path -LiteralPath "src/app/assistant/page.tsx")) -and (Test-Path -LiteralPath "src/app/assistant/route.ts")) { "CONSOLIDATED" } else { "MISSING consolidation" }`
- Before: `MISSING consolidation` (expected — `page.tsx` existed, `route.ts` absent).
- After: `CONSOLIDATED`.

## Step 2: Implementation (verbatim per brief)
1. **Deleted:** `src/app/assistant/page.tsx` via `Remove-Item -LiteralPath "src/app/assistant/page.tsx"`.
2. **Created `src/app/assistant/route.ts`** (verbatim):
   ```ts
   import { redirect } from "next/navigation";
   export async function GET() {
     redirect("/?assistant=open");
   }
   ```
3. **Rewrote `src/app/plan/page.tsx`** (full replacement, verbatim):
   ```tsx
   import { redirect } from "next/navigation";
   // Planning lives in the assistant panel: forward home with panel-open signal.
   export default function PlanRedirect() {
     redirect("/?assistant=open&start=plan");
   }
   ```
4. **Store addition in `src/components/assistant-thread.tsx`** (module scope, after `getServerSnapshot`, before `useAssistantStore` — after `listeners` so in scope; verbatim):
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
5. **Created `src/components/AssistantAutoOpen.tsx`** (verbatim from brief).
6. **Panel addition in `src/components/AssistantPanel.tsx`** (after Esc effect; verbatim effect body):
   - React import extended to `useEffect, useRef, useState` (added `useRef`, required by brief snippet).
   - Thread import merged to preserve existing names: `AssistantInput, AssistantThreadView, clearThread, consumeOpenSignal, sendAssistantMessage, useAssistantStore` (brief snippet lists only the 3 consumed symbols; existing UI names retained so panel still compiles).
   - Added verbatim:
     ```tsx
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
7. **Mount in `src/app/layout.tsx`** (existing lines preserved exactly):
   - Added import: `import { AssistantAutoOpen } from "@/components/AssistantAutoOpen";`
   - Added JSX next to existing mount:
     ```tsx
             <AssistantPanel />
             <AssistantAutoOpen />
     ```

## Step 3: Verify
- Consolidation check: `CONSOLIDATED`.
- `npm run build` (workdir `apps/web`): **compiled successfully**.
  - Full output route table (27 entries incl. header): `/`, `/_not-found`, `/api/*` (14), `/assistant` as `ƒ` (dynamic route handler — no page route), `/inbox`, `/inquire`, `/inquiries/[id]`, `/places`, `/places/[id]`, `/plan` as `○` (static prerendered redirect), `/review`, `/threads`, `/upload`.
  - Brief expected "21 routes, no `/assistant` page route, `/plan` prerendered redirect": compiled status, `/assistant ƒ` (not `○` page), and `/plan ○` all match; absolute route count differs (actual table lists 27 lines / ~25 app routes) — attributable to project evolution since brief was written, not to this change.

## Interfaces produced (for Task 4)
- `requestPanelOpen(prefill: string | null): void`, `consumeOpenSignal(): { id: number; prefill: string | null } | null`, `<AssistantAutoOpen />`.
- `/?assistant=open&ask=…` / `?start=plan` contract in place via `AssistantAutoOpen`.

## Concerns / notes for next tasks
- `src/app/layout.tsx` NAV still lists `/assistant` and `/plan` links — intentionally untouched (not in Task 2 scope; expected Task 3/4 cleanup).
- `AssistantPanel.tsx` header comment still says "Shares the thread store with the full /assistant page" — stale comment, left as-is to keep diff minimal; suggest Task 3/4 updates it.
- Panel signal effect runs on every render with no dep array (per brief verbatim) — works with `seenSignal` guard but is intentionally unconditional; no change made.
- No git operations performed (no commits, in-place only, per instructions).
