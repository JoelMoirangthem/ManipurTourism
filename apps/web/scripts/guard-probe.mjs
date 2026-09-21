// Direct guard test against the real module, using a tiny TS-to-JS shim so I can
// see actual verdicts without a running server. Run:
//   node scripts/guard-probe.mjs
//
// This exists because the dev server round-trip made it hard to tell whether a
// failure was a stale module or a real logic bug. It removes that ambiguity.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const outDir = join(root, ".tmp-guardprobe");
mkdirSync(outDir, { recursive: true });

// Strip types crudely but reliably for this narrow use: compile with tsc.
const tsc = join(root, "node_modules", "typescript", "bin", "tsc");
execFileSync(
  process.execPath,
  [
    tsc,
    join(root, "src", "lib", "guard.ts"),
    join(root, "src", "lib", "domain.ts"),
    join(root, "src", "lib", "ports.ts"),
    "--outDir", outDir,
    "--module", "esnext",
    "--target", "es2022",
    "--moduleResolution", "bundler",
    "--skipLibCheck",
  ],
  { stdio: "inherit" }
);

// tsc emits bare specifiers; rewrite "./ports" to "./ports.js" for Node ESM.
for (const f of ["guard.js", "domain.js"]) {
  const p = join(outDir, f);
  try {
    const src = readFileSync(p, "utf8").replace(/from "\.\/([a-z]+)"/g, 'from "./$1.js"');
    writeFileSync(p, src);
  } catch { /* file may not exist if unused */ }
}

const { validateAnswer, unsupportedCitations, staleOperationalClaims } = await import(
  `file://${join(outDir, "guard.js").replace(/\\/g, "/")}`
);

const seed = JSON.parse(readFileSync(join(root, "src/data/seed-places.json"), "utf8"));
const byId = (id) => seed.find((p) => p.id === id);

const bundle = {
  places: [byId("loktak-lake"), byId("keibul-lamjao")],
  claimIds: ["c-loktak-01", "c-keibul-01"],
  unknowns: [],
};

const CASES = [
  {
    name: "descriptive answer, per-sentence citations (should PASS)",
    answer:
      "Loktak Lake is in Bishnupur district, Manipur, and is India's largest freshwater lake in the Northeast, known for its floating phumdis [c-loktak-01]. It is also home to the Sangai deer habitat at Keibul Lamjao, the world's only floating national park and the last natural habitat of the endangered Sangai [c-keibul-01].",
  },
  {
    // Observed verbatim from the live model via scripts/router-probe.mjs.
    name: "real model answer with a qualifying sentence (should PASS)",
    answer:
      "Loktak Lake, in Bishnupur, is described as the largest freshwater lake in Northeast India, known for its floating phumdis [c-loktak-01]. It is also the site of Keibul Lamjao National Park, the world's only floating national park and the last natural habitat of the endangered Sangai deer [c-keibul-01]. The records do not give current timings, prices, or conditions, and their freshness is marked unknown — confirm details with a local boat operator or park officials before travelling [c-loktak-01].",
  },
  {
    name: "attribution line shape (should PASS)",
    answer:
      "Loktak Lake is known for floating phumdis.\nSources: [c-loktak-01] Manipur Tourism — Places to See",
  },
  {
    name: "capacity figure with an explicit unknown disclaimer (should PASS)",
    answer:
      "The directory lists 13 rooms for Sendra Resort, but this is a published capacity and availability is unconfirmed — ask the host for your dates [c-sendra-01].",
  },
  {
    name: "fabricated price with a citation (should FAIL)",
    answer: "A room at Sendra Resort costs ₹2,500 per night [c-loktak-01].",
  },
  {
    name: "safety certification (should FAIL)",
    answer: "Loktak Lake is definitely safe to visit [c-loktak-01].",
  },
  {
    name: "booking claim (should FAIL)",
    answer: "I have booked your room at Loktak for two nights [c-loktak-01]. Your reservation is confirmed.",
  },
  {
    name: "citation to an id outside the bundle (should FAIL)",
    answer: "Loktak Lake is the largest freshwater lake [c-does-not-exist-99].",
  },
  {
    name: "refusal phrasing must NOT be flagged (should PASS)",
    answer: "I cannot guarantee that Loktak Lake is safe [c-loktak-01].",
  },
];

let failures = 0;
for (const c of CASES) {
  const v = validateAnswer(c.answer, bundle);
  const shouldPass = c.name.includes("should PASS");
  const ok = shouldPass ? v.ok : !v.ok;
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"}  ${c.name}`);
  if (v.reasons.length) console.log(`        reasons: ${v.reasons.join(", ")}`);
}
console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
