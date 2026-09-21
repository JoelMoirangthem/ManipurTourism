# Research findings and idea improvement

Date: 20 September 2026. Evidence references resolve in [sources.md](sources.md). **Desk research, not field research.** Recommendations below are product proposals, not demonstrated results.

## 1. Executive finding

The useful product is not “an AI that solves all Manipur tourism problems.” It is a **tourist–local coordination service that makes information usable, attributable and time-bounded**.

Proposed promise:

> Help a traveller assemble a tentative plan from sourced information, ask a participating local provider the right questions, and see what is confirmed, old, conflicting or still unknown.

The differentiated loop is **discover → draft → inquire → local response → update → re-check**, not a general chatbot with a list of attractions. Physical infrastructure, connectivity, emergency response, property inventory management and language-model quality cannot be solved merely by adding a chat UI.

## 2. Hackathon verification

MTIF's own public announcement gives **23 September 2026**, **IT SEZ, Mantripukhri, Imphal**, with tourism, digital experience and accessibility/multilingual themes [S01](sources.md#s01). This is relevant to the proposed coordination service.

A 19 September e-pao announcement attributed to MTIF gives registration by **21 September**, a **₹500/team** fee, open participation and prizes [S02](sources.md#s02). Those are attributed details, not independently validated registration terms.

**Immediate non-coding action:** obtain the actual rulebook and confirm registration cutoff, team size, presentation length, judging rubric, AI/API restrictions, data-use rules, prebuilt-code policy and IP terms. Do not assume this is a 24-hour or 48-hour event. Different partner-role wording appears across announcements; use neutral “with MTIF” until confirmed. No registration has been made by this research.

## 3. Audit of the pasted discussion

| Prior statement | Evidence result | Correct replacement |
|---|---|---|
| Sendra has about 10 rooms total | S04 lists 13 rooms for the specific Sendra Resort; inventory is undated | “The official directory lists 13 rooms for Sendra Resort; current availability is unconfirmed.” Never generalize to all Sendra accommodation |
| A narrow chatbot never hallucinates | Unsupported guarantee | Narrow scope reduces exposure; structured retrieval, output checks, uncertainty labels and evaluations are still required |
| Just prompt for Meitei/English/Hindi and multilingual support is easy | Not established | Language, script, code-mixing and critical-meaning preservation need native-speaker evaluation |
| Sarvam plus IndicXlit provides Romanized Meiteilon chat out of the box | Not established | Sarvam Translate lists Manipuri but explicitly does not support `output_script`; Mayura's script controls do not come with Manipuri support; IndicXlit is transliteration [S10–S12] |
| No live weather infrastructure/API exists | Too broad and contradicted by documented APIs | IMD and Open-Meteo publish APIs. Access, relevant coverage, terms and freshness still require testing [S17–S19] |
| Search grounding tells us if a road/place is open or safe | Unsupported | It finds web information. Operational claims require appropriately scoped, current evidence; never generate an area-safety guarantee [S15] |
| A manually editable spreadsheet is real-time in spirit | Misleading | Call it a dated host/admin report. Database propagation speed and field-observation freshness are different |
| Officials/village councils will verify updates | Partnership assumption | Start with named project reviewers and consenting property operators; official participation requires explicit agreement |
| Festival dates and budgets are already verified | Not available in this conversation as traceable records | Store only the actual edition and dated source. No 2026 dates or budget-based demand forecast in MVP [S05–S06] |
| A full app is unrealistic for locals because connectivity is poor | Unmeasured local/generalization claim | Low-bandwidth design is prudent; test actual devices, language preferences and connectivity with prospective users |
| Tourist-only information is the main tourism problem | Unmeasured priority and causal claim | The two-sided coordination gap is a hypothesis supported by observable information-format limits, to be tested through interviews |
| There is no tourism digital platform | False framing | Official accommodation, information, ILP and linked homestay resources already exist [S04–S08] |

## 4. Observed evidence → possible pain point → solution → validation

| ID | What research actually observed | Hypothesized user problem | Proposed response | How to validate |
|---|---|---|---|---|
| P1 | Official accommodation directory publishes property-level room counts, not date-specific inventory in inspected table [S04] | A traveller mistakes capacity for availability and must contact properties separately | Separate capacity from stay-date availability; request/response flow | Give 5 travellers a real planning task; record unanswered availability questions |
| P2 | Official pages expose previous festival editions; inspected district hub has no explicit 2026 schedule [S05–S06] | People may use old dates or lack confidence in an event plan | Edition-specific events, source date, confirmation badge and unknown state | Ask organizer to confirm one future event; measure correction and update workflow |
| P3 | Language providers expose different Manipuri/style/script capabilities [S10–S14] | A visitor and provider may misunderstand practical messages | Original-plus-translation, structured inquiry fields, reviewed phrase cards | Interview speakers; evaluate dates, negation, amounts and place names with two reviewers |
| P4 | Information spans tourism pages, ILP service and linked homestay resources [S04–S08] | Planning involves switching sources without an obvious next step | A source-backed checklist and direct local inquiry, not a replacement permit platform | Observe task completion using current sources versus paper prototype |
| P5 | Weather APIs are documented, but no project integration exists [S17–S19] | Travellers need context for planning but may overinterpret forecasts | Optional model forecast with valid time; separate official warnings | Verify one relevant location and payload; test user understanding of the badge |
| P6 | Browser background work can stop or retry [S20] | A sender may assume an offline message reached a host | Explicit local outbox, sent/read states and retry | Disconnect two test devices; verify no false “sent” or duplicate message |
| P7 | A maintained source needs accountable editors; no partner commitments obtained | An app accumulates stale data with no owner | Reviewer assignment, expiry policies, maintenance dashboard | Recruit 3 operators and a reviewer; test willingness to update, not only willingness to sign up |

Sample counts above are **proposed small pilot sizes**, not completed research, statistical representativeness or proven market size.

## 5. Competitive/context assessment

This is a limited functional comparison of inspected sources, **not an exhaustive competitor audit**.

| Existing resource | Value to retain | Opportunity to test, not assumed absence everywhere |
|---|---|---|
| Manipur Tourism directory [S04] | Official discovery and published property metadata | Date-scoped inquiry, visible record age and host response |
| Tourism homepage and festival links [S05] | Existing destination/event navigation | Cross-source provenance and edition checking |
| Linked festival homestay site [S05] | Possible existing local supply channel | Investigate partnership/export options before duplicating; operation unverified |
| Official ILP portal [S08] | Relevant official application service | Preparation checklist and handoff; do not reimplement permit application |
| General AI/search [S15] | Natural-language discovery and source retrieval | Prevent unsupported operational certainty; keep transactional facts out of model improvisation |

Do not pitch “first,” “only,” “unique in Manipur,” guaranteed tourism growth, or a quantified time-saving without a defensible competitive study/pilot.

## 6. What to build later, and what not to claim now

### Core vertical slice

1. Publish a small, manually checked place/stay catalogue with sources.
2. Ask dates, group size, interests, budget limits, transport assumptions, language and access needs.
3. Produce a **tentative**, constraint-checked plan with unanswered items.
4. Send a structured inquiry to an opted-in host after explicit user confirmation.
5. Let the host answer with availability/price/time fields; keep these host-reported, scoped and expiring.
6. Display original text, optional reviewed/validated translations and visible response age.
7. Update the plan; require re-check before travel and external booking.

### Strong enhancements, only after core works

- Low-bandwidth saved plan and reviewed phrase cards.
- Property-scoped operator updates and a reviewer inbox.
- Optional forecast adapter if lawful access and freshness semantics are validated.
- Optional sourced-web lookup for background information, not automatic safety clearance.

### Defer

Open-ended autonomous agents; region-wide routing and safety scores; booking/payment integration; voice/speech; all-language coverage; automatic festival demand predictions; SMS/WhatsApp integrations without approvals; IoT hardware; AR/VR; vector infrastructure for a tiny catalogue.

## 7. Interview and field-validation plan

Recruit by consent, not scraped contact lists. Proposed participants: 5 recent/prospective visitors, 3 accommodation/activity providers, 2 local language reviewers and 1 tourism-information stakeholder. One person can have multiple roles, but record that bias.

Visitor prompts:
- “Show the last trip you planned. Which detail did you have to call someone to confirm?”
- “How did you know whether a price/date/opening was current?”
- “Which information would you not trust a chatbot to answer?”
- “What happened the last time a message or translation was misunderstood?”

Provider prompts:
- “Show the last inquiry you received. What information was missing?”
- “When and by whom can availability actually be confirmed?”
- “What is the simplest way you could update this, and how often would you realistically do it?”
- “Which languages and scripts do you personally prefer?”
- “Do you want inquiries here, or a handoff to an existing booking channel?”

Do not ask leading questions such as “Would an AI app solve your problems?” Observe a task and ask about a recent event. Log consent, anonymized role, actual quote, task time, failures and objections. No fabricated personas presented as interviews.

**Decision gates:** if providers will not maintain or answer, pivot to a source-backed planner with external contact handoffs. If language quality fails, ship original text plus reviewed phrase cards. If current operational data cannot be verified, keep it unknown instead of manufacturing a feed.

## 8. Continuation audit of the local project

The workspace already contained nine substantive Markdown specifications and research notes. Those are retained, cross-linked and completed, not replaced with a second competing plan. Newly added specifications cover design, rules, task order, project decisions, folder structure and testing; [index.md](index.md) is the entry point.

The local 2022 policy was text-extracted: PDF pages 26, 29 and 36 support information facilitation, tourism-statistics improvement and literature updates [S07](sources.md#s07). These are policy intentions, not present-day performance measurements.

The local Sendra tender has 32 pages but yielded no extractable text in this audit. Its room schedule remains unverified [S21](sources.md#s21). Therefore no claim of “10 rooms,” no reconciliation with 13 and no asserted operator change is made. Tourism-statistics imagery contains April–March periods and a partial latest year in the delegated check; numerical market-size/decline claims remain deliberately outside this pack.

Important improvement: make the **unanswered-question checklist** and the **completed inquiry loop** the centre of the product. A polished itinerary alone does not resolve a host's availability, a traveller's access needs or a misunderstood reply. Confirmed host replies remain private to their inquiry unless a provider explicitly publishes a separate scoped report.

## 9. Research limits

No causal model of tourism decline, no general safety assessment, no survey-based prevalence estimates, no tested API reliability and no recruited operators. Public information accessibility is evidence of an information-system opportunity, not proof of product–market fit. Maintain these boundaries in the pitch.
