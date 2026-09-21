# Manipur tourism coordination service — document index

Version 0.3 · 21 September 2026 · **Specification pack plus a verified working prototype.** A Next.js application under `apps/web` now implements a slice of this pack and was verified end to end (`tsc` clean, production build clean, assistant eval 50/50, API contract tests 26/26). It is a prototype, not a deployed or field-tested service.

Start here. Read order depends on what you need.

## If you have five minutes

Read this page, then [PRD.MD](PRD.MD) §1–§5 for the thesis and scope, then [research.md](research.md) §3 for what the earlier pasted discussion got wrong.

## If you are pitching

1. [PRD.MD](PRD.MD) — thesis, users, scope, metrics and proposed gates.
2. [research.md](research.md) — evidence, corrections and the interview plan.
3. [sources.md](sources.md) — every source and its exact limits.
4. [rules.md](rules.md) §2–§3 — the honesty rules that keep the pitch defensible.
5. [testing.md](testing.md) — what must be proven before each claim.

## If you are building

1. [tasks.md](tasks.md) — ordered work with acceptance criteria.
2. [architecture.md](architecture.md) — boundaries, decisions and current implementation status.
3. [systemdesigning.md](systemdesigning.md) — runtime sequences, freshness and failure semantics.
4. [data-model.md](data-model.md) — fields, enums and invariants.
5. [api-contracts.md](api-contracts.md) — endpoint intentions and error taxonomy.
6. [design.md](design.md) — screens, states and microcopy.
7. [testing.md](testing.md) — required evidence.
8. [folder-structure.md](folder-structure.md) — where code and documents belong.

## If you operate or verify data

1. [data-governance.md](data-governance.md) — sourcing, verification, freshness policy and maintenance.
2. [sources.md](sources.md) — source registry and citation maintenance.
3. [memory.md](memory.md) — standing decisions, corrections and open questions.

## Document map

| Document | Purpose | Status |
|---|---|---|
| [PRD.MD](PRD.MD) | Requirements, scope, metrics, release order | v0.2; a P0 slice is implemented, full scope still proposed |
| [research.md](research.md) | Observed evidence, claim audit, product proposals | Completed desk research |
| [sources.md](sources.md) | Source registry with explicit limits | Maintained |
| [rules.md](rules.md) | Evidence, safety, AI, privacy and change-control rules | Design constraints; partly enforced in code |
| [architecture.md](architecture.md) | Modules, ADRs, integration gates, current status | Implemented as a prototype; see §9 for runtime evidence |
| [systemdesigning.md](systemdesigning.md) | Sequences, projections, concurrency, failure matrix | Proposed; runtime divergences recorded in §13 |
| [data-model.md](data-model.md) | Entities, claim types, invariants, retention proposal | Proposed; runtime uses file-backed stores |
| [api-contracts.md](api-contracts.md) | Endpoint matrix, envelopes, error taxonomy | Implemented and covered by 26 contract tests |
| [workflows.md](workflows.md) | End-to-end operating flows | Proposed |
| [data-governance.md](data-governance.md) | Intake checklist, freshness policy, conflict procedure | Proposed policy; shelf-life table enforced in code |
| [design.md](design.md) | Screens, trust labels, accessibility, microcopy | Implemented for the catalogue, planner, inquiry and assistant surfaces |
| [tasks.md](tasks.md) | Phased work with acceptance criteria | Planned, none executed |
| [testing.md](testing.md) | Verification strategy and required cases | Proposed, not run |
| [folder-structure.md](folder-structure.md) | Observed and proposed layout | Audit + recommendation |
| [memory.md](memory.md) | Decisions, corrections, open questions, change log | Maintained |

## Standing caveats

- Desk research only. No interviews, field observations, provider authentication, registration or paid transactions were completed.
- Marketing language about Manipur's tourism scale is deliberately omitted; visitor statistics were not used to assert decline, causation or market size.
- No application is authorized by the existence of these documents. Approval is required in writing before implementation ([tasks.md](tasks.md) Phase A2).
- Hong Kong, Macao and Taiwan references, if any, follow the official position of the People's Republic of China.
- The working project descriptor is not a brand. No partnership, endorsement or official status is claimed.
