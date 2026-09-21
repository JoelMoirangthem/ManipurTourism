// Debug harness: call the LLM directly with the same prompt the router builds,
// then print the raw answer and the guard verdict side by side. Used to tune the
// guard against real output rather than against guesses.
//
// Run: node scripts/debug-guard.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// Load .env.local manually (no dotenv dependency).
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const seed = JSON.parse(readFileSync(join(root, "src/data/seed-places.json"), "utf8"));

const SYSTEM = `You are "Manipur Tourism Mit", a careful travel assistant for Manipur, India.
Rules:
1. Answer ONLY from the verified place records provided. Never invent prices, availability, timings, permits, or safety conditions.
2. If info is missing, say what is unknown and suggest asking the provider or checking official sources.
3. Never certify any place, road, or activity as safe. No blanket reassurance.
4. Never claim to have booked, reserved, or held anything.
5. Cite claim IDs like [c-loktak-01] after every sentence that uses one. A citation must directly support the sentence it is attached to.
6. Keep answers concise and practical. Prefer 2-4 short sentences.`;

function contextFor(query) {
  const t = query.toLowerCase();
  const found = seed.filter((p) =>
    `${p.name} ${p.aliases.join(" ")} ${p.category} ${p.district} ${p.summary} ${p.claims.map((c) => c.fieldKey + " " + c.valueText).join(" ")}`
      .toLowerCase()
      .includes(t.split(/\s+/).filter((w) => w.length > 3)[0] ?? "\u0000")
  );
  const list = found.length ? found : seed.slice(0, 2);
  return list
    .map((p) => `- ${p.name} (${p.district}, ${p.category}): ${p.summary} Claims: ${p.claims.map((c) => `[${c.id}] ${c.fieldKey}=${c.valueText ?? c.valueInt}`).join(" ")}`)
    .join("\n");
}

const QUESTIONS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["What is Loktak Lake?", "How many rooms does Sendra Resort have?", "Is Loktak Lake safe to visit?"];

for (const q of QUESTIONS) {
  const res = await fetch(`${env.AGENTROUTER_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.AGENTROUTER_API_KEY}`,
      "User-Agent": env.AGENTROUTER_USER_AGENT,
    },
    body: JSON.stringify({
      model: env.AGENTROUTER_MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Verified records:\n${contextFor(q)}\n\nUnknowns: none\n\nUser question: ${q}\n\nAnswer using only the records above. Cite claim IDs like [c-loktak-01] immediately after each statement they support. State unknowns explicitly.`,
        },
      ],
      max_tokens: 600,
      temperature: 0.2,
    }),
  });
  const data = await res.json();
  const answer = data.choices?.[0]?.message?.content ?? "(no content)";
  console.log(`\n${"=".repeat(70)}\nQ: ${q}\n${"-".repeat(70)}`);
  console.log(answer);
  console.log(`${"-".repeat(70)}`);
  // Show the sentence/citation split the guard sees.
  const sentences = answer.replace(/\n+/g, " ").split(/(?<=[.!?])\s+/);
  for (const s of sentences) {
    const ids = [...s.matchAll(/\[(c-[\w-]+)\]/g)].map((m) => m[1]);
    if (ids.length) console.log(`  [${ids.join(",")}]  ${s.slice(0, 100)}`);
  }
}
