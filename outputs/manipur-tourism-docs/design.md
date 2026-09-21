# Design specification

Version 0.2 · 20 September 2026 · **Design specification only; the described screens are not all implemented.** Canonical rules: [rules.md](rules.md). Evidence vocabulary: [PRD.MD](PRD.MD) §9.

## 1. Design principles

1. Show uncertainty at the decision point, not in a help page.
2. The original human text outranks any generated summary.
3. Never visually imply a reservation, safety clearance or live inventory.
4. Text-first and low-bandwidth; use weight, space and one accent colour rather than heavy imagery.
5. A user must be able to tell demo fixtures from real records without hovering.
6. The unanswered-question list and the provider reply are the primary artefacts, not a decorative itinerary.

## 2. Roles and surfaces

| Surface | Primary actor | Exists in prototype? |
|---|---|---|
| Catalogue list and place detail | Visitor (anonymous) | Yes (basic) |
| Nearby results | Visitor | Yes (basic) |
| Trip brief and drafts | Visitor | Yes (basic) |
| Inquiry composer and thread | Visitor | Yes |
| Provider inbox | Provider | Partly (no auth) |
| Reviewer console | Reviewer | Partly |
| Upload and moderation | Contributor/reviewer | Partly |
| Assistant panel | Visitor/local | Yes (template fallback) |
| Capability and limits page | All | Proposed |

## 3. Trust label system

One label per factual field, never one badge per record.

| Label | Meaning | Visual treatment |
|---|---|---|
| Published directory fact | From an official publication at its own scope | Neutral text label plus source link |
| Host-reported | Dated answer from the property for specific dates | Distinct label plus observed time |
| Project-reviewed source | Team checked provenance, not the field | Neutral text label plus review date |
| Official notice | Authoritative statement within named scope/dates | Strongest label; still shows scope and expiry |
| Forecast | Model or provider output with valid time | Dashed/dim treatment plus valid time |
| Conflicting reports | Credible same-scope contradiction | Both values visible; suppresses recommendations |
| Unknown | No sufficient evidence | Explicit “unknown”, never a blank or a zero |
| Stale | Past the app's validity policy | Age shown in relative and absolute form |
| Demo data | Synthetic fixture | Conspicuous inline “Demo” tag on every occurrence |

Rules: colour is never the only signal; provide the label text and an accessible name; tooltips are not the sole explanation. No numeric confidence percentage (R12).

## 4. Screen inventories and states

### 4.1 Catalogue list

- Header: scope line (“Showing 8 curated places; not a complete list of Manipur”).
- Each card: name, district, category, one-line sourced summary, capacity wording where present, label chips, source link.
- Required states: loading skeleton; empty scope; partially-verified results; error with retry; offline banner with snapshot age.
- Interaction: search resolves aliases; unknown term returns an explicit no-match plus suggested verified names.

### 4.2 Place detail

- Order: name → district/category → sourced summary → labelled facts (with time basis) → source list → actions (“Ask this provider”, “View source”, “Save offline”).
- Prohibited: “verified”, “safe”, “open now”, “book here”, star ratings, review averages.

### 4.3 Trip brief and drafts

- Fields: dates or clarified duration, party size, interests, budget and whether it covers accommodation only or all costs, transport assumption, access needs, language and script (separate controls).
- Draft presentation: two explained options maximum; ordered items; “transfer time unverified” placeholders; unanswered-question list with per-item actions.
- Required states: unspecified budget scope blocks any total; no eligible candidate explains which constraint failed and asks which may change.

### 4.4 Inquiry composer

- Shows recipient identity, dates, party size and the original message before send.
- Optional translation preview shows original first, then labelled machine output.
- Delivery states: `Local draft` → `Queued (not sent)` → `Sent to service` (server accepted) → `Read` only after a read acknowledgement. Never “Delivered to phone”, never “Confirmed”.
- Offline: composer keeps a local draft; sends are blocked with an explicit reason.

### 4.5 Thread view

- Original message always visible; translation collapsed by default and labelled `machine_unreviewed`.
- Host reply renders structured availability fields outside the prose: dates, unit, reported time, expiry, “not reserved”.
- Reply composer offers `available as reported`, `unavailable as reported`, `need more details` plus an optional quote in minor units with explicit currency.

### 4.6 Assistant panel

- Input hint lists supported intents and languages actually enabled.
- Answer layout: short prose, then structured fact rows with source/age, then “Still unknown”, then suggested actions.
- Every answer shows retrieved-record version context; every degraded answer is visibly a template.
- Prohibited intents return a scope explanation, not a guess.

### 4.7 Provider inbox, reviewer console, upload

- Inbox: listing-scoped, cursor-paginated, explicit refresh, unread counts from server sequences.
- Reviewer: claim queue with diffs, provenance, scope, expiry and reason fields; approvals require a reason.
- Upload: contributor affirms ownership/licence; item is quarantined, then approved or rejected with reason; unapproved media is never publicly reachable.

## 5. Content and microcopy standards

- Sentence case; plain language; no marketing superlatives.
- Use “report”, “claim”, “source”, “unknown”, “reported for these dates”, “not reserved”.
- Avoid “live”, “real-time”, “guaranteed”, “certified”, “AI-verified”, “official partner”.
- Dates always include a time basis where consequential: “published date unknown; retrieved 2026-09-20”.
- Numbers carry units: rooms, beds, boats, people — never interchangeable.
- Quote-friendly and copyable: source URL and claim label must be selectable text.

## 6. Accessibility and low-bandwidth

- Target WCAG 2.2 AA for text contrast, focus order, keyboard operation and error identification; verify with automated checks plus manual keyboard/screen-reader passes.
- Touch targets ≥44 px; no reliance on hover; visible focus ring; form errors tied to fields.
- Initial catalogue route budget: ≤200 KB compressed JS; text-first rendering before imagery.
- Respect reduced-motion; no auto-playing media; images lazy-loaded with explicit dimensions.
- Degrade gracefully at 1.6 Mbps / 150 ms RTT test profile so text content and actions remain usable.

## 7. Unresolved design decisions

- Whether translation preview appears inline or in a modal.
- Whether nearby results require a chosen base point (no continuous tracking allowed).
- How phrase cards surface when the model is unavailable.
- Final visual identity and brand naming (none chosen; working descriptor only).
