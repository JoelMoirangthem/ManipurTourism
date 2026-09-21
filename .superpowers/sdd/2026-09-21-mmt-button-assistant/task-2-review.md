# Task 2 Review: Button-only assistant consolidation

## Verdict: PASS

All binding requirements met verbatim. No 404-producing leftovers. Remaining `/assistant` hrefs resolve via the new route handler redirect; stale comments and indirect links are non-blocking cleanup for Task 3/4.

## Binding checklist (all PASS)

| Requirement | Evidence | Status |
|---|---|---|
| `assistant/page.tsx` deleted | `Test-Path page.tsx` = False; `src/app/assistant/` contains only `route.ts` | PASS |
| `assistant/route.ts` redirects to `/?assistant=open` | File is 4-line verbatim match to brief (`redirect("/?assistant=open")`) | PASS |
| `plan/page.tsx` redirects to `/?assistant=open&start=plan` | File is 5-line verbatim match to brief incl. comment | PASS |
| Exact names `requestPanelOpen` / `consumeOpenSignal` / `AssistantAutoOpen` | Grep: `assistant-thread.tsx:98,103`, `AssistantPanel.tsx:8,29`, `AssistantAutoOpen.tsx:5`, `layout.tsx:7,67` — exact case, no aliases | PASS |
| Build has no `/assistant` page route | Fresh `npm run build`: compiled successfully; route table shows `ƒ /assistant` (dynamic route handler, not `○` page) and `○ /plan` (prerendered redirect) | PASS |

## Verbatim / placement checks

- **Open-signal block** (`assistant-thread.tsx:96-107`): verbatim vs brief; correctly placed after `getServerSnapshot` / before `useAssistantStore`, after `listeners` (line 66) so in scope. `listeners.forEach` notify preserved.
- **AssistantAutoOpen.tsx**: 20-line verbatim match (client directive, `window.location.search` effect, `seedPlanStarter` on `start=plan`, `requestPanelOpen(ask)`, URL cleanup via `history.replaceState`, `[]` deps, returns null).
- **Panel signal effect** (`AssistantPanel.tsx:27-35`): verbatim effect body with `seenSignal` guard; `useRef` added to React import; existing thread imports (`AssistantInput, AssistantThreadView, clearThread`) preserved so panel compiles — correct merge, not a deviation.
- **Mount** (`layout.tsx:7,67`): `<AssistantAutoOpen />` next to `<AssistantPanel />`; existing mount lines preserved per ledger ruling.
- **Report accuracy**: report's Step 1/2/3 account matches files on disk; route-count note (brief said 21, actual ~25 app routes / 27 table lines) correctly attributed to project evolution, not this change.

## Leftover `/assistant` references — 404 / confusion audit

No reference produces a 404: every `/assistant` href now hits `route.ts` → server redirect to `/?assistant=open`. Findings are UX roundtrip + doc debt, non-blocking:

| Location | Code | Effect | Severity |
|---|---|---|---|
| `src/app/layout.tsx:21` NAV `{ href: "/assistant" }` | Server redirect → `/?assistant=open` | Works; one extra roundtrip vs linking `/?assistant=open` directly | Low — Task 3/4 cleanup (report already flags as out-of-scope) |
| `src/app/page.tsx:78` hero "Ask the assistant" `href="/assistant"` | Same redirect | Works; same roundtrip note | Low — recommend direct `/?assistant=open` in Task 4 |
| `src/app/places/page.tsx:145` empty-state `href="/assistant"` | Same redirect | Works; same roundtrip note | Low — same recommendation |
| `AssistantPanel.tsx:1-3` comment "Shares the thread store with the full /assistant page" | Stale comment | Confusing to future readers; page no longer exists | Doc debt — Task 3/4 should reword |
| `assistant-thread.tsx:1-4` comment "continue on the page" | Stale comment | Same | Doc debt |
| `/plan` hrefs (`layout.tsx:20`, `page.tsx:17,84,287`, `places/[id]/page.tsx:96`) | Redirect → `/?assistant=open&start=plan` | By design per brief; panel seeds plan starter | OK — no change |

No direct imports of the deleted page module found; no `assistant/page` import strings.

## Quality notes (non-blocking)

- Panel signal effect intentionally has no dep array (brief verbatim); `seenSignal` id-guard makes it safe but it runs every render and will trip `exhaustive-deps` lint — accepted per binding, note only.
- `requestPanelOpen(null)` path (no `ask` param) correctly opens panel with no prefill; `AssistantAutoOpen` cleanup strips `assistant/ask/start` while preserving other query params — correct.

## Recommendation

Accept Task 2 as DONE. Suggest Task 3/4: (1) point the three `/assistant` hrefs directly at `/?assistant=open`, (2) update the two stale "full /assistant page" comments, (3) remove or retarget the `/assistant` NAV entry per final IA.
