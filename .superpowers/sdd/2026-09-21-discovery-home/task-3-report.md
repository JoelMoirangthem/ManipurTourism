# Task 3 Report: Seasons + festivals + how-it-works + trust

## Status: complete (no commit — no git repo / working in-place per progress.md ruling)

## Scope
- Modified ONLY lower half of `apps/web/src/app/page.tsx` (insert after collections, before pillars).
- Hero + collections left intact (lines 42–156 unchanged except import line extension).
- No subagents used.

## Prior rulings compliance
- `Verify current edition before travel.` rendered on every festival card via `FESTIVALS.map` (covers Task 1 F1 flattening — presentational verify-note).
- Server component kept: `export default async function Home()`, no `"use client"` added.
- Jewel-Emerald palette kept: `#0B3D2E`, `#C19A4B`, `#9A7A2E`, `#42584F`, `#5D746B`, `#7a5f22` — verbatim from brief.
- Left-aligned `max-w-6xl`: `<main className="mx-auto w-full max-w-6xl px-4 sm:px-6">` unchanged.

## Step 1: Failing check (before edit)
- Command (PowerShell equiv of brief grep, workdir `apps/web`):
  `Select-String -Pattern "Verify current edition" -LiteralPath "src/app/page.tsx" -Quiet`
- Result: `MISSING festival honesty note` — matches brief expectation (`MISSING festival honesty note`).

## Step 2: Implementation (exact values verbatim from brief)
1. Import extended:
   `import { COLLECTIONS, SEASONS, FESTIVALS } from "@/data/discovery";`
   (brief shows `import { SEASONS, FESTIVALS }`; merged with existing COLLECTIONS import — no other import touched.)
2. Inserted after collections `</section>` (old line 156), before pillars:
   - Seasons section verbatim:
     - `SectionTitle kicker="When to go" title="Seasons in Manipur" lede="Oct–Mar is the comfortable window. Sources: 2026 travel guides."`
     - `div.mt-5 grid gap-4 sm:grid-cols-3` + `SEASONS.map` + `Card.premium-card-hover` with `s.months / s.name / s.temp / s.note` and exact Tailwind classes from brief.
   - Festivals section verbatim:
     - `SectionTitle kicker="Festivals" title="Annual patterns, verify editions" lede="Dates repeat yearly but editions shift — confirm with the tourism board before travel."`
     - `FESTIVALS.map` + `Badge tone="gold">{f.pattern}`, `h3 {f.name}`, `p {f.venues}`, `Source: <a href={f.sourceUrl} ...>{f.sourceLabel}</a> target="_blank" rel="noreferrer"`, plus `p.mt-2 text-xs font-semibold text-[#7a5f22]` = `Verify current edition before travel.`
3. Pillars (how-it-works) + honest-limits trust strip:
   - Pillars body/CTAs/links untouched; only `SectionTitle` kicker changed `Why it works` → `How it works` so the section serves as how-it-works per brief ("unchanged except SectionTitle kickers").
   - Featured `Start somewhere` section untouched (out of Task 3 scope, kept to avoid Task 2 regression).
   - Honest-limits trust strip (`Honest limits` / `What this deliberately does not do`) untouched.

## Step 3: Verify
- `npm run build` (workdir `D:\ManipuriTourism\apps\web`): `✓ Compiled successfully in 19.8s`, TypeScript clean, static pages 22/22, `/` prerendered as static content.
- Honesty-note check (after edit):
  `Select-String -Pattern "Verify current edition" ...` → `honesty note present` (matches brief expectation).
  Source occurrence count of `Verify current edition before travel` = 1 (single template line inside `FESTIVALS.map`, renders 3x at runtime — one per festival: Sangai, Shirui Lily, Yaoshang).
- Server-component check: no `"use client"` in `page.tsx`; `Home` remains `async`.
- Consumer check: `SEASONS` (3 entries) / `FESTIVALS` (3 entries with `sourceUrl`/`sourceLabel`) exist in `apps/web/src/data/discovery.ts` from Task 1 — field names match (`name/months/temp/note`, `name/pattern/venues/sourceUrl/sourceLabel`).

## Step 4: Commit
- Skipped per task instruction (`No git commits`) and repo ruling (no git repo in `D:/ManipuriTourism`). No `git add/commit` executed.

## Files touched
- `apps/web/src/app/page.tsx` only (import + 2 inserted sections + 1 kicker word).

## Concerns / follow-ups (none blocking)
- Brief line range `page.tsx:80-193` is stale vs current file (246 → 275 lines); treated as "lower half after collections" — hero/collections verified intact by read-back.
- Pillars kicker rename (`Why` → `How`) is the minimal interpretation of "except SectionTitle kickers"; revert to `Why it works` in one word if Task 4 reviewer prefers zero-touch.
- `count=1` in source is expected (loop template); runtime renders 3 honesty notes — confirmed by code inspection, not screenshot.
