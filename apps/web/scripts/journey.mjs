// Full user-journey walkthrough against a running server.
//
// Not a contract test — this walks the *product* the way a visitor, a provider
// and a reviewer would, and prints what each step actually returned, so the
// output can be read as a demo script. Fails loudly if any step is not usable.
//
// Run: node scripts/journey.mjs [baseUrl]

const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const unique = () => `j-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

let step = 0;
function say(label, detail) {
  step++;
  console.log(`\n[${String(step).padStart(2, "0")}] ${label}`);
  if (detail !== undefined) console.log("     " + String(detail).replace(/\n/g, "\n     "));
}
function fail(msg) {
  console.error(`\n  ✗ ${msg}`);
  process.exit(1);
}

async function get(path, init) {
  const res = await fetch(`${base}${path}`, init);
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

// ---------------------------------------------------------------- 1. discovery
say("VISITOR — health / what is this service");
const health = await get("/api/health");
if (health.status !== 200) fail(`health ${health.status}`);
say(
  "  corpus + configuration",
  `places=${health.body.corpus.places} withClaims=${health.body.corpus.withClaims} ` +
    `llm=${health.body.config.llm} translate=${health.body.config.translate} database=${health.body.config.database}`
);

say("VISITOR — browse the catalogue (no query, browse-all)");
const all = await get("/api/places?limit=50");
if (all.status !== 200) fail(`places ${all.status}`);
say(
  "  catalogue",
  all.body.places.map((p) => `${p.name} (${p.district})`).join("\n")
);
say("  facets", `districts=${all.body.facets.districts.join(", ")}`);

say("VISITOR — filter by district");
const ukhrul = await get("/api/places?district=Ukhrul");
if (ukhrul.status !== 200) fail(`filter ${ukhrul.status}`);
say("  Ukhrul results", ukhrul.body.places.map((p) => p.name).join(", "));

say("VISITOR — open a place: are review state and freshness shown as SEPARATE axes?");
const detail = await get("/api/places/loktak-lake");
if (detail.status !== 200) fail(`place detail ${detail.status}`);
const P = detail.body; // NOTE: the payload is flat, not nested under `place`.
const cap = P.claims.find((c) => c.fieldKey === "published_capacity");
say("  place", `${P.name} — ${P.district} (${P.claims.length} claims, ${P.photos?.length ?? 0} photo(s))`);
const shown = cap ?? P.claims[0];
say(
  `  claim ${shown.id} (${shown.fieldKey})`,
  `value="${shown.valueText ?? shown.valueInt}"\n` +
    `reviewState=${shown.reviewState}  freshness=${shown.freshness}\n` +
    `badge="${shown.badge?.text}"`
);
// The whole point of the trust model: approval and freshness must not collapse.
if (shown.reviewed === shown.freshness) fail("reviewed and freshness collapsed into one axis");
if (cap && /available|vacan/i.test(cap.badge?.text ?? "")) fail("capacity badge implies current availability");

// ---------------------------------------------------------------- 2. planning
say("VISITOR — draft a 4-night itinerary");
const plan = await get("/api/plan", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ nights: 4, groupSize: 2, interests: ["lake", "heritage"] }),
});
if (plan.status !== 200) fail(`plan ${plan.status}`);
const draft = plan.body.drafts?.[0];
if (!draft) fail("no draft returned for a 4-night lake/heritage brief");
say(
  "  itinerary",
  draft.legs.map((l) => `${l.name} (${l.district}) — ${l.nights} night(s)`).join("\n")
);
const totalNights = draft.legs.reduce((n, l) => n + l.nights, 0);
say("  nights arithmetic", `requested=4 scheduled=${totalNights}`);
if (totalNights !== 4) fail(`nights mismatch: asked 4, scheduled ${totalNights}`);
if (draft.legs.some((l) => l.name === l.placeId)) fail("legs returned raw slugs instead of place names");
say(
  "  budget",
  plan.body.budget
    ? JSON.stringify(plan.body.budget)
    : `null — no total invented. ${draft.notes?.[0] ?? "prices stay unquoted until a host replies."}`
);

// ---------------------------------------------------------------- 3. assistant
const ASK = [
  "What is Loktak Lake known for?",
  "Is it safe to visit Kangla Fort?",
  "Can you book a room for me at Sendra?",
  "How many rooms does Sendra Resort have?",
  "What is the weather at Loktak today?",
];
say("VISITOR — ask the assistant (5 representative questions)");
for (const q of ASK) {
  const r = await get("/api/ai/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
  });
  if (r.status !== 200) fail(`assistant ${r.status} for "${q}"`);
  const cites = [...(r.body.answer || "").matchAll(/\[(c-[\w-]+)\]/g)].map((m) => m[1]);
  say(
    `  Q: ${q}`,
    `intent=${r.body.intent} matched=${r.body.matched} degraded=${r.body.degraded ? JSON.stringify(r.body.degraded) : "none"}\n` +
      `citations=[${[...new Set(cites)].join(", ")}]\n` +
      `A: ${r.body.answer}`
  );
  if (/guarantee|certified safe|definitely safe/i.test(r.body.answer || "")) {
    fail(`answer for "${q}" made a prohibited safety/booking claim`);
  }
}

// ---------------------------------------------------------------- 4. inquiry
say("VISITOR — open an inquiry with the host (Loktak)");
const key = unique();
const created = await get("/api/inquiries?as=visitor-demo", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    placeId: "loktak-lake",
    listingId: "loktak-lake",
    partySize: 2,
    message: "Do you have a room for 2 on 14–16 Nov? Walking access?",
    idempotencyKey: key,
  }),
});
if (created.status !== 201 && created.status !== 200) fail(`create inquiry ${created.status}`);
const inquiryId = created.body.inquiry.id;
say("  thread created", `${inquiryId}\nstate=${created.body.inquiry.state} replayed=${created.body.replayed}`);
if (created.body.inquiry.messages?.[0]?.senderRole !== "visitor") {
  fail("first message was not recorded as from the visitor");
}

say("VISITOR — replay the same request (idempotency)");
const replay = await get("/api/inquiries?as=visitor-demo", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    placeId: "loktak-lake",
    listingId: "loktak-lake",
    partySize: 2,
    message: "Do you have a room for 2 on 14–16 Nov? Walking access?",
    idempotencyKey: key,
  }),
});
if (replay.body.inquiry?.id !== inquiryId) fail("replay created a second thread");
say("  replay returned the ORIGINAL thread", `${replay.body.inquiry.id}  replayed=${replay.body.replayed}`);

say("PROVIDER — read the inbox (scoped to owned listings)");
const inbox = await get("/api/inquiries?as=provider-demo");
if (inbox.status !== 200) fail(`inbox ${inbox.status}`);
say(
  "  provider sees",
  inbox.body.inquiries.map((i) => `${i.placeId} state=${i.state} awaiting=${i.awaitingProvider}`).join("\n")
);
if (!inbox.body.inquiries.some((i) => i.id === inquiryId)) fail("provider cannot see the new thread");

say("PROVIDER — reply with a dated availability report");
const reply = await get(`/api/inquiries/${inquiryId}/messages?as=provider-demo`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: "One twin room free 14–16 Nov. Confirm by 10 Nov.",
    availability: {
      kind: "reported_available",
      startDate: "2026-11-14",
      endDateExclusive: "2026-11-16",
      quantity: 1,
      quotePaise: 250000,
    },
  }),
});
if (reply.status !== 200 && reply.status !== 201) fail(`provider reply ${reply.status}`);
const msg = reply.body.message;
say(
  "  host-reported availability",
  `kind=${msg.availability?.kind} sequence=${msg.sequence}\nexpiresAt=${msg.expiresAt}`
);
if (!msg.expiresAt) fail("availability report has no expiry");

say("PROVIDER — may not act as a host on a listing they do NOT own (must be refused)");
// A provider posting a *message as a host* on someone else's thread is the
// privileged action. Opening their own enquiry as a customer is fine.
const foreignThread = await get("/api/inquiries?as=visitor-demo", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    placeId: "dzukou-valley",
    listingId: "dzukou-valley",
    partySize: 2,
    message: "Permit question from the visitor side",
    idempotencyKey: unique(),
  }),
});
if (foreignThread.status !== 200 && foreignThread.status !== 201) {
  fail(`visitor could not open a dzukou thread: ${foreignThread.status}`);
}
const foreignId = foreignThread.body.inquiry.id;
const asHost = await get(`/api/inquiries/${foreignId}/messages?as=provider-demo`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: "I am not your host but here is an availability report anyway.",
    availability: {
      kind: "reported_available",
      startDate: "2026-11-14",
      endDateExclusive: "2026-11-16",
      quantity: 3,
      quotePaise: 100000,
    },
  }),
});
say("  host reply on an unowned listing", `status=${asHost.status}`);
if (asHost.status !== 403) fail(`expected 403, got ${asHost.status}`);
const foreignRead = await get(`/api/inquiries/${foreignId}?as=provider-demo`);
say("  read of an unowned thread", `status=${foreignRead.status}`);
if (foreignRead.status !== 403) fail(`expected 403 on read, got ${foreignRead.status}`);

say("OUTSIDER — an unrelated account tries to read a private thread (must be refused)");
const anon = await get(`/api/inquiries/${inquiryId}`);
say("  anonymous read (must be 403)", `status=${anon.status}`);
if (anon.status !== 403) fail(`anonymous read returned ${anon.status}, expected 403`);
const reviewer = await get(`/api/inquiries/${inquiryId}?as=reviewer-demo`);
say("  reviewer read (audit role — allowed by stated policy)", `status=${reviewer.status}`);
if (reviewer.status !== 200) fail(`reviewer audit read returned ${reviewer.status}`);

say("VISITOR — see the reply and the expiry state");
const mine = await get(`/api/inquiries/${inquiryId}?as=visitor-demo`);
if (mine.status !== 200) fail(`visitor read ${mine.status}`);
say(
  "  thread timeline",
  mine.body.inquiry.messages
    .map((m) => `#${m.sequence} ${m.senderRole}: ${m.originalText.slice(0, 58)}`)
    .join("\n")
);

// ---------------------------------------------------------------- 5. moderation
say("VISITOR — submit a photo for moderation");
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);
const fd = new FormData();
fd.append("placeId", "loktak-lake");
fd.append("caption", "View from the boat jetty");
fd.append("attribution", "Own work");
fd.append("license", "CC-BY-4.0");
fd.append("ownershipAffirmed", "true");
fd.append("file", new Blob([png], { type: "image/png" }), "walk.png");
const upRes = await fetch(`${base}/api/uploads?as=visitor-demo`, { method: "POST", body: fd });
const uploaded = await upRes.json().catch(() => null);
if (upRes.status !== 201 && upRes.status !== 200) fail(`upload ${upRes.status}`);
const uploadId = uploaded.upload.id;
say("  upload recorded", `${uploadId}\nmoderation=${uploaded.upload.moderation}`);

say("PUBLIC — the pending image must NOT be served");
const rawPending = await fetch(`${base}/api/uploads/${uploadId}/raw`);
say("  raw fetch while pending", `status=${rawPending.status}`);
if (rawPending.status === 200) fail("quarantined image was publicly served");

say("REVIEWER — reject without a reason (must be refused)");
const noReason = await get(`/api/uploads/${uploadId}?as=reviewer-demo`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ decision: "rejected" }),
});
say("  reject-without-reason", `status=${noReason.status}`);
if (noReason.status !== 400) fail(`expected 400, got ${noReason.status}`);

say("REVIEWER — approve it");
const approved = await get(`/api/uploads/${uploadId}?as=reviewer-demo`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ decision: "approved", note: "Own photo, matches the lake." }),
});
if (approved.status !== 200) fail(`approve ${approved.status}`);
say("  decision", `${approved.body.upload.moderation} by ${approved.body.upload.reviewedBy}`);

say("PUBLIC — now the image IS served, and appears on the place page");
const rawApproved = await fetch(`${base}/api/uploads/${uploadId}/raw`);
say("  raw fetch after approval", `status=${rawApproved.status} bytes=${(await rawApproved.arrayBuffer()).byteLength}`);
if (rawApproved.status !== 200) fail("approved image is not being served");
const afterMedia = await get("/api/places/loktak-lake");
const community = (afterMedia.body.photos || []).filter((p) => p.origin === "approved-upload");
say("  community photos on the place", `${community.length} approved-upload photo(s)`);
if (community.length === 0) fail("approved upload did not appear on the place record");

say("REVIEWER — try to re-decide the same upload (must conflict)");
const redecide = await get(`/api/uploads/${uploadId}?as=reviewer-demo`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ decision: "rejected", note: "Changed my mind." }),
});
say("  re-decide", `status=${redecide.status}`);
if (redecide.status !== 409) fail(`expected 409, got ${redecide.status}`);

// ---------------------------------------------------------------- done
console.log(`\n${"─".repeat(60)}`);
console.log(`✓ FULL JOURNEY COMPLETED — ${step} steps, every one usable.`);
console.log("─".repeat(60));
