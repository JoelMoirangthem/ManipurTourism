# Proposed API contracts

Status: **design only**. Paths below are proposed internal application endpoints, not existing government or vendor APIs. They must be implemented and tested later. Provider-specific SDK schemas must be checked against current official documentation.

## 1. Cross-cutting conventions

- Prefix: `/api/v1`; JSON over HTTPS.
- Authentication: managed session or approved server token; never trust client-supplied role/actor IDs.
- Every response includes `request_id`; resource responses include `version` where concurrent editing matters.
- Time instants are ISO 8601 with explicit offset; stay dates are `YYYY-MM-DD`, interpreted in Asia/Kolkata.
- Null means unknown, accompanied by a reason where consequential.
- Pagination uses bounded opaque cursors. Proposed maximum page size: 50.
- Mutations require CSRF/origin protection for cookie sessions, authorization, schema validation and rate limits.
- Create/send operations accept an `Idempotency-Key`. Versioned edits carry `expected_version`.
- Public caches never contain private threads, consent evidence or account-specific output.
- Any examples are schema illustrations, not actual running responses.

## 2. Endpoint matrix

| Endpoint | Actor | Request | Response / key rule |
|---|---|---|---|
| `GET /places` | Public | category, curated search term, cursor | Sourced public place summaries; no generated records |
| `GET /places/{id}` | Public | entity ID | Fields, supporting claim IDs, source links, unknowns and version |
| `GET /listings/{id}` | Public | listing ID | Published capacity separately from date-scoped reports; consented contact actions only |
| `GET /listings/{id}/status` | Public | applicable date/range | Computed operational state, freshness, suppression reason and source/time metadata |
| `POST /plans/draft` | Guest or visitor | structured trip brief; optional guest abuse token | Tentative draft, unresolved constraints, evidence snapshot; no booking |
| `POST /plans` | Visitor | reviewed draft and evidence snapshot | Save owned server plan; guests keep drafts locally |
| `GET /plans/{id}` | Owner | plan ID | Own saved plan, current evidence changes and recheck state |
| `PATCH /plans/{id}` | Owner | brief/items/state, expected_version | Versioned edit; revalidate affected constraints |
| `DELETE /plans/{id}` | Owner | plan ID | Remove owned plan under retention policy; no other user's data |
| `POST /assistant/answer` | Guest-limited or visitor | intent/text plus permitted context references | Validated grounded answer or typed fallback; no mutations |
| `POST /inquiries` | Visitor | listing, service dates, party, original text, permitted shared details | Inquiry + first message atomically accepted; user confirmation required |
| `GET /inquiries` | Visitor/provider | cursor, state | Only threads authorized for actor; no arbitrary user filter |
| `GET /inquiries/{id}/messages` | Thread member | cursor | Original messages, structured fields, translation metadata |
| `POST /inquiries/{id}/messages` | Thread member | original text and structured reply, idempotency key | Server accepted message ID/time; never “delivered” by implication |
| `POST /inquiries/{id}/read` | Thread member | last_read_sequence | Monotonic read acknowledgement |
| `PATCH /inquiries/{id}` | Authorized participant | state, expected_version | Workflow state change; answered/closed not a reservation |
| `POST /messages/{id}/translations` | Thread member | target language/script, consent confirmation | Optional translated variant or unsupported/review-needed status; original unchanged |
| `POST /listings/{id}/availability-reports` | Scoped provider | date interval, unit, status/quantity, observation, expiry/quote | Host-reported claim and report; no inventory decrement |
| `POST /claims` | Scoped provider/reviewer | typed fact, source, scope, observation/valid dates | Pending/reported claim, not automatic official fact |
| `GET /reviews` | Assigned reviewer | state/cursor | Scoped queue, evidence access filtered |
| `POST /claims/{id}/reviews` | Assigned reviewer | approve/reject/request-info, reason, expected_version | Review + projection update + audit in transaction |
| `GET /phrase-cards` | Public | language/script, version | Approved variants only |
| `GET /weather` | Public, rate-limited, P1 | curated place ID, date | Forecast snapshot or unavailable; client cannot submit arbitrary fetch URL |
| `POST /reports` | Authenticated user or protected public form | target/category/minimal description | Private moderation ticket, no automatic public allegation |
| `GET /capabilities` | Public | none | Enabled intents, language/script pairs and limitations; no secrets |

Membership, listing consent and admin approval endpoints should remain narrowly scoped and authenticated; do not expose public self-escalation routes.

## 3. Trip brief contract

Required for a useful draft: exact trip dates or a clarified duration/start date, positive party size, interests and transport assumption. Optional: budget with currency/scope, pace, selected stays, access needs and preferred language/script.

Server returns:

- `plan_status`: draft or needs_recheck.
- `items`: referenced place/listing IDs, order, date/window if supported, fact IDs.
- `unresolved_constraints`: machine-readable keys and clear messages.
- `evidence_snapshot`: claim IDs/versions plus computed time.
- `warnings`: stale/conflicting/restriction/unknown conditions, not generalized area risk scores.
- `suggested_actions`: permitted UI actions such as draft inquiry or view source; no implicit execution.

If transfers are unknown, exact timestamps remain null. If budget coverage is partial, `total_estimate` remains null or explicitly partial; taxes/transport are not silently assumed included.

## 4. Answer envelope example

**Schema illustration only; not a real response or entity record.**

```json
{
  "request_id": "example-request",
  "intent": "place_fact",
  "answer_kind": "sourced_with_limits",
  "text": "The published directory capacity is not current availability.",
  "facts": [
    {
      "claim_id": "example-claim",
      "field": "published_capacity",
      "value": 13,
      "unit": "rooms",
      "source_id": "S04",
      "source_publication_date": null,
      "time_basis": "published_directory_undated",
      "freshness_state": "unknown"
    }
  ],
  "unknowns": ["availability_for_requested_dates", "current_operator_verification"],
  "suggested_actions": ["view_source", "draft_inquiry_if_provider_active"],
  "is_demo": true
}
```

The number illustrates the actual published S04 claim, but this envelope and IDs are synthetic. No live listing has been created. Critical facts should render from the structured facts array, not be recomputed by the model.

## 5. Message and availability validation

Message text proposed cap: **1,500 characters**, allowing a bounded translation request for candidate services with suitable limits; adapters can impose lower tested limits. Reject oversize input with a recoverable error, not silent truncation. Rich attachments are outside MVP.

A host structured reply can include `availability_kind`, service dates, `quantity`, `unit`, `quote_minor_units`, `currency` and validity. The original message remains visible. A quote without currency is invalid. A report cannot cover dates it does not actually apply to. Nonavailability is not represented as unknown.

A structured host reply and its private availability report, if any, commit in one transaction. Default report visibility is `inquiry_private`; a public report requires a separate explicit publication action and no visitor details. Public listing endpoints exclude private reports. Visibility cannot be elevated by the assistant or translation provider.

Server acceptance returns `message_id`, `server_sequence`, `accepted_at` and inquiry state. No `booking_confirmed` field exists. Read receipt is separate.

## 6. Error taxonomy

| HTTP | Code | Meaning/action |
|---|---|---|
| 400 | INVALID_INPUT | Missing or malformed field; return field-specific guidance |
| 401 | AUTH_REQUIRED | Login/refresh session; retain unsent local draft |
| 403 | SCOPE_DENIED | Actor not authorized for entity/thread/action |
| 404 | NOT_FOUND | Resource absent; for private resources, avoid existence leakage |
| 409 | VERSION_CONFLICT | Reread latest record before changing |
| 409 | IDEMPOTENCY_CONFLICT | Same key used with different payload |
| 409 | LISTING_UNAVAILABLE | Consent revoked, listing paused or suspended |
| 422 | NEEDS_CLARIFICATION | Ambiguous date/entity/constraint |
| 422 | UNSUPPORTED_LANGUAGE_SCRIPT | Pair disabled; original/phrase fallback |
| 422 | STALE_DRAFT | Dates or context invalid; reconfirm |
| 429 | RATE_OR_BUDGET_LIMIT | Retry-after where meaningful; core non-AI path remains |
| 503 | PROVIDER_UNAVAILABLE | Optional provider failure; typed fallback |
| 503 | STORAGE_UNAVAILABLE | No mutation acknowledged; outbox preserved |

Responses may deliberately use 404 instead of 403 for unauthorized private resources. Do not reveal SQL, credentials, raw provider errors or private evidence.

## 7. Adapter contracts

These are application-level interface intentions, **not vendor parameter names**.

- Text adapter: evidence bundle + allowed intent → structured answer + citations/usage/error metadata.
- Translation adapter: original + declared language/script pair → translation + detected/actual output script + provider/model metadata + validation flags.
- Weather adapter: curated public place + date → normalized forecast, units, valid/fetched/issue times and provider attribution.
- Search adapter: approved background query → sourced snippets/citations + usage metadata. No direct operational claim write.

Every adapter must expose capability absence, timeout, quota failure and incomplete provenance explicitly. No silent substitution of another language/model/provider with different privacy or billing terms.

## 8. Contract-test requirements

Test request validation, server-derived actor scope, cross-thread denial, idempotent retry after ambiguous timeout, version conflicts, claim expiry at read time, missing source timestamp, unsupported script, malformed provider payload and synthetic/public record isolation. Expected cases are in [testing.md](testing.md).
