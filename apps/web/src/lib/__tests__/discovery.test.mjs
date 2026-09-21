// Discovery static-data guards — no server, no TS compilation needed.
//
// Node's test runner cannot import .ts directly, so this test reads
// src/data/discovery.ts as text and asserts on its content via regex,
// validating district/category references against the live seed catalogue
// (src/data/seed-places.json). Later tasks (hero search, seasons/festivals)
// consume COLLECTIONS / SEASONS / FESTIVALS, so these guards pin the field
// names and values: Collection { slug, title, blurb, district?, category?,
// href }, Season { name, months, temp, note }, Festival { name, pattern,
// venues, sourceUrl, sourceLabel }.
//
// Run: node --test src/lib/__tests__/discovery.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..", "..", "..");
const seed = JSON.parse(readFileSync(join(webRoot, "src/data/seed-places.json"), "utf8"));
const src = readFileSync(join(webRoot, "src/data/discovery.ts"), "utf8");

const EXPECTED_IDS = [
  "loktak-lake",
  "keibul-lamjao",
  "sendra-resort",
  "kangla-fort",
  "ima-keithel",
  "ina-memorial",
  "shirui-peak",
  "dzukou-valley",
];

/** Return the source slice for one exported array (up to the next export). */
function block(name) {
  const marker = `export const ${name}`;
  const from = src.indexOf(marker);
  assert.ok(from >= 0, `src/data/discovery.ts must export ${name}`);
  const next = src.indexOf("export const", from + marker.length);
  return src.slice(from, next < 0 ? undefined : next);
}

/** All `"value"` captures for `key: "value"` pairs inside a block. */
function valuesOf(blockSrc, key) {
  const re = new RegExp(`${key}:\\s*"([^"]+)"`, "g");
  return [...blockSrc.matchAll(re)].map((m) => m[1]);
}

test("discovery collections resolve against live seed", () => {
  assert.ok(src.length > 0, "src/data/discovery.ts must exist and be non-empty");
  const ids = new Set(seed.map((p) => p.id));
  for (const id of EXPECTED_IDS) {
    assert.ok(ids.has(id), `seed catalogue is missing place id ${id}`);
  }
  const collections = block("COLLECTIONS");
  for (const slug of ["lakeside", "heritage-imphal", "trek-country"]) {
    assert.ok(collections.includes(`slug: "${slug}"`), `COLLECTIONS missing slug ${slug}`);
  }
  const districts = new Set(seed.map((p) => p.district));
  const categories = new Set(seed.map((p) => p.category));
  for (const d of valuesOf(collections, "district")) {
    assert.ok(districts.has(d), `unknown district ${d}`);
  }
  for (const c of valuesOf(collections, "category")) {
    assert.ok(categories.has(c), `unknown category ${c}`);
  }
});

test("collections use real districts/categories only", () => {
  const collections = block("COLLECTIONS");
  const districts = new Set(seed.map((p) => p.district));
  const categories = new Set(seed.map((p) => p.category));
  for (const d of valuesOf(collections, "district")) {
    assert.ok(districts.has(d), `unknown district ${d}`);
  }
  for (const c of valuesOf(collections, "category")) {
    assert.ok(categories.has(c), `unknown category ${c}`);
  }
  const slugs = valuesOf(collections, "slug");
  assert.equal(slugs.length, 3, "expected exactly 3 collections");
  assert.equal(new Set(slugs).size, slugs.length, "collection slugs must be unique");
  for (const href of valuesOf(collections, "href")) {
    assert.ok(href.startsWith("/places?"), `collection href must filter /places, got ${href}`);
  }
  for (const title of valuesOf(collections, "title")) {
    assert.ok(title.length > 0, "collection title must be non-empty");
  }
  for (const blurb of valuesOf(collections, "blurb")) {
    assert.ok(blurb.length > 0, "collection blurb must be non-empty");
  }
});

test("seasons expose name/months/temp/note without over-claiming", () => {
  const seasons = block("SEASONS");
  for (const name of ["Best window", "Lush summer", "Monsoon caution"]) {
    assert.ok(seasons.includes(`name: "${name}"`), `SEASONS missing entry ${name}`);
  }
  assert.equal(valuesOf(seasons, "name").length, 3, "expected exactly 3 seasons");
  for (const key of ["months", "temp", "note"]) {
    assert.equal(valuesOf(seasons, key).length, 3, `every season needs ${key}`);
  }
});

test("festivals carry sources and annual patterns, never guaranteed dates", () => {
  const festivals = block("FESTIVALS");
  for (const name of ["Sangai Festival", "Shirui Lily Festival", "Yaoshang"]) {
    assert.ok(festivals.includes(`name: "${name}"`), `FESTIVALS missing entry ${name}`);
  }
  const banned = /\b(available now|rooms available|per night|book now|guaranteed 2026)\b/i;
  const names = valuesOf(festivals, "name");
  const patterns = valuesOf(festivals, "pattern");
  const urls = valuesOf(festivals, "sourceUrl");
  const labels = valuesOf(festivals, "sourceLabel");
  assert.equal(names.length, 3, "expected exactly 3 festivals");
  assert.equal(patterns.length, 3, "every festival needs a pattern");
  assert.equal(urls.length, 3, "every festival needs a sourceUrl");
  assert.equal(labels.length, 3, "every festival needs a sourceLabel");
  for (let i = 0; i < names.length; i++) {
    assert.ok(urls[i].startsWith("https://"), `${names[i]} needs official source`);
    assert.ok(patterns[i].match(/yearly|May|Nov|Feb/i), `${names[i]} must read as annual pattern`);
    assert.ok(!banned.test(`${names[i]} ${patterns[i]}`), `${names[i]} over-claims`);
  }
  assert.ok(!banned.test(src), "discovery.ts must not assert live availability/prices");
});

test("discovery field names match the plan exactly", () => {
  assert.match(
    src,
    /export type Collection = \{ slug: string; title: string; blurb: string; district\?: string; category\?: string; href: string \}/,
    "Collection type must match plan"
  );
  assert.match(
    src,
    /export type Season = \{ name: string; months: string; temp: string; note: string \}/,
    "Season type must match plan"
  );
  assert.match(
    src,
    /export type Festival = \{ name: string; pattern: string; venues: string; sourceUrl: string; sourceLabel: string \}/,
    "Festival type must match plan"
  );
});
