# PRD — Manipur tourism coordination assistant

Version: 0.2 · Date: 20 September 2026 · Status: **proposed specification, awaiting approval**

Working descriptor only: **Manipur tourism coordination assistant**. No final brand chosen. **Documentation only: no application built, integrated, deployed or tested.**

Evidence: [research.md](research.md), [sources.md](sources.md), [claims.md](claims.md). Detailed flows: [workflows.md](workflows.md). Rules: [rules.md](rules.md). Execution: [tasks.md](tasks.md), [testing.md](testing.md). Design: [design.md](design.md).

## 1. Product thesis

Help visitors and participating local providers turn fragmented published information into a practical, tentative plan and a clear human inquiry. Every operational answer should show who said it, when it was observed, what dates it covers and what is still unconfirmed.

**North-star user outcome:** a traveller completes a feasible planning attempt and receives an understandable, date-scoped response from the intended local provider without confusing it with a reservation or a safety guarantee.

“Feasible” here means passing the app's **documented known constraints**. It does not certify real-world route conditions, availability, weather suitability or access.

## 2. Problem and evidence boundaries

- The official accommodation directory lists static property capacity; it does not establish stay-date vacancies [S04](sources.md#s04).
- Inspected official festival resources include previous editions [S05](sources.md#s05), [S06](sources.md#s06).
- Language/script support differs across documented providers [S10](sources.md#s10)–[S14](sources.md#s14).
- Existing tourism and ILP services should be linked and complemented, not falsely described as missing [S05](sources.md#s05), [S08](sources.md#s08).
- Actual prevalence and priority of communication/planning problems require interviews. No user study has been completed.

## 3. Users and roles

These are proposed user categories, not research-validated personas.

| Role | Job to be done | Permissions/boundaries |
|---|---|---|
| Visitor | Find options, prepare questions, draft a trip, understand a local reply | Browse anonymously; authenticated participation for private inquiries; own plans/messages only |
| Local host/guide/activity provider | Receive complete inquiries, reply quickly, report own service availability | Manage only claimed/approved listings; cannot certify area-wide conditions |
| Project reviewer | Check provenance, resolve reports, maintain catalogue | Assigned listings/categories; cannot imply government authority |
| Project administrator | Manage access, policies, abuse and incidents | Explicit admin role, audited actions; no default right to read private conversations |
| Optional official partner | Publish information within formally agreed scope | Disabled until partnership and account authority are verified |

Residents may use visitor features for local outings; they are not forced into a provider role. Never assume every local person speaks the same language or script.

## 4. Initial scope

### Geographic/product scope

Proposed discovery scope: **Imphal and the Loktak/Sendra context**, because those appeared in the user's idea and have official tourism references. This is **not** a statement that a corridor is currently accessible or appropriate to travel. Final pilot places depend on verification and consenting operators.

Proposed content cap for a hackathon slice: **5–8 place records and 2–3 opted-in provider records**. If fewer can be verified, ship fewer. Demo-only providers must use synthetic names and conspicuous fixture labels.

### Language scope

English interface first; Hindi can be enabled after review. Manipuri/Meiteilon has separate language-and-script capability gates. Human-reviewed phrase cards are the dependable local-language entry point; arbitrary machine translation is experimental until evaluation passes. No unsupported language is silently replaced with Hindi or English.

### Platform scope

Responsive mobile-first web application/PWA. One deployment and one relational database. Low-bandwidth text flow before imagery. No native apps required for MVP.

## 5. Goals and non-goals

### Goals

1. Make available evidence and its limitations understandable at the decision point.
2. Reduce incomplete back-and-forth in visitor–provider inquiries.
3. Generate a constrained tentative itinerary without invented inventory, price, event date or travel duration.
4. Let local providers update their own records with minimal effort and clear provenance.
5. Remain useful when AI, translation or network services fail.
6. Demonstrate the whole loop honestly using sourced catalogue records and clearly separated fixtures where necessary.

### Non-goals

No reservations, payments, refunds or inventory locking. No real-time road/safety guarantees. No emergency dispatch. No permit issuance or identity-document collection. No continuous location tracking. No broad social network, public unmoderated feed or review marketplace. No demand/revenue forecast from festival budgets. No promise to solve every tourism problem or replace official channels.

## 6. Functional requirements

P0 = core; P1 = optional enhancement after gates; P2 = later investigation. Status as of 21 September 2026: the prototype implements a verified slice of the P0 requirements (see [architecture.md](architecture.md) §9 for the runtime evidence and [tasks.md](tasks.md) for the per-task status). Requirements are **not** all implemented and the prototype is **not** production-ready.

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-01 | P0 | Sourced catalogue | Every displayed factual field maps to evidence; unknown values remain null; capacity and date-specific availability never share a field |
| FR-02 | P0 | Trip brief | Collect dates, party size, interests, budget scope, transport assumption and access needs; clarify missing essentials rather than silently guessing |
| FR-03 | P0 | Deterministic tentative planner | Exclude active closures and unresolved closure history; reject impossible known schedules; unknown transfers produce an unscheduled draft, not exact arrival times |
| FR-04 | P0 | Grounded assistant | Answers selected intents using approved records; factual citations resolvable; no unsupported numbers; unknown and conflicting evidence surfaced |
| FR-05 | P0 | Explicit inquiry creation | User sees recipient, dates, party and original text before sending; authenticated consent required; send is not booking |
| FR-06 | P0 | Provider inbox | Opted-in providers view only their threads; reply through structured fields plus text; no account means external contact handoff, not a fictional live inbox |
| FR-07 | P0 | Availability report | Listing, date range, applicable unit, reported time and expiry required; report is host-supplied and not inventory allocation |
| FR-08 | P0 | Human-readable message states | Distinguish local draft, queued, server accepted and recipient read; no sent/read claims without matching acknowledgement |
| FR-09 | P0 | Trust and status display | Source, field scope, age, verification type and stale/conflict state visible; no blanket “verified/safe” badge |
| FR-10 | P0 | Catalogue/reviewer console | Record source and reason; approve/version facts; expire or flag claims; append audit event; reviewer authority clearly scoped |
| FR-11 | P0 | Original message and phrase fallback | Original always available; reviewed phrase cards only marked reviewed after approval; structured dates/numbers shown outside translation |
| FR-12 | P0 | Cached read-only travel pack | Save public facts and user's selected draft by explicit action; show snapshot age offline; queue only message drafts, not operational updates |
| FR-13 | P0 | Role/access and abuse controls | Cross-account access denied; consented contact exposure; block/report controls; rate limits and private-data logging restrictions |
| FR-14 | P1 | Experimental machine translation | Enable each language/script pair only after capability and evaluation gates; preserve original and critical fields; downgrade on failure |
| FR-15 | P1 | Weather context | Verified adapter terms/coverage, units and valid time; forecast badge; no inference of road or activity safety |
| FR-16 | P1 | Sourced-web lookup | Explicit lookup where catalogue lacks background facts; bounded requests; external text treated as untrusted; never auto-writes status |
| FR-17 | P1 | Festival calendar/host demand context | Confirmed edition/date/source required for upcoming events; old events historical; “potentially relevant event,” not occupancy forecast |
| FR-18 | P2 | Additional locations/languages/channels | Expand only after partner coverage, data maintenance and measured usability support it |

## 7. Core user stories

- As a visitor, I want to see **what I still need to confirm**, rather than receive a polished but misleading complete plan.
- As a visitor, I want to ask a named host about my dates without the assistant changing my meaning or sharing my full private itinerary.
- As a provider, I want dates, group size and service type up front so I can answer with fewer clarification messages.
- As a provider, I want an availability report to expire rather than be treated as a permanent promise.
- As a reviewer, I want to distinguish a published directory claim, an operator report and a recent official notice instead of assigning one universal trust score.
- As a low-connectivity user, I want to know whether a message is only on my device or actually on the server.

## 8. Planning behavior

Inputs are constraints, not invitations to invent defaults. A default may be offered but must be visibly accepted. Dates interpreted in **Asia/Kolkata**; relative expressions must be resolved and shown to the user.

1. Filter by curated category and user constraints.
2. Reject confirmed incompatible access needs; unknown accessibility remains unknown and is flagged for inquiry.
3. Exclude restricted/closed services and unresolved closure history from suggested activity slots.
4. Use only source-backed transfer ranges and opening windows. Where missing, display ordered ideas with “transfer time to confirm,” not a runnable schedule.
5. Match stay-date coverage for each night. Capacity is not availability. Quotes are not total trip budgets unless all components and currency are known.
6. Rank remaining options by declared preferences and evidence completeness; explain the trade-off. Do not systematically hide small providers merely because they have less marketing data.
7. Generate a tentative plan with evidence references, missing facts and next-action buttons.
8. Recheck versions before sending inquiries or reopening an old plan. Never silently change a saved plan.

## 9. Trust terminology

Approved vocabulary: **Published directory fact**, **Host-reported**, **Project-reviewed source**, **Official notice**, **Forecast**, **Unknown**, **Stale**, **Conflicting reports**, **Demo data**.

Prohibited shortcuts: “100% accurate,” “AI-verified,” “safe area,” “live availability” for an undated count, “official partner” without authorization, “confirmed booking” for an inquiry response.

No model-generated confidence percentage. Display discrete evidence quality and recency, not invented calibration.

## 10. Metrics and proposed release gates

All numerical values here are **targets**, not achieved results or local observations.

| Measure | Proposed gate | Method |
|---|---|---|
| Critical fabricated operational claims | 0 in the release test set | 40 adversarial grounded-answer cases; human assessment |
| Displayed factual claims with resolvable evidence | 100% for catalogue-derived factual outputs | Field/citation validator plus sample manual review |
| False booking/safety guarantees | 0 in test set | Explicit prohibited-intent tests |
| Authorized state changes | 100% through scoped server checks | Role matrix and cross-account tests |
| Structured message field preservation | 100% for date, party, price/currency and negation-related structured selections | Before/after translation contract checks |
| Translation release | ≥95% acceptable meaning on the small reviewed set and 0 critical meaning errors | At least 60 tourism-message cases, two competent reviewers; small-set result is not universal quality |
| Usability | ≥4 of 5 visitors complete the inquiry task; ≥2 of 3 providers reply unaided | Consented pilot, report failures and sample bias |
| Inbox durability | 0 duplicate messages or false sent indicators in specified disconnect/retry scenarios | Two-session integration tests |
| Non-AI data API latency | p95 ≤750 ms in a documented small test | Proposed 20 concurrent users, at least 200 requests, stated test region/environment |
| AI user experience | Visible progress immediately; timeout/degrade by 12 seconds | End-to-end timing, report provider/network contribution |
| Initial mobile usability | Text catalogue usable within 3 seconds at 1.6 Mbps / 150 ms RTT test profile | Emulated profile, not a claim about local networks |

Pilot north-star analysis: count completed **inquiry loops**, with the denominator of legitimate inquiry attempts. Exclude fixture interactions, spam and staff rehearsals; do not report them as customer traction.

## 11. Dependencies and release order

1. Organizer rules and user approval to begin implementation ([tasks.md](tasks.md) Phase A).
2. Source ledger and claim schema ([claims.md](claims.md)).
3. Catalogue + deterministic planner + source display.
4. Authentication, provider consent/claiming and inquiry loop.
5. Reviewer workflow and trust/expiry logic.
6. Offline pack and original/phrase-card behavior.
7. Provider integrations only if time/access/quality permits.
8. Validation before any public pilot.

P0 describes the full pilot baseline, not a promise that every feature fits the event. The smaller stage-demo slice and stop gates are defined in [tasks.md](tasks.md); incomplete P0 requirements must stay explicitly unimplemented. Approval of a demo does not approve a public pilot.

A hackathon can demonstrate a smaller subset honestly. If no real operators are recruited, the stage demo uses labeled synthetic operator records, and the project remains a **prototype**, not a live service.

## 12. Approval required before building

Confirm team size and skills, available time under event rules, approved hosting/API spend, final pilot scope, data maintainer, partner availability and language reviewers. The stack and all limits in this pack are recommendations. No implementation is authorized by the existence of these documents.
