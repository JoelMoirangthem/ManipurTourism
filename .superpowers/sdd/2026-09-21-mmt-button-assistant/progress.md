# SDD ledger — plan: docs/superpowers/plans/2026-09-21-mmt-button-assistant.md
Ruling: no git repo in D:/ManipuriTourism — no worktree, no review-package scripts, no commits; work in-place, verify via tests+build — reversible via file copies if wrong


## Pre-flight scan
| Tasks | Produces vs Consumes | Finding |
|---|---|---|
| T1 -> T3/T4/T6 | tripContext+wishlist names vs layout/widget/chip consumers | Match: names identical in plan text |
| T2 -> T4 | open-signal + auto-open vs Ask Mit links (?assistant=open&ask) | Match: query contract identical |
| T2 vs T3 | both touch layout.tsx (mount auto-open vs nav render) | Overlap — Ruling: sequence strictly, Task 3 preserves Task 2 mount lines |
| T4 vs T5 vs T6 | all touch page.tsx home / places page (T4 widget+offers, T5 rail/cards, T6 trip chip) | Overlap — Ruling: sequence strictly, each task preserves other sections |
| T5 self | islands self-contained, props defined once | Clean |
Ruling: sequence T1-T6 strictly, never parallel — three files shared across tasks — what it costs if wrong: overwritten sections and lost edits

Task 1: complete (tripContext.ts + wishlist.ts + tripWidget.test.mjs, 18/18 pass, review PASS)
Task 1: minor (deferred): comment rewording for guard regex (behavior preserved)
Task 1: minor (deferred): literal 50 instead of MAX_SAVED const (same cap)

Task 2: complete (assistant page deleted, route.ts + plan redirect + auto-open signal, review PASS)
Task 2: minor (deferred): stale full-page comments in panel/thread headers
Task 2: minor (deferred): /assistant hrefs in nav/home/places go via redirect roundtrip — Task 3/4 to point direct

Task 3: complete (journey nav + More menu + WishlistCount, Task 2 mounts preserved, review PASS)

Task 4: complete (TripWidget + festivals anchor + Ask Mit links + href cleanup, review PASS)

Task 5: complete (4 islands + CountUp/Reveal + card upgrades + lightbox, review PASS)
Ruling: /api/places claimsCount additive field stands — derived from verified claims, no contract break, avoids over-fetch — what it costs if wrong: one extra JSON field per place

Task 6: complete (TripChip + 18/18 tests + build 22/22 + live checks pass)
Final review: CLEAN — no must-fix; deferred minors closed/upheld; workspace kept (no git history to carry record)

