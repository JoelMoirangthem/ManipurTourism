# Task 3 Report: Journey nav + header wishlist count

## Status
DONE — all brief steps implemented verbatim in `D:\ManipuriTourism\apps\web`, in-place, no commits.

## Pre-flight
- Read brief: `.superpowers/sdd/2026-09-21-mmt-button-assistant/task-3-brief.md`
- Read before editing: `src/app/layout.tsx` (NAV 18-27, nav render, Task 2 mounts), `src/components/AssistantPanel.tsx` (lines 1-3), `src/components/assistant-thread.tsx` (lines 1-4), `src/lib/wishlist.ts` (`readWishlist`), confirmed `src/components/WishlistCount.tsx` absent.
- Task 2 mounts preserved exactly: `import { AssistantAutoOpen }`, `<AssistantPanel />` + `<AssistantAutoOpen />`.

## Step 1: Failing check
- Brief command is bash (`grep -q ... && ... || ...`); shell here is Windows PowerShell 5.1, so ran equivalent: `if (Select-String -Quiet -Pattern "Destinations" -Path "src/app/layout.tsx") { "JOURNEY NAV" } else { "MISSING journey nav" }`
- Before: `MISSING journey nav` (expected).
- After: `JOURNEY NAV`.

## Step 2: Implementation (verbatim per brief)
1. **Replaced `NAV` + added `MORE_NAV` in `src/app/layout.tsx:19-31` (verbatim):**
   ```tsx
   const NAV = [
     { href: "/places", label: "Destinations" },
     { href: "/places?category=Stay", label: "Stays" },
     { href: "/places?category=Heritage", label: "Experiences" },
     { href: "/#festivals", label: "Festivals" },
     { href: "/threads", label: "My threads" },
     { href: "/upload", label: "Contribute" },
   ];
   const MORE_NAV = [
     { href: "/inquire", label: "Inquire" },
     { href: "/inbox", label: "Inbox" },
     { href: "/review", label: "Review" },
   ];
   ```
   Old `/assistant` + `/plan` entries removed; no `/assistant` href remains in `layout.tsx` (satisfies `/?assistant=open` review note — nothing left to repoint).
2. **Nav render:** `MORE_NAV` rendered inside `<details className="relative">` dropdown after `NAV` links (`<summary>More</summary>` + absolute dropdown div).
3. **Created `src/components/WishlistCount.tsx` (verbatim `"use client"` island consuming `readWishlist`, storage listener + 1s poll, null at 0, `/places` pill `♥ {count} saved`).**
4. **Header mount:** added `import { WishlistCount } from "@/components/WishlistCount";`, mounted `<WishlistCount />` in header before `<ActorSwitcher />` (`<span className="ml-auto flex items-center gap-2">`).
5. **Stale comments fixed to panel-only (no `/assistant` refs):**
   - `AssistantPanel.tsx:1-3` → "Shares the panel-only thread store (no full page)."
   - `assistant-thread.tsx:1-3` → "One panel-only conversation everywhere: the floating side panel reads the same external store (persisted to localStorage)."
6. Task 2 lines untouched: `AssistantPanel`/`AssistantAutoOpen` imports and `<AssistantPanel />` / `<AssistantAutoOpen />` mounts byte-identical.

## Step 3: Verify
- `npm run build` (workdir `apps/web`): **compiled successfully**.
- `JOURNEY NAV` check: `JOURNEY NAV`. Extra: `WISHLIST MOUNTED`, `MORE NAV OK`, `PANEL COMMENT FIXED`, `THREAD COMMENT FIXED`.

## Concerns / notes for next tasks
- `/assistant` route still exists as `ƒ` dynamic route handler (Task 2 redirect) and `/plan` as `○` redirect — nav no longer links them; untouched per scope.
- `src/app/page.tsx:78` and `src/app/places/page.tsx:145` still contain `href="/assistant"` — out of Task 3 scope (only files touched were repointed); flag for Task 4 cleanup to `/?assistant=open`.
- No git operations performed (no commits, in-place only, per instructions).
