// Print the raw answer + router metadata for a handful of questions.
const base = process.argv[2] ?? "http://localhost:3100";
const questions = process.argv.slice(3);
if (!questions.length) {
  questions.push(
    "What is the weather at Loktak today?",
    "How do I reach Kangla from the airport?",
    "Translate hello to Manipuri"
  );
}
for (const q of questions) {
  const res = await fetch(`${base}/api/ai/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
  });
  const j = await res.json().catch(() => ({}));
  console.log("=".repeat(70));
  console.log("Q:", q);
  console.log("status:", res.status, "| intent:", j.intent, "| matched:", j.matched, "| degraded:", JSON.stringify(j.degraded));
  console.log("cited:", JSON.stringify(j.citations ?? j.citedRecords ?? null));
  console.log("answer:", j.answer ?? j.text ?? "(none)");
}
