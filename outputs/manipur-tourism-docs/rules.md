# Product, evidence and implementation rules

Version 0.2 · 20 September 2026 · **Design constraints, not implemented safeguards.**

Read [PRD.MD](PRD.MD) for scope, [data-model.md](data-model.md) for canonical fields and [testing.md](testing.md) for verification. These rules govern future implementation and the pitch.

## 1. Work authorization

- R01: This delivery is documentation only. Do not initialize an application, create migrations, connect paid providers, contact operators, submit registration or deploy without separate user approval.
- R02: Preserve source PDFs, images and existing project material. Add corrections with provenance; do not erase inconvenient historical evidence.
- R03: New app features must map to an FR requirement and an acceptance test. Any booking/payment/routing addition requires an explicit scope change.
- R04: All tasks remain planned until demonstrably executed. A working build is not proof of field accuracy, usability, translation quality or safe operation.

## 2. Evidence and claims

- R05: Every externally verifiable factual statement needs a source ID, scope and time basis. Every recommendation, target or hypothesis must be labeled as such.
- R06: Do not invent prices, room counts, distances, contacts, schedules, festival dates, partners, user interviews or performance results.
- R07: `fetched_at` is not `observed_at`, `published_at` or `reviewed_at`. Unknown source dates stay unknown.
- R08: Directory capacity is not current vacancies; an inquiry answer is not a booking. Preserve units and exact property identity.
- R09: A tender describes assets/terms for its date and scope; it is not current inventory. The unread Sendra tender schedule remains unverified.
- R10: Previous festival editions do not become current events by replacing the year. Government policy intent is not evidence of implementation.
- R11: Official sources take priority within their authority; they do not automatically override a current property's own vacancy report about a different field. Same-scope contradictions remain visible until resolved.
- R12: No numerical confidence score unless derived from a defined, calibrated evaluation. Use provenance, date, scope and uncertainty labels instead.
- R13: Source/domain/citation presence is not enough: verify that the cited passage supports the actual claim.

## 3. Operational status and planning

- R14: The app cannot certify a destination, road, activity or alternative as safe. Do not generate blanket reassurance.
- R15: Active restrictions and credible closure history suppress affected recommendations. Expired closure evidence does not establish reopening.
- R16: A provider may report their own service, not assert authority over unrelated roads, districts or other providers.
- R17: Unknown transfers/opening windows prevent exact timed itineraries. Return ordered ideas and confirmation questions instead.
- R18: Do not silently relax budget, date, transport or accessibility constraints. Ask the user which constraints can change.
- R19: Accessibility means specific evidenced features and limitations, not an unsupported accessible/inaccessible badge.
- R20: Official permit/application guidance is a sourced handoff, not personalized legal clearance or a replacement application service.
- R21: Weather forecasts are model context. Rain does not automatically mean a closed boat service; no warning does not imply safety.

## 4. AI behavior

- R22: Supported intents only: plan, place fact, status, inquiry draft, translation and gated weather context. Unsupported requests get an honest scope explanation.
- R23: Resolve entities, filter evidence, check expiry, enforce access and calculate numbers outside the model.
- R24: Retrieve only approved public evidence or the requester's authorized private thread. Never feed a global private-message pool to retrieval.
- R25: External text is untrusted data, not instructions. A page or message cannot expand privileges, invoke arbitrary URLs, expose secrets or change source policy.
- R26: Validate output schema, evidence references, consequential facts and prohibited claims. Failed validation returns a structured/template answer, not another unbounded generation loop.
- R27: The model cannot send messages, publish status, book, pay, reserve or approve a provider. It proposes a draft; explicit user action triggers authorized server logic.
- R28: Search grounding stays optional and bounded. It cannot write operational status or claim transactional inventory.
- R29: Display exact model/provider limitations, not “hallucination-free.” Test failures are release blockers for affected functionality.

## 5. Language and communication

- R30: Language, script and translation are separate dimensions. Transliteration is not meaning translation.
- R31: Preserve original messages. Label machine translations and retain provider/model/version metadata.
- R32: Enable only tested language/script pairs. Do not infer Romanized Manipuri support by combining unrelated model features.
- R33: Names, dates, people counts, amounts, currency and structured availability selections must remain visible outside generated prose.
- R34: Negation, allergies, accessibility and help-related messages need explicit clarification/review; this is not an emergency interpreter.
- R35: No fabricated Meiteilon phrase cards. Publish target-language content as reviewed only after competent human approval.
- R36: Unsupported translation means original text plus reviewed phrases/structured fields; never silently substitute another language.
- R37: Preview recipient and content before send. State “Queued — not sent” offline; show server acceptance and recipient-read states only after corresponding acknowledgements.

## 6. Privacy, authorization and abuse

- R38: Browse anonymously; require authorized thread membership for private remote inquiries. Local residents can use visitor features without becoming providers.
- R39: Provider access is listing-scoped, reviewer access is assignment-scoped, and neither implies broad private-message access.
- R40: Host replies and availability within an inquiry are private by default. Publishing a public report is a separate explicit action with no visitor details.
- R41: Minimize personal data and disclosures to AI/translation vendors. No identity-document collection, continuous location tracking or scraped personal contact lists in MVP.
- R42: Keep secrets server-side. Validate inputs, protect cookie-session mutations, rate-limit endpoints and test object-level authorization.
- R43: Use least-privilege database access plus server checks. Never assume a privileged database client is protected by row-level policies.
- R44: Log metadata, not raw private messages, private itineraries, credentials or full model context by default.
- R45: Block/report actions and correction requests must be usable. Exceptional incident-content access requires purpose, narrow scope and audit.
- R46: Data retention/deletion values are proposed policy, not a legal-compliance claim. Public launch requires applicable obligations and processor terms to be reviewed.

## 7. Reliability and honesty

- R47: Mutations commit atomically with idempotency where required. Same actor/key/payload returns the original result; a different payload conflicts.
- R48: Recheck authorization, consent, date validity and versions when submitting, not only when opening a page.
- R49: Offline caches show snapshot age. Do not silently queue operational status updates or claim live data while disconnected.
- R50: Optional provider outage/budget exhaustion must not destroy browsing, draft planning or original-language inquiries.
- R51: Keep demo fixtures synthetic, labeled and isolated. Staff rehearsals and fixture messages are not customers or traction.
- R52: Do not claim official partnership, inspected premises, verified quality or continuously monitored services without the corresponding authorization/process.
- R53: Time limits, capacity targets, sample sizes, freshness intervals and budgets in these documents are proposed engineering policies unless explicitly sourced.

## 8. Documentation precedence and change control

| Concern | Canonical document |
|---|---|
| Evidence and source status | [sources.md](sources.md) |
| Product requirements and priorities | [PRD.MD](PRD.MD) |
| Field names, enums and invariants | [data-model.md](data-model.md) |
| Boundary decisions | [architecture.md](architecture.md) |
| Runtime/expiry/concurrency | [systemdesigning.md](systemdesigning.md) |
| HTTP behavior | [api-contracts.md](api-contracts.md) |
| Screens, copy and accessibility | [design.md](design.md) |
| Execution order and acceptance | [tasks.md](tasks.md), [testing.md](testing.md) |

If documents conflict, record and resolve the inconsistency before implementation. Update the canonical definition and its dependent requirements/tests together. Append lasting decisions to [memory.md](memory.md); never mark a proposal approved merely because it appears there.
