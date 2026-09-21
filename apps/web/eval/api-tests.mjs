// End-to-end API contract tests against a running dev server.
//
// These pin the behaviour the audit found broken, so a regression is caught
// rather than rediscovered. They are deliberately assertions about SECURITY and
// ARITHMETIC, not about wording, so prompt changes don't make them flaky.
//
// Run:  node eval/api-tests.mjs [baseUrl]
// Exits non-zero on any failure.

const base = (process.argv[2] || "http://localhost:3100").replace(/\/$/, "");

let pass = 0;
const failures = [];

async function check(name, fn) {
  try {
    await fn();
    pass++;
    console.log(`ok    ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
    console.log(`FAIL  ${name}\n        ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function json(path, init) {
  const res = await fetch(`${base}${path}`, init);
  const body = await res.json().catch(() => null);
  return { res, body, status: res.status };
}

const unique = () => `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ---------------------------------------------------------------- health
await check("health reports the real corpus size", async () => {
  const { body, status } = await json("/api/health");
  assert(status === 200, `status ${status}`);
  assert(body.corpus.places > 0, "corpus.places must be > 0 (was hardcoded 0 before)");
  assert(body.corpus.withClaims > 0, "withClaims must be > 0");
});

// ---------------------------------------------------------------- places
await check("places browse-all returns the catalogue", async () => {
  const { body } = await json("/api/places?limit=50");
  assert(body.places.length >= 8, `expected >= 8 places, got ${body.places.length}`);
  assert(body.facets.districts.length > 0, "facets.districts missing");
  assert(body.facets.categories.length > 0, "facets.categories missing");
});

await check("places district facet filters", async () => {
  const { body } = await json("/api/places?district=Ukhrul");
  assert(body.places.length >= 1, "expected at least one Ukhrul place");
  assert(body.places.every((p) => p.district === "Ukhrul"), "filter leaked other districts");
});

await check("place detail exposes reviewed and freshness as SEPARATE axes", async () => {
  const { body } = await json("/api/places/loktak-lake");
  const c = body.claims[0];
  assert(c.freshness, "freshness missing");
  assert(c.reviewed, "reviewed missing");
  // The bug this guards: approved must NOT be reported as current.
  assert(
    !(c.reviewState === "approved" && c.freshness === "current" && !c.observedAt),
    "approved claim with no observation date reported as 'current' — review must not imply freshness"
  );
});

await check("capacity wording never claims availability", async () => {
  const { body } = await json("/api/places/sendra-resort");
  assert(/unconfirmed/i.test(body.capacity), `capacity wording must hedge, got: ${body.capacity}`);
});

// ---------------------------------------------------------------- plan
await check("plan nights arithmetic holds at 1/2/4/10/30 nights", async () => {
  for (const nights of [1, 2, 4, 10, 30]) {
    const { body, status } = await json("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nights, groupSize: 2, interests: [], budgetRupees: null, budgetIncludes: null, query: "" }),
    });
    assert(status === 200, `nights=${nights} status ${status} ${JSON.stringify(body).slice(0, 120)}`);
    for (const d of body.drafts) {
      const scheduled = Object.values(d.nights).reduce((a, b) => a + b, 0);
      assert(scheduled === nights, `nights=${nights}: "${d.title}" scheduled ${scheduled}`);
    }
  }
});

await check("plan returns resolved place names, not slugs", async () => {
  const { body } = await json("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nights: 3, groupSize: 2, interests: [], budgetRupees: null, budgetIncludes: null, query: "" }),
  });
  const leg = body.drafts[0].legs[0];
  assert(leg.name && !/^[a-z0-9-]+$/.test(leg.name), `leg.name looks like a slug: ${leg.name}`);
  assert(leg.name.includes(" "), `leg.name should be a human name, got: ${leg.name}`);
});

await check("plan refuses a budget total without a stated basis", async () => {
  const { status } = await json("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nights: 2, groupSize: 2, interests: [], budgetRupees: 10000, budgetIncludes: null, query: "" }),
  });
  assert(status === 400, `expected 400, got ${status}`);
});

await check("plan never invents a nightly rate", async () => {
  const { body } = await json("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nights: 2, groupSize: 2, interests: [], budgetRupees: 10000, budgetIncludes: "all-costs", query: "" }),
  });
  for (const l of body.budget.lines) {
    if (/night/i.test(l.label)) {
      assert(l.amount === "₹0", `stay line must be unpriced, got ${l.amount} for "${l.label}"`);
    }
  }
});

// ---------------------------------------------------------------- inquiries + scoping
const key = unique();
let inquiryId = null;

await check("visitor creates an inquiry; identity comes from the actor", async () => {
  const { body, status } = await json("/api/inquiries?as=visitor-demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      placeId: "sendra-resort", checkIn: "2026-11-14", checkOut: "2026-11-16",
      partySize: 2, message: "Availability for 14-16 Nov, 2 guests?", idempotencyKey: key,
      // Attempted impersonation — must be ignored.
      visitorId: "someone-else", senderRole: "provider",
    }),
  });
  assert(status === 201, `status ${status} ${JSON.stringify(body).slice(0, 140)}`);
  assert(body.inquiry.visitorId === "visitor-demo", `visitorId was ${body.inquiry.visitorId}`);
  inquiryId = body.inquiry.id;
});

await check("idempotent replay returns the original thread", async () => {
  const { body } = await json("/api/inquiries?as=visitor-demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      placeId: "sendra-resort", checkIn: "2026-11-14", checkOut: "2026-11-16",
      partySize: 2, message: "Availability for 14-16 Nov, 2 guests?", idempotencyKey: key,
    }),
  });
  assert(body.replayed === true, "expected replayed=true");
  assert(body.inquiry.id === inquiryId, "replay produced a different thread");
});

await check("same key with a different payload is a 409", async () => {
  const { status } = await json("/api/inquiries?as=visitor-demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      placeId: "sendra-resort", checkIn: "2026-12-01", checkOut: "2026-12-03",
      partySize: 9, message: "Completely different payload.", idempotencyKey: key,
    }),
  });
  assert(status === 409, `expected 409, got ${status}`);
});

await check("an anonymous visitor sees no threads", async () => {
  const { body } = await json("/api/inquiries");
  assert(body.scope.role === "visitor", `role was ${body.scope.role}`);
  assert(body.inquiries.length === 0, `anonymous saw ${body.inquiries.length} threads`);
});

await check("thread listing is scoped per visitor", async () => {
  const { body } = await json("/api/inquiries?as=visitor-demo");
  assert(body.inquiries.length >= 1, "owner should see their thread");
  assert(body.inquiries.every((i) => i.id !== undefined), "malformed rows");
});

// The API route enforcing scope is not enough: the server-rendered thread page
// must enforce it too, or a private thread leaks to anyone who knows the id.
// This is checked against the HTML page, not the JSON API.
await check("the thread PAGE refuses an actor who is not a party to it", async () => {
  // Send a request as a signed-out visitor (empty actor cookie).
  const anon = await fetch(`${base}/inquiries/${inquiryId}`, { headers: { cookie: "mt_actor=" } });
  const anonHtml = await anon.text();
  assert(
    /Not available to this account/i.test(anonHtml),
    "anonymous page view did not show the scope refusal"
  );
  // And the owner still sees it.
  const owner = await fetch(`${base}/inquiries/${inquiryId}`, { headers: { cookie: `mt_actor=visitor-demo` } });
  const ownerHtml = await owner.text();
  assert(!/Not available to this account/i.test(ownerHtml), "owner was wrongly refused");
  assert(/thread/i.test(ownerHtml), "owner page did not render the thread");
});

await check("a role that is party to a thread still reads it", async () => {
  // The owning visitor must still get 200 with the thread body.
  const { body, status } = await json(`/api/inquiries/${inquiryId}?as=visitor-demo`);
  assert(status === 200, `owner should read their own thread, got ${status}`);
  assert(body.inquiry?.id === inquiryId, "owner got the wrong thread");
  assert(body.scope?.role === "visitor", "scope metadata missing");
});

await check("a visitor cannot post an availability report", async () => {
  const { status } = await json(`/api/inquiries/${inquiryId}/messages?as=visitor-demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "I declare availability.",
      availability: { kind: "reported_available", startDate: "2026-11-14", endDateExclusive: "2026-11-16" },
    }),
  });
  assert(status === 403, `expected 403, got ${status}`);
});

await check("a spoofed senderRole in the body cannot be stored as a provider message", async () => {
  // A visitor may of course type anything as free text. What must never happen is
  // that the body-supplied senderId/senderRole changes who the message is *from*.
  const before = (await json(`/api/inquiries/${inquiryId}?as=visitor-demo`)).body.inquiry.messages.length;
  await json(`/api/inquiries/${inquiryId}/messages?as=visitor-demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senderId: "provider-demo", senderRole: "provider", text: "Spoofed host reply." }),
  });
  const after = (await json(`/api/inquiries/${inquiryId}?as=visitor-demo`)).body.inquiry.messages;
  assert(after.length === before + 1, "expected exactly one new message");
  const last = after.at(-1);
  assert(last.senderRole === "visitor", `body senderRole was trusted: stored role ${last.senderRole}`);
  assert(last.senderId === "visitor-demo", `body senderId was trusted: stored sender ${last.senderId}`);
  assert(last.availability === undefined || last.availability === null, "visitor message carried an availability report");
});

await check("availability expiry is kind-specific, not a fixed 14 days", async () => {
  const mk = async (kind, dkey) => {
    const { body } = await json(`/api/inquiries/${inquiryId}/messages?as=provider-demo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `Report ${kind}`,
        availability: { kind, startDate: "2026-11-14", endDateExclusive: "2026-11-16", quantity: 1, quotePaise: 100 },
      }),
    });
    return body.message?.expiresAt;
  };
  const avail = await mk("reported_available");
  const unavail = await mk("reported_unavailable");
  const detail = await mk("needs_details");
  assert(avail && unavail && detail, "expected three expiry timestamps");
  assert(avail !== unavail, `available and unavailable share an expiry (${avail}) — the fixed-14-day bug is back`);
  assert(new Date(avail).getTime() < new Date(detail).getTime(), "available should decay faster than needs_details");
  assert(new Date(detail).getTime() < new Date(unavail).getTime(), "needs_details should decay faster than unavailable");
});

await check("a provider is refused on a thread for a listing they do not own", async () => {
  const { body } = await json("/api/inquiries?as=visitor-demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      placeId: "dzukou-valley", listingId: "dzukou-valley", partySize: 4,
      message: "Permit question.", idempotencyKey: unique(),
    }),
  });
  const otherId = body.inquiry.id;
  const read = await json(`/api/inquiries/${otherId}?as=provider-demo`);
  assert(read.status === 403, `provider read of unowned thread returned ${read.status}`);
  const write = await json(`/api/inquiries/${otherId}/messages?as=provider-demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "We can host you." }),
  });
  assert(write.status === 403, `provider write to unowned thread returned ${write.status}`);
});

// ---------------------------------------------------------------- uploads
let uploadId = null;

await check("moderation queue is not readable by a visitor", async () => {
  const { body } = await json("/api/uploads?as=visitor-demo");
  assert(body.uploads.length === 0, `visitor saw ${body.uploads.length} queue items`);
});

await check("a visitor cannot approve an upload", async () => {
  const { status } = await json("/api/uploads/00000000-0000-0000-0000-000000000000?as=visitor-demo", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision: "approved", reviewer: "reviewer-demo" }),
  });
  assert(status === 403, `expected 403, got ${status}`);
});

await check("upload rejects an unknown placeId", async () => {
  const form = new FormData();
  form.set("placeId", "not-a-real-place");
  form.set("caption", "x");
  form.set("attribution", "x");
  form.set("license", "CC0");
  form.set("ownershipAffirmed", "on");
  form.set("file", new File([new Uint8Array([1, 2, 3])], "a.png", { type: "image/png" }));
  const res = await fetch(`${base}/api/uploads`, { method: "POST", body: form });
  assert(res.status === 400, `expected 400, got ${res.status}`);
});

await check("upload rejects a file without ownership affirmation", async () => {
  const form = new FormData();
  form.set("placeId", "loktak-lake");
  form.set("caption", "x");
  form.set("attribution", "x");
  form.set("license", "CC0");
  form.set("file", new File([new Uint8Array([1, 2, 3])], "a.png", { type: "image/png" }));
  const res = await fetch(`${base}/api/uploads`, { method: "POST", body: form });
  assert(res.status === 400, `expected 400, got ${res.status}`);
});

await check("a real upload is quarantined and not publicly served", async () => {
  const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const form = new FormData();
  form.set("placeId", "loktak-lake");
  form.set("caption", "API test photo");
  form.set("attribution", "API Test");
  form.set("license", "CC0");
  form.set("ownershipAffirmed", "on");
  form.set("file", new File([bytes], "t.png", { type: "image/png" }));
  const res = await fetch(`${base}/api/uploads?as=visitor-demo`, { method: "POST", body: form });
  const body = await res.json();
  assert(res.status === 200, `upload status ${res.status} ${JSON.stringify(body).slice(0, 120)}`);
  uploadId = body.upload.id;
  assert(body.upload.moderation === "pending", "must start pending");

  const raw = await fetch(`${base}/api/uploads/${uploadId}/raw`);
  assert(raw.status === 404, `pending asset served with status ${raw.status} (quarantine leak)`);

  const pub = await json("/api/uploads/public?placeId=loktak-lake");
  assert(!pub.body.photos.some((p) => p.id === uploadId), "pending asset appeared in the public list");
});

await check("rejection requires a recorded reason", async () => {
  const { status } = await json(`/api/uploads/${uploadId}?as=reviewer-demo`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision: "rejected" }),
  });
  assert(status === 400, `expected 400, got ${status}`);
});

await check("approval makes the asset public and traceable", async () => {
  const { body, status } = await json(`/api/uploads/${uploadId}?as=reviewer-demo`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision: "approved" }),
  });
  assert(status === 200, `status ${status} ${JSON.stringify(body).slice(0, 120)}`);
  assert(body.upload.reviewedBy === "reviewer-demo", `reviewedBy was ${body.upload.reviewedBy}`);

  const raw = await fetch(`${base}/api/uploads/${uploadId}/raw`);
  assert(raw.status === 200, `approved asset returned ${raw.status}`);

  const pub = await json("/api/uploads/public?placeId=loktak-lake");
  assert(pub.body.photos.some((p) => p.id === uploadId), "approved asset missing from the public list");

  const place = await json("/api/places/loktak-lake");
  assert(
    place.body.photos.some((p) => p.origin === "approved-upload"),
    "approved asset did not reach the place page"
  );
});

await check("a decided upload cannot be re-decided", async () => {
  const { status } = await json(`/api/uploads/${uploadId}?as=reviewer-demo`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision: "rejected", note: "changed my mind" }),
  });
  assert(status === 409, `expected 409, got ${status}`);
});

// ---------------------------------------------------------------- summary
console.log(`\n${failures.length === 0 ? `ALL PASS (${pass})` : `PASS ${pass}, FAIL ${failures.length}`}`);
for (const f of failures) console.log(`  - ${f}`);
process.exit(failures.length ? 1 : 0);
