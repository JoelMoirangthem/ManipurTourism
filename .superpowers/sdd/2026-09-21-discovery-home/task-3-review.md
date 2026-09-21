# Task 3 Review: Seasons + festivals + how-it-works + trust

**Scope reviewed:** brief `task-3-brief.md`, report `task-3-report.md`, implementation `apps/web/src/app/page.tsx:4,158-185,187-192` (seasons/festivals sections + import + pillars kicker), data `apps/web/src/data/discovery.ts`, spec `docs/superpowers/specs/2026-09-21-discovery-home-design.md` §3–4, plan `docs/superpowers/plans/2026-09-21-discovery-home.md` Global Constraints + Task 3 interfaces.

## Verdicts

- **Spec compliance: PASS** — no missing load-bearing items; seasons/festivals render Task 1 data verbatim per brief, every festival carries pattern + official link + verify-note, Global Constraints hold.
- **Task quality: Approved** — no Critical/Important issues; 2 informational minors (see F1–F2). No re-run; build evidence accepted as credible (code inspection corroborates).

## Spec compliance checks (§3–4 + Global + brief interfaces)

- [x] SEASONS rendered verbatim: `page.tsx:158-170` matches brief `:25-37` char-for-char — `SectionTitle kicker="When to go" title="Seasons in Manipur" lede="Oct–Mar is the comfortable window. Sources: 2026 travel guides."`, `div.mt-5 grid gap-4 sm:grid-cols-3`, `SEASONS.map` with `s.months / s.name / s.temp / s.note` and exact Tailwind classes (`text-[#9A7A2E]`, `font-display … text-[#0B3D2E]`, `text-[#42584F]`).
- [x] FESTIVALS rendered verbatim: `page.tsx:172-185` matches brief `:40-52` char-for-char — `SectionTitle kicker="Festivals" title="Annual patterns, verify editions" lede="Dates repeat yearly but editions shift — confirm with the tourism board before travel."`, `FESTIVALS.map` with `Badge tone="gold">{f.pattern}`, `{f.name}`, `{f.venues}`.
- [x] Verify-note on every festival: `page.tsx:181` = `Verify current edition before travel.` inside `FESTIVALS.map` — single template line renders 3× at runtime (Sangai, Shirui Lily, Yaoshang). Grep confirms 1 source occurrence, loop placement guarantees per-card coverage. Spec §4/§6 honesty guard satisfied (presentational note per progress.md Task 1 F1 ruling — spec §5 `verifyNote` field was flattened in plan, presentation covers it).
- [x] Sources linked `target="_blank"`: `page.tsx:180` — `<a href={f.sourceUrl} … target="_blank" rel="noreferrer">{f.sourceLabel}</a>`, data supplies 3/3 `https://manipurtourism.gov.in/…` + `sourceLabel` (`discovery.ts:17-19`). Annual patterns intact (`21–30 Nov yearly` / `May yearly` / `Feb–Mar full moon, 5 days`).
- [x] Hero/collections intact: `page.tsx:42-156` — emerald hero (H1, 3 CTAs, `<form action="/places" method="get">` + `input name="q"`), stats grid, `COLLECTIONS.map` with empty-hide (`:126`) and live district/category filter. Only delta is import line extension (`:4` merges `SEASONS, FESTIVALS` into existing `COLLECTIONS` import — correct, preserves Task 2).
- [x] How-it-works + trust: pillars body/CTAs/links untouched (`:193-210`); kicker `Why it works` → `How it works` (`:189`) is the minimal reading of brief "unchanged except SectionTitle kickers". Honest-limits trust strip untouched (`:257-272` — `Honest limits` / `What this deliberately does not do`, 4 disclaimers, Browse/Draft CTAs). Featured `Start somewhere` (`:212-255`) untouched — out of Task 3 scope, no Task 2 regression.
- [x] Server component: `export default async function Home()` (`:28`); no `"use client"` in `page.tsx` (grep: only 8 other routes carry it). No client state added to discovery blocks.
- [x] Jewel-Emerald + layout: new sections reuse brief-mandated hexes (`#0B3D2E`, `#9A7A2E`, `#42584F`, `#5D746B`, `#7a5f22`); `<main className="mx-auto w-full max-w-6xl …">` (`:42`) unchanged, left-aligned, `premium-card-hover` consistent.
- [x] No new backend: single-file change (`page.tsx` only); consumes `seedRetriever.listAll()` + static `discovery.ts`; no API, DB, auth, or route added. No banned language in new sections — grep hits are pre-existing honesty disclaimers (`:97` `Host reply ≠ booking`, `:263` `does not book…`), which spec mandates.
- [x] Consumer/producer field match: `SEASONS { name/months/temp/note }`, `FESTIVALS { name/pattern/venues/sourceUrl/sourceLabel }` in `discovery.ts:8-20` match `page.tsx` field accesses exactly; 3 + 3 entries.

## Findings

- **[Informational] F1 — `rel="noreferrer"` vs codebase `rel="noreferrer noopener"`:** `page.tsx:180` follows brief `:48` verbatim (`rel="noreferrer"`), while `places/[id]` and `assistant` pages use `noreferrer noopener`. Brief-mandated, not an implementer fault; harmless (modern browsers imply `noopener` with `_blank`). Do not "fix" without a brief amendment.
- **[Informational] F2 — Brief line range stale:** brief cites `page.tsx:80-193`; actual file went 246 → 275 lines. Implementer correctly treated it as "lower half after collections" and verified hero/collections intact by read-back. No action.

## Evidence relied on (no build re-run)

- Report claim: `npm run build` → `✓ Compiled successfully in 19.8s`, 22/22 static, `/` prerendered; honesty-note grep → `honesty note present`. Accepted as credible — full-file read corroborates: TSX is syntactically valid, all imports resolve (`@/data/discovery`, `@/components/ui`), field accesses match exported types, no `"use client"` or new data-fetching path that could break prerender. Same evidence-acceptance standard as Task 2 re-review.
- No commit: excused — no git repo per progress.md ruling; in-place work only.
