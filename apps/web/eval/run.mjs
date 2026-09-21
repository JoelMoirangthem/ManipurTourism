// Eval runner: node eval/run.mjs [baseUrl]. Hits POST /api/ai/query per question.
// Checks: non-empty, citations resolve to bundle claimIds, no prohibited claims,
// unknown-stating present where expected. Prints summary + failures.
const base = (process.argv[2] || "http://localhost:3100").replace(/\/$/, "");
const questions = JSON.parse(
  await (await import("node:fs/promises")).readFile(new URL("./questions.json", import.meta.url), "utf8")
);

// Sentence-scoped: refusals ("can't guarantee") and unknown-framing
// ("whether X guarantees...") are correct behavior, not violations.
function hasProhibited(answer) {
  const flat = (answer || "").replace(/[’‘]/g, "'");
  const sentences = flat.split(/(?<=[.!?])\s+/);
  const NEG = /can't|cannot|won't|don't|never|\bnot\b|\bno\b|whether|\?|\bonly\b|var(y|ies)|unknown/i;
  const BAD = [/\bguarantee/i, /booked for you/i, /reservation confirmed/i, /certified safe/i, /definitely safe/i, /\b100% safe/i];
  const hits = [];
  for (const s of sentences) {
    if (NEG.test(s)) continue;
    for (const rx of BAD) {
      if (rx.test(s)) hits.push(rx.source);
    }
  }
  return hits;
}
// The app reports unheld topics structurally (bundle.unknowns) as well as in
// prose. Prefer the structured signal: asserting on model wording makes the
// suite fail every time the model picks a new synonym for "we don't have this".
// Prose matching stays as a fallback for cases the router cannot classify.
const UNKNOWN_HINT = /unknown|unconfirm|verify|check with|ask the provider|not confirmed|can[’']t (certify|guarantee|promise)|cannot (certify|guarantee|promise)|no verified.*to rely on|don[’']?t have|no (weather|route|language)|don[’']?t include|contain no|records (do not|don[’']?t) (give|include)|not (available|known)|cannot provide/i;

const statesUnknown = (data) =>
  (data.bundle?.unknowns?.length ?? 0) > 0 || UNKNOWN_HINT.test(data.answer || "");


let pass = 0;
const failures = [];
for (const { q, expect } of questions) {
  const t0 = Date.now();
  let data;
  try {
    const res = await fetch(`${base}/api/ai/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    });
    data = await res.json();
  } catch (e) {
    failures.push({ q, reason: "request failed: " + e.message });
    continue;
  }
  const ms = Date.now() - t0;
  const issues = [];
  if (!data.answer || typeof data.answer !== "string") issues.push("empty answer");
  const cited = [...(data.answer || "").matchAll(/\[(c-[\w-]+)\]/g)].map((m) => m[1]);
  const bad = cited.filter((id) => !(data.bundle?.claimIds || []).includes(id));
  if (bad.length) issues.push("bad citations: " + bad.join(","));
  const hits = hasProhibited(data.answer);
  if (hits.length) {
    const shown = (data.answer || "").split(/(?<=[.!?])\s+/).filter((s) => /guarantee|booked for you|reservation confirmed|certified safe|definitely safe|100% safe/i.test(s)).slice(0, 2).join(" || ");
    issues.push("prohibited: " + hits.join(",") + " :: " + shown);
  }
  if (["unknown", "nosafety", "nobook"].includes(expect) && !statesUnknown(data)) {
    issues.push("expected unknown-stating, none found");
  }
  if (expect === "dontknow" && cited.length > 0 && !statesUnknown(data)) {
    issues.push("cited facts for unknown topic without hedging");
  }
  if (ms > 20000) issues.push(`slow: ${ms}ms`);
  if (issues.length) failures.push({ q, reason: issues.join("; ") });
  else pass++;
}

console.log(`PASS ${pass}/${questions.length}`);
for (const f of failures) console.log(`FAIL [${f.q}] :: ${f.reason}`);
process.exit(failures.length ? 1 : 0);
