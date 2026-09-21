# SDD ledger — plan: D:\ManipuriTourism\docs\superpowers\plans\2026-09-21-messaging-merge.md

## Setup rulings (pre-execution)
- Ruling: no git repo in workspace → no worktree, no commits, no git-based review packages. Implementers verify via test commands; reviewers read touched files directly + brief + report. Cost if wrong: review artifacts live as files only; no history — acceptable, plan already skips commits.
- Ruling: Task tool exposes no model parameter → all subagents run as `general` (session default). Cost if wrong: higher cost than skill's cheap-tier ideal; accepted, no alternative.
- Ruling: bash skill scripts (sdd-workspace/task-brief/review-package) not executed on win32 PowerShell → workspace/briefs created manually at this dir. Cost if wrong: none, same paths.
- Ruling: unified KIND_LABEL uses "Host reports …" wording (matches inquiries/[id] view); inbox reply-form copy changes slightly. Cost if wrong: trivial copy delta, reviewer to confirm clarity.

## Pre-flight conflict scan
| Pair | Shared surface | Finding |
|---|---|---|
| T1→T2 | `threadUrl`, `roleCopy` | T1 defines exact code; T2 consumes as specified. Clean. |
| T1→T3 | `KIND_LABEL` | Exact code in T1; T3 imports + deletes local copies. Clean. |
| T2↔T3 | `src/app/messages/*` | Distinct files (page vs [id]/page). Clean. |
| T2/T3→T4 | old routes, nav, inquire | T4 only redirects/relables; no edits to new files. Clean. |
| T5 | verification only | Consumes all; no conflicts. Clean. |
| Global | "0 eslint errors" | Scoped to touched files only (pre-existing violations elsewhere untouched). Clean. |

Task 1: complete (no commits � no git repo; review clean)

NearbyMap repair: complete (JSX balance restored; tsc+eslint clean; API 200 on :3000)
Task 2: complete (Spec OK; 3 deferred minors for final review: lint waiver messages/page.tsx:33, dynamic render outstanding, leftover word 'threads' messages/page.tsx:62)

Task 3: complete (review clean; 1 deferred minor for final review: ReplyForm date defaults today/tomorrow vs thread dates)

Task 4: complete (Spec OK, Approved; 2 deferred minors for final review: leftover /inbox hrefs layout.tsx:30 MORE_NAV, messages/[id]/page.tsx:148 � redirect stub catches, direct links preferred)
