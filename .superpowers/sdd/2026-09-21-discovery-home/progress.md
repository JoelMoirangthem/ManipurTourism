# SDD ledger — plan: docs/superpowers/plans/2026-09-21-discovery-home.md
Ruling: no git repo in D:/ManipuriTourism — skipping worktree/review-package git scripts, working in-place, no commits, verification via build+tests — in-place edits are reversible via file history if wrong


## Pre-flight scan
| Tasks | Produces vs Consumes | Finding |
|---|---|---|
| T1 -> T2 | T1 COLLECTIONS/SEASONS/FESTIVALS vs T2 COLLECTIONS + seedRetriever | Match: field names identical, filter by district/category present in seed |
| T1 -> T3 | T1 SEASONS/FESTIVALS vs T3 same | Match |
| T2 vs T3 | both modify apps/web/src/app/page.tsx (T2 lines 27-80 hero, T3 lines 80-193 lower) | Conflict risk if parallel — Ruling: sequence strictly, never parallel |
| T4 | verification only, no files | Clean |
Ruling: sequence T1-T2-T3-T4 strictly — T2/T3 share page.tsx — what it costs if wrong: merge conflicts and lost edits

Task 1: complete (no commits — no git repo, files discovery.ts + discovery.test.mjs, review clean)
Task 1: minor (deferred): F1 spec §5 filter nesting/tone/verifyNote flattened in plan — Task3 renders verify-note presentationally
Task 1: minor (deferred): F2 TDD red step skipped, red trivially guaranteed
Task 1: minor (deferred): F3 regex guards brittle, Task4 build is real gate
Task 1: minor (deferred): F4 Govindajee prose non-seed, counts must use live filter

Ruling: Task2 review BLOCKING is real — /places ignores ?q/district/category so 4/4 discovery links land unfiltered — fix minimal hydration in places/page.tsx inside Task2 loop, plan 'no new logic' yields to spec §2 hero-search contract — what it costs if wrong: small client-component change, reversible
Task 2: fix round 1/5 dispatched (places hydration)

Task 2: fix round 1/5 (2 addressed, 0 open — ?q + ?district/?category hydration; no new breakage)
Task 2: complete (files page.tsx home + places/page.tsx hydration, re-review PASS)

Task 3: complete (page.tsx seasons+festivals, review PASS)
Task 3: minor (deferred): rel=noreferrer vs noopener per brief-verbatim

Task 4: complete (12/12 tests, build 22/22 clean, checks present)
Final review: CHANGES REQUESTED triaged — 3 must-fix (M1 blurbs, M2 stale filter sync, M3 quick chips) — ONE fix wave applied, scoped re-review PASS, no new breakage

