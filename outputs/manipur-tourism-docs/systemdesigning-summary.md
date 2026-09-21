# System design summary

Version 0.2 · 21 September 2026 · **Proposed design. No system described here has been built, tested or deployed as part of this documentation work.**

This file is the concise orientation. The authoritative details are in [systemdesigning.md](systemdesigning.md), with boundaries in [architecture.md](architecture.md), fields in [data-model.md](data-model.md) and interfaces in [api-contracts.md](api-contracts.md). Where this summary and a detailed document differ, the detailed document governs and this summary must be corrected.

## 1. What the system is

A single deployable web application that lets a visitor assemble a tentative plan from sourced records, send a structured inquiry to a consenting local provider, and read a dated host reply. It is a coordination service with a strict evidence model, not a chatbot and not a booking system.

## 2. Design in one paragraph

One TypeScript application and one relational database deliver all modules; external models, translation, weather and search are optional adapters behind narrow interfaces. Evidence is stored as field-level claims with sources and time bounds, and a projection computes what is currently displayable, stale, conflicting or unknown. Planning and arithmetic run deterministically in application code; the model may only explain already-computed results. Every mutation is authenticated, authorized, validated and idempotent, and every optional provider failure degrades to a structured template rather than invented output.

## 3. Component responsibilities

| Component | Owns | Explicitly must not |
|---|---|---|
| Catalogue | Places, listings, aliases, sourced summaries | Claim capacity is availability |
| Evidence projection | Claim validity, freshness, conflicts, suppression | Treat recency or domain as proof |
| Planner | Constraint filtering, ordering, money arithmetic | Invent durations, prices or totals |
| Inquiry | Threads, originals, structured replies, states | Reserve inventory or promise delivery |
| Language | Capability registry, adapters, reviewed phrases | Treat transliteration as translation |
| Assistant orchestration | Intent routing, retrieval, validation, fallback | Mutate state or widen its own privileges |
| Review/admin | Scoped approval, provenance, moderation, audit | Imply official authority |
| Offline | Saved snapshots and local drafts | Claim live data while offline |
| Jobs/observability | Expiry, retries, error metrics, audit upkeep | Store private message bodies in generic logs |

## 4. Primary runtime flows

| Flow | Shape | Key guarantee |
|---|---|---|
| Plan a visit | Validate brief → read a coherent snapshot of approved claims → compute freshness and suppression → filter and order in code → optional explanation → return draft with unknowns | No invented facts; no exact times without verified transfers |
| Ask a provider | Preview recipient and content → server authorizes membership → commit inquiry and first message in one transaction → acknowledge acceptance | Exactly one message per authorized intent, even after a timeout |
| Receive a reply | Provider submits structured fields → server validates dates and units → expiry applied → reply stays private until explicitly published | Host-reported, date-scoped, expiring, never a reservation |
| Answer a question | Route intent → retrieve approved evidence for the requester's scope → validate output schema and references → render structured facts with model prose only where allowed | Unsupported or prohibited claims are rejected, not softened |
| Degrade | Optional provider fails, times out or exhausts budget | Core browsing, planning and original-language inquiries continue to work |

## 5. Trust and safety invariants

1. Unknown is stored and displayed as unknown, never as zero, false or a guess.
2. Capacity, availability, quotes, forecasts and operational status are separate fields with separate sources and time bounds.
3. An active restriction outranks a provider report about a different field; a provider's dated availability answer outranks an undated directory count for the vacancy question.
4. Closure expiry never implies reopening; prior closure remains a suppression reason until credible superseding evidence exists.
5. No surface asserts safety, certification, official partnership or live inventory.
6. Public projection never includes private inquiries, consent evidence, private availability reports or identity data.

## 6. Data and storage

- Entities: users, places, listings, memberships, consents, sources, claims, reviews, availability reports, events, transfers, plans and plan items, inquiries, messages, translations, read receipts, phrase cards, capabilities, idempotency records, audit events, abuse reports.
- Instants stored in UTC and exchanged with explicit offsets; travel dates are date-only and interpreted in Asia/Kolkata.
- Check-in inclusive, checkout exclusive; a report must cover every requested night.
- Money uses integer minor units with an explicit currency; floating-point money arithmetic is prohibited.
- Revision numbers support optimistic concurrency; evidence history is appended or superseded, never silently replaced.
- Retention, deletion and processing terms are proposed policy and require review before any public launch.

## 7. Interfaces

Internal endpoints under `/api/v1` cover public catalogue reads, plan drafts, assistant answers, inquiries and messages, read receipts, availability reports, claims and reviews, phrase cards, optional weather and reports. Every response carries a request identifier; versioned edits carry an expected version; sends carry an idempotency key. Errors are typed and must not leak internals, credentials or private evidence.

## 8. Failure semantics

Optional providers are never load-bearing. A model, translation, weather or search failure produces a typed unavailability state, a clearly stale snapshot or a structured template. Database unavailability rejects mutations without acknowledging them and preserves the local draft. Budget exhaustion disables optional features only.

## 9. Deployment and current status

Proposed pilot shape: one application deployment, one managed database, one scheduled job, tens of active users, fewer than a few hundred curated entities, one region. No clusters, queues or separate vector service are justified at this scale.

**Current reality (21 September 2026):** a local Next.js prototype exists with catalogue, planner, assistant, inquiry, inbox, review and upload surfaces. It runs on seed files and a file-backed store; the relational schema is designed but not yet the source of truth. Authentication is missing and is treated as blocking. See [architecture.md](architecture.md) §9 and [systemdesigning.md](systemdesigning.md) §13 for the gap register.
