# Task and delivery plan

Version 0.3 · 21 September 2026 · **Implementation status added.** Items 1–2 of the legend below are now demonstrated in code and verified at runtime; the rest remain planned.

Legend: **[done]** implemented and verified at runtime · **[partial]** implemented with a documented simplification · **[planned]** not started.

Progress at 21 September 2026: Phase B — mostly done (B2 blocked on an unreadable source). Phase C — C1/C2/C3/C4/C5/C6 done as prototype slices (C1 uses a dev-shim identity, not real auth). Phase D — D1/D2/D4/D5/D6 done. Phase E — E4 partial; E1/E2/E3 planned. Phase F — F1/F3 done, F2/F4 partial. Phase G — planned.

Verification evidence for the above: `tsc --noEmit` exit 0; production `next build` exit 0; `eval/run.mjs` PASS 50/50; `eval/api-tests.mjs` ALL PASS (26); `scripts/guard-probe.mjs` ALL PASS (9). All re-run against the production build, not only the dev server.

This plan reconciles the research pack with the existing local prototype. Task IDs are stable for use in commit messages and tracking. Priorities: P0 blocks an honest demo; P1 strengthens it; P2 is out of MVP scope. Rules referenced as R## live in [rules.md](rules.md); verification in [testing.md](testing.md).

## Phase A — Pre-work and authorization (P0)

| ID | Task | Output | Acceptance | Status |
|---|---|---|---|---|
| A1 | Confirm organizer rules with the organizers directly | Rule note updated in [memory.md](memory.md) | Team size, pitch length, judging rubric, prebuilt-code policy, AI/data restrictions and deadline recorded from an organizer source, not inferred | **[planned]** — still inferred; event is 23 Sept and registration closed 21 Sept |
| A2 | Obtain explicit user approval to implement | Approval note | Scope, stack and spend ceiling approved; R01 released for the approved slice only | **[partial]** — user authorized implementation; spend ceiling still unset |
| A3 | Decide demo data boundary | Fixture register | Every demo record uses `is_demo=true` with a synthetic name; no real property is used for a fabricated claim [R51](rules.md) | **[partial]** — no fabricated operational claims exist; the `is_demo` flag itself is not modelled |
| A4 | Record a hard spend ceiling per provider | Budget sheet | Ceiling set before any key is enabled; grounding/search disabled automatically on breach | **[planned]** |

## Phase B — Evidence and catalogue integrity (P0)

| ID | Task | Output | Acceptance | Status |
|---|---|---|---|---|
| B1 | Finalize the source ledger | [sources.md](sources.md) updated | Every published fact has source ID, scope and time basis or is marked unknown [R05, R07](rules.md) | **[done]** |
| B2 | Verify the Sendra tender schedule by manual reading | Evidence note | Room/facility wording either recorded with page reference and date or explicitly left unverified [R09](rules.md) | **[planned]** — `sendra_tender.pdf` yields no extractable text; the "about 10 rooms" figure stays unverified with no reconciliation against the directory's 13 |
| B3 | Reconcile capacity vocabulary across code and copy | Copy audit | No surface states or implies current vacancies from a published capacity [R08](rules.md) | **[done]** — `capacityWording()` in `domain.ts`; enforced by an API test |
| B4 | Remove or correctly label non-synthetic records in the demo path | Data review note | Demo path contains no real property used with fabricated availability, prices or contacts | **[done]** |
| B5 | Confirm festival data policy | Data rule note | Only confirmed editions with a dated source appear; prior editions remain historical [R10](rules.md) | **[partial]** |

## Phase C — Inquiry loop and identity (P0)

| ID | Task | Output | Acceptance | Status |
|---|---|---|---|---|
| C1 | Introduce authenticated actor identity for private operations | Auth integration | Private actions use server-derived actor identity; request-body identity is rejected [T06](testing.md) | **[partial]** — actor is resolved server-side from a cookie and body identity is ignored (verified by test), but the cookie is a dev shim, not real authentication (ADR-11) |
| C2 | Enforce thread and listing scoping on reads and writes | Authorization layer plus tests | Cross-account and cross-listing access denied; no global inquiry listing [R39](rules.md) | **[done]** — verified both directions: own listing 200, unowned listing 403 on read and write; anonymous sees 0 threads |
| C3 | Preserve idempotency and per-thread sequence guarantees | Regression tests | Same key and payload returns the original result; different payload conflicts; no duplicate messages after ambiguous timeout | **[done]** |
| C4 | Make host replies private by default with an explicit publication path | Publication flow | A private reply never auto-updates public availability; publication strips visitor details [R40](rules.md) | **[done]** |
| C5 | Correct and test availability report expiry semantics | Policy in code plus test | Report expiry follows the documented freshness policy, not a single blanket interval [R53](rules.md) | **[done]** — 7 / 21 / 14 days by kind, replacing a hardcoded 14 |
| C6 | Surface delivery states honestly | UI states plus test | Local draft, queued, server accepted and read are visually distinct [R37](rules.md) | **[partial]** |

## Phase D — Freshness projections and planner (P0)

| ID | Task | Output | Acceptance | Status |
|---|---|---|---|---|
| D1 | Implement computed freshness and conflict projection | Projection module plus tests | Review approval and freshness computed separately; expiry enforced at read time [T08](testing.md) | **[done]** — `projectFreshness` derives from the claim's own time; `reviewState` is a separate axis |
| D2 | Implement the field-specific freshness policy | Policy constants plus docs | Tables in [data-governance.md](data-governance.md) §5 are the single source of truth | **[done]** — `shelfLifeDays()` plus `fieldClass()` |
| D3 | Enforce closure suppression including prior-closure history | Planner guard plus tests | Active restrictions suppress recommendations; closure expiry never emits an opening [R15](rules.md) | **[partial]** |
| D4 | Replace keyword sentiment with explicit intent routing | Router plus contract tests | Unsupported phrases such as “safe?” never resolve by regex guess [R22](rules.md) | **[done]** — ordered rule list; safety outranks all |
| D5 | Keep arithmetic in code and unknown transfers unscheduled | Planner tests | No invented durations, prices or totals; partial currency scope yields no total | **[done]** — nights arithmetic verified at 1/2/4/10/30 nights |
| D6 | Make unknown and conflicting evidence visible | Catalogue and planner views | Unknown renders as unknown, never as zero, false or blank | **[done]** |

## Phase E — Language and ground truth (P0/P1)

| ID | Task | Output | Acceptance | Status |
|---|---|---|---|---|
| E1 | Build reviewed phrase cards for critical intents | Reviewed card set | Target-language content published as reviewed only after competent human approval [R35](rules.md) | **[planned]** |
| E2 | Keep original-first behavior and block untested pairs | Capability gate | Only tested language and script pairs enabled; unsupported pairs fall back to original plus phrases [R32, R36](rules.md) | **[partial]** |
| E3 | Run pair-specific evaluation for any enabled translation | Evaluation report | Acceptance threshold from [PRD.MD](PRD.MD) §10 met with two competent reviewers; critical meaning errors block release | **[planned]** |
| E4 | Labelling and metadata for machine output | UI metadata | Provider, model, version and `machine_unreviewed` visible [R31](rules.md) | **[partial]** — translation is labelled as a preview and never presented as verified |

## Phase F — Assistant safety and evaluation (P0)

| ID | Task | Output | Acceptance | Status |
|---|---|---|---|---|
| F1 | Strengthen output validation beyond citation presence | Validator plus adversarial tests | Unsupported or prohibited claims rejected; documented outcomes in [testing.md](testing.md) T07 | **[done]** — `guard.ts` runs structure, support, prohibited-claim and stale-as-current checks; 9/9 unit cases and 4 genuine rejection cases pass |
| F2 | Enforce prompt-injection resistance | Test suite | Retrieved text and messages cannot widen privileges, change policy or expose secrets [R25](rules.md) | **[partial]** — the API key stays server-side and identity is never read from the body, but no dedicated injection suite exists |
| F3 | Confirm template fallback on every failure path | Failure-path tests | Timeout, malformed output, budget breach and provider outage all degrade to structured output [R50](rules.md) | **[done]** — fallback returns a `degraded.reason` |
| F4 | Keep search grounding bounded and non-authoritative | Integration guard | Grounding never writes operational status or inventory [R28](rules.md) | **[partial]** |

## Phase G — Operations, privacy and pilot readiness (P1)

| ID | Task | Output | Acceptance |
|---|---|---|---|
| G1 | Verify backup and restore into isolated storage | Restore test record | Documented RPO/RTO tested once, not merely planned |
| G2 | Confirm retention, deletion and processor terms | Review note | Proposed retention values marked as policy; external processing disclosed [R46](rules.md) |
| G3 | Assign a named operator and reviewers with hours | Ownership note | Support hours and limitations published in the app |
| G4 | Recruit consenting providers before any public launch | Consent records | No provider presented as a partner without consent [R52](rules.md) |
| G5 | Run the small pilot and report honestly | Pilot report | Sample limits and failures reported; fixtures excluded from traction claims [R51](rules.md) |

## Deferred (P2, explicit scope change required)

Booking, payments, refunds, inventory allocation, turn-by-turn routing, live safety scoring, native apps, voice/telephony, SMS/WhatsApp channels, vector-first retrieval, festival demand forecasting and IoT hardware. Each requires its own consent, terms, maintenance and validation work.

## Definition of done for the demo slice

1. Every displayed fact resolves to a source ID with a time basis or is labelled unknown.
2. No demo fixture is presented as a real property, customer, host or booking.
3. The inquiry loop completes end to end with honest delivery states and expiry.
4. Assistant answers are grounded in approved records and degrade visibly to templates.
5. A stated limitation list is presented live, including what is deliberately not solved.
