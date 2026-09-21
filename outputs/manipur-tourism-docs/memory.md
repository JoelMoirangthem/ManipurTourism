# Project memory and decision log

Version 0.2 · 21 September 2026 · Canonical cross-session record for this documentation project. Evidence: [sources.md](sources.md). Execution: [tasks.md](tasks.md). Entries are append-only; a reversal is recorded as a new entry that supersedes an earlier one.

## A. Standing decisions

| ID | Decision | Rationale | Revisit when |
|---|---|---|---|
| M-01 | Documentation-first; no implementation without separate approval | Prevents an unverified prototype from being described as a working service [R01](rules.md) | Phase A2 approval is recorded |
| M-02 | Two documentation sets: canonical specs in `outputs/manipur-tourism-docs/`, phased plan in `docs/build/` | Preserves research integrity while allowing a separate build plan [R02](rules.md) | Sets are merged only by explicit decision |
| M-03 | The core promise is coordination: plan → ask → dated reply → recheck | Addresses the observed information-format gap rather than inventing a new capability | Interviews show a different dominant friction |
| M-04 | Inquiry only; no booking, payment or reservation | Avoids false inventory locking and payment complexity | Contracted inventory ownership and reconciliation exist |
| M-05 | Relational, field-level claims over vector-first retrieval | Small catalogue with typed dates, counts and permissions | A larger reviewed corpus causes measured retrieval misses |
| M-06 | Original-first language handling; translation is experimental | Language, script and transliteration capabilities are separately documented and untested | Pair-specific evaluation passes with two reviewers |
| M-07 | Deterministic planning and arithmetic; the model only explains | Operational facts must be testable outside generated prose | Never for operational facts |
| M-08 | Unknown is a first-class value; never filled with zero, false or a guess | Prevents fabricated certainty reaching a traveller | Never |
| M-09 | Demo fixtures are labeled and isolated from metrics | Protects honesty in the pitch and in reporting [R51](rules.md) | Never |
| M-10 | Default deny for unverified identity in the prototype | Missing authentication is a blocking gap, not an accepted design | Phase C1 completes |

## B. Verified corrections carried forward

1. The official accommodation directory lists **13 rooms** for the named Sendra Resort property with an unstated publication date. That is published capacity, **not** current availability, and not a count for all accommodation in the area [S04](sources.md).
2. The claim of **about 10 rooms total** is unsupported. The local tender PDF yielded no extractable text in this audit and its schedule remains unverified [S21](sources.md).
3. Sarvam Translate documents Manipuri `mni-IN` but explicitly does **not** support `output_script`; Mayura's script controls do not include Manipuri. Romanized Meiteilon chat is therefore **not** established by combining them [S10–S12](sources.md).
4. Weather APIs **do** exist (IMD, Open-Meteo). The earlier claim that no live weather infrastructure exists is too broad. Provider access, coverage and terms remain untested [S17–S19](sources.md).
5. Search grounding retrieves web evidence; it does not verify live inventory, bookings or area safety [S15](sources.md).
6. Official tourism pages exist and already expose accommodation discovery, an ILP service and festival editions. “No tourism platform exists” is false framing [S05–S08](sources.md).
7. “Narrow scope means no hallucination” is unsupported as a guarantee. Scope reduction is mitigation, not proof.
8. A manually editable spreadsheet is not real-time; call it a dated report [R07](rules.md).

## C. Open questions and blockers

| ID | Question | Owner | Blocks |
|---|---|---|---|
| Q-01 | Confirmed rulebook: team size, pitch length, rubric, prebuilt-code policy, AI/data restrictions | Team | Phase A1 and demo claims |
| Q-02 | Which provider keys and what hard spend ceiling | Team | Optional AI, translation, grounding |
| Q-03 | Are any real providers consenting, or is the demo entirely synthetic? | Team | Honest demo language |
| Q-04 | Who reviews translated content, and in which script? | Team | Any local-language claim |
| Q-05 | Does any destination need a permit for the audience addressed? | Team | Any travel-preparation content |
| Q-06 | Current status of the Sendra property and its operator | Team | Any current-state statement |

## D. Prototype observations (not field evidence)

- A Next.js prototype exists under `apps/web` with catalogue, planner, assistant, inquiry, inbox, review and upload surfaces.
- Inquiry integrity mechanics (idempotency key and payload digest, per-thread sequence, host-reported replies) are present in the file-backed store.
- Two blocking gaps: private inquiries are listable without actor scoping, and sender identity is client-supplied [T06](testing.md), [R38–R39](rules.md).
- The assistant uses a citation-presence check, which is weaker than semantic validation against the evidence bundle.
- Runtime state is local files and seed JSON; the relational schema exists but is not yet the source of truth.
- Keys have previously appeared in chat transcripts; rotate before any public or shared environment.

## E. Change log

- 2026-09-20: Canonical research pack authored (PRD 0.1, research, sources, architecture, data model, workflows, system design, API contracts, data governance).
- 2026-09-20: Phased build plan authored in `docs/build/`; prototype scaffolding created and smoke-tested locally.
- 2026-09-21: Continuation pass — added `rules.md`, `design.md`, `tasks.md`, `testing.md`, `folder-structure.md`, this memory file and `index.md`; audited and corrected `PRD.MD`, `research.md`, `sources.md`, `architecture.md`, `systemdesigning.md` and `data-governance.md`; recorded the prototype gap register.
- Open contradiction to resolve: `PRD.MD` uses an all-caps filename while other documents use lowercase hyphenated names. No links are broken today; normalize on the next edit.
- 2026-09-21: second continuation pass added `claims.md` (claim audit register), `index.md`, `systemdesigning-summary.md`; reconciled `PRD.MD`, `workflows.md` and the claims register with the task plan. Nothing implemented in either pass.
