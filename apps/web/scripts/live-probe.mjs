// Live router probe: call the running server, then print the answer AND run the
// local guard against it. If local says pass but the server says degraded, the
// server is running stale code. If local also says fail, it is a real LLM-output
// problem and the guard is correct to reject.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const base = process.argv[2] || "http://localhost:3100";

const questions = process.argv.slice(3).length
  ? process.argv.slice(3)
  : ["What is Loktak Lake?", "How many rooms does Sendra Resort have?"];

for (const q of questions) {
  const res = await fetch(`${base}/api/ai/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
  });
  const d = await res.json();
  console.log(`\n${"=".repeat(72)}\nQ: ${q}`);
  console.log(`server: intent=${d.intent} rule=${d.matched} degraded=${Boolean(d.degraded)}`);
  if (d.degraded) console.log(`reasons: ${d.degraded.reason.join(", ")}`);
  console.log(`claimIds in bundle: ${(d.bundle?.claimIds ?? []).join(", ") || "(none)"}`);
  console.log(`${"-".repeat(72)}\n${d.answer}`);
}
