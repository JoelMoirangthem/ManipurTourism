// Guard + intent unit tests — no server needed.
// Run: node --test src/lib/__tests__/guard.test.mjs
//
// These pin the behaviours that the audit found broken, so a future edit cannot
// silently reintroduce them.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..", "..", "..");

// Load the TS sources through the compiled dev output is not available here, so
// these tests exercise the pure logic by re-implementing nothing: they import
// the JSON fixture and assert the *rules* the modules implement. The modules
// themselves are covered end-to-end by eval/run.mjs against a live server.
const seed = JSON.parse(readFileSync(join(webRoot, "src/data/seed-places.json"), "utf8"));

test("seed corpus is internally consistent", () => {
  assert.ok(seed.length >= 8, "expected the full catalogue");
  const ids = seed.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, "place ids must be unique");
  for (const p of seed) {
    assert.ok(p.claims.length > 0, `${p.id} has no claims`);
    for (const c of p.claims) {
      assert.ok(c.id.startsWith("c-"), `${c.id} must follow the claim-id convention`);
      assert.ok(c.sourceTitle, `${c.id} has no source title`);
      assert.ok(
        ["approved", "pending_review", "rejected"].includes(c.reviewState),
        `${c.id} has an unknown reviewState: ${c.reviewState}`
      );
    }
    for (const ph of p.photos) {
      assert.ok(ph.attribution && ph.license, `${p.id} photo missing attribution/licence`);
    }
  }
});

test("no claim asserts live availability or a nightly price", () => {
  // These are the two things the system must never invent.
  const banned = /\b(available now|rooms available|vacancy|per night|per night rate|₹\s?\d+\/night)\b/i;
  for (const p of seed) {
    for (const c of p.claims) {
      const text = `${c.valueText ?? ""} ${c.fieldKey}`;
      assert.ok(!banned.test(text), `${c.id} asserts live availability/price: ${text}`);
    }
  }
});

test("capacity claims are scoped to the property, not to a date", () => {
  const caps = seed.flatMap((p) => p.claims.filter((c) => c.fieldKey === "published_capacity"));
  assert.ok(caps.length > 0, "expected at least one capacity claim to test");
  for (const c of caps) {
    assert.equal(c.scope, "property", `${c.id} capacity must be scoped to the property`);
    assert.equal(c.observedAt, null, `${c.id} fixtures must not carry a fabricated observation date`);
  }
});

test("every place has one short honest tagline for cover cards", () => {
  const banned = /\b(available now|rooms available|vacancy|per night|book now|guaranteed|discount|% off)\b/i;
  for (const p of seed) {
    assert.ok(typeof p.tagline === "string" && p.tagline.length > 0, `${p.id} is missing a tagline`);
    assert.ok(p.tagline.length <= 90, `${p.id} tagline must be one short sentence (got ${p.tagline.length} chars)`);
    assert.ok(!banned.test(p.tagline), `${p.id} tagline over-claims: ${p.tagline}`);
  }
});
