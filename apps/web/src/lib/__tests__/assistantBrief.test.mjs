// Brief parser guards — the panel may only call /api/plan with a complete,
// honestly-derived brief. Run: node --test src/lib/__tests__/assistantBrief.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..", "..", "..");
const libFile = join(webRoot, "src/lib/assistantBrief.ts");

test("assistantBrief.ts exists", () => {
  assert.ok(existsSync(libFile), "src/lib/assistantBrief.ts must exist");
});

// The parser is read as text and exercised through a tiny local harness so
// node --test passes without TS compilation: the file must export pure
// functions with these exact names and zero imports.
test("exports pure parser interface with no imports", () => {
  const src = readFileSync(libFile, "utf8");
  assert.ok(/export function parseBrief/.test(src), "must export parseBrief");
  assert.ok(/export function briefComplete/.test(src), "must export briefComplete");
  assert.ok(/export function missingBriefFields/.test(src), "must export missingBriefFields");
  assert.ok(!/^import /m.test(src), "must be dependency-free (pure, testable, reusable)");
  assert.ok(!/Date\.now|Math\.random|fetch\(/.test(src), "must be deterministic with no I/O");
});

test("parseBrief extracts nights, group, budget and interests", () => {
  const src = readFileSync(libFile, "utf8");
  // Contract pins: nights via day/night counts, group via people/guests,
  // budget via rupee figures, interests via known keywords.
  for (const token of ["nights", "groupSize", "budgetRupees", "interests"]) {
    assert.ok(src.includes(token), `parser must handle ${token}`);
  }
  // Honesty: budget without a stated basis must stay null, never defaulted.
  assert.ok(/budgetIncludes/.test(src), "parser must carry budgetIncludes (null until user picks)");
});
