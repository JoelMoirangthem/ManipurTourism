// RAG router — strict intent router with allowlisted handlers.
// Retrieval: approved-public seed claims only. Numbers/filtering in code.
// Model explains; output validated by guard.ts; template fallback on any failure.

import type { EvidenceBundle, Intent, PlaceRecord, RouterResult } from "./ports";
import { seedRetriever, agentRouterLLM } from "./adapters";
import { wikipediaSummary } from "./searchWeb";
import { pickTavilyTopic, tavilySearch, type TavilyResult } from "./tavily";
import { capacityWording, formatINR, projectFreshness } from "./domain";
import { detectIntent } from "./intent";
import { validateAnswer } from "./guard";

const SYSTEM = `You are "Manipur Tourism Mit", a careful travel assistant for Manipur, India.
Rules:
1. Answer ONLY from the verified place records provided. Never invent prices, availability, timings, permits, or safety conditions.
2. If info is missing, say what is unknown and suggest asking the provider or checking official sources.
3. Never certify any place, road, or activity as safe. No blanket reassurance.
4. Never claim to have booked, reserved, or held anything.
5. Cite claim IDs like [c-loktak-01] after every sentence that uses one. A citation must directly support the sentence it is attached to.
6. Keep answers concise and practical. Prefer 2-4 short sentences.`;

function templateAnswer(
  intent: Intent,
  bundle: EvidenceBundle,
  query: string,
  web: { title: string; extract: string; url: string } | null,
  confidence: "high" | "low",
  tavily?: TavilyResult[] | null
): string {
  // Low-confidence / nonsense input: ask for a usable question rather than
  // asserting "no verified information", which would read as a lookup miss.
  if (bundle.places.length === 0 && confidence === "low" && !web) {
    return `I couldn't tell what you're asking for. Ask me about a Manipur place — Loktak Lake, Kangla Fort, Ima Keithel, Keibul Lamjao, Shirui, Dzukou or Sendra — or describe your trip (days, group size, budget) and I'll draft an order to consider.`;
  }

  if (bundle.places.length === 0) {
    const base = `I don't have verified information for "${query}". Try asking about Loktak Lake, Kangla Fort, Ima Keithel, Shirui, or Dzukou — or rephrase with a place name.`;
    const live = (tavily ?? [])
      .slice(0, 3)
      .map((r) => `• ${r.title} — ${r.content.slice(0, 280)}\n  Source: ${r.url}`)
      .join("\n");
    const liveBlock = live
      ? `\n\nReal-time web results (unverified — confirm before travel):\n${live}`
      : "";
    if (!web) return `${base}${liveBlock}`;
    return (
      `${base}\n\nSourced web information (unverified — confirm before travel):\n` +
      `• ${web.title} — ${web.extract}\n  Source: ${web.url}${liveBlock}`
    );
  }

  const lines = bundle.places.map((p) => {
    const cap = p.claims.find((c) => c.fieldKey === "published_capacity");
    const fresh = cap ? projectFreshness(cap) : null;
    const freshNote = fresh && fresh !== "current" ? ` [${fresh}]` : "";
    return `• ${p.name} (${p.district}) — ${p.summary}${freshNote}\n  ${capacityWording(p)}\n  Sources: ${p.claims.map((c) => `[${c.id}] ${c.sourceTitle}`).join("; ")}`;
  });

  const unknown = bundle.unknowns.length ? `\n\nStill unknown: ${bundle.unknowns.join("; ")}.` : "";

  let note = "";
  if (intent === "status") {
    note =
      "\n\nI don't track live status and I can't certify anything as safe. Confirm openings, road conditions, permits and weather with official sources or your host before travel.";
  } else if (intent === "inquiry_draft") {
    note =
      "\n\nI can't book or hold anything. I can draft a structured question you send to the provider yourself — that thread is where a host can report what's actually free for your dates.";
  } else if (intent === "plan") {
    note = "\n\nUse the Plan page to generate tentative drafts with an honest budget. Nothing is held until a host replies for your dates.";
  }
  const liveFollow = (tavily ?? []).slice(0, 3);
  const liveSuffix =
    liveFollow.length > 0
      ? `\n\nReal-time leads (unverified — confirm before travel):\n${liveFollow
          .map((r) => `• ${r.title} — ${r.content.slice(0, 220)}\n  Source: ${r.url}`)
          .join("\n")}`
      : "";
  return `${lines.join("\n")}${unknown}${liveSuffix}${note}`;
}

/** Extract a searchable topic from a question, dropping question scaffolding. */
function topicOf(query: string): string {
  const stop = new Set([
    "what", "is", "the", "of", "a", "an", "and", "tell", "me", "about", "how",
    "do", "i", "in", "for", "to", "where", "when", "which", "who", "can", "you",
    "are", "there", "any", "best", "should", "would", "my", "we", "it", "on",
  ]);
  return query
    .replace(/[?.,!]/g, "")
    .split(/\s+/)
    .filter((w) => w && !stop.has(w.toLowerCase()))
    .slice(-6)
    .join(" ");
}

export async function routeQuery(query: string): Promise<RouterResult> {
  const searchedAt = new Date().toISOString();
  const route = detectIntent(query);
  const intent = route.intent;
  const confidence = route.confidence;
  const unknowns: string[] = [];

  if (intent === "out_of_scope") {
    return {
      intent,
      matched: route.matched,
      confidence,
      bundle: { places: [], claimIds: [], unknowns: [] },
      answer:
        route.matched === "gibberish"
          ? templateAnswer(intent, { places: [], claimIds: [], unknowns: [] }, query, null, "low")
          : "I help with Manipur trip planning from verified place info: where to stay, what's nearby, tentative itineraries, budgets, and drafting questions for local providers. I can't book, hold inventory, certify safety, or handle permits.",
      sources: [],
      searchedAt,
    };
  }

  // Negative retrieval: a question can mention a place while asking for
  // something we do not hold (price, availability, phone number). Retrieval
  // succeeding is NOT evidence that we can answer.
  const found = await seedRetriever.searchPlaces(query, { limit: 4 });

  const asksForHeld = /\b(price|prices|cost|costs|fee|fees|rate|rates|tariff|available|availability|vacan|open|opening|closed|hours|timing|timings|phone|contact|number|permit|permission|book|booking|reserve|reservation|safe|safety)\b/i.test(
    query
  );
  const hasCapacity = found.some((p) => p.claims.some((c) => c.fieldKey === "published_capacity"));
  if (asksForHeld && !hasCapacity) {
    unknowns.push("current prices", "availability for your dates", "opening hours", "contact details");
  }

  // Topic coverage: some questions ask about a *class* of information the corpus
  // simply does not carry, no matter which place is named — live weather,
  // travel routes from a specific origin, or language/translation. Retrieval
  // matching a place name is not evidence we can answer those, and the model
  // must be told so explicitly rather than left to infer it. Kept as a
  // structured signal (not a check on the model's prose) so the eval and the
  // UI can both see it.
  const topicUnknowns: string[] = [];
  if (intent === "weather_context") {
    topicUnknowns.push("current weather or forecast for any date", "road or lake conditions today");
  }
  if (/\b(route|routes|reach|reaching|get to|getting to|how (do|can) i (get|go|travel)|from the airport|directions?|taxi|bus|transport|distance)\b/i.test(query)) {
    topicUnknowns.push("travel routes, distances and transport options between specific points");
  }
  if (intent === "translate") {
    topicUnknowns.push("Manipuri language translations or transliterations");
  }
  for (const u of topicUnknowns) if (!unknowns.includes(u)) unknowns.push(u);

  // Bounded internet fallback: only when the seed corpus has nothing, and never
  // for status/inventory/safety questions (those must stay "unknown").
  let web: { title: string; extract: string; url: string } | null = null;
  if (found.length === 0 && intent !== "status" && intent !== "inquiry_draft") {
    try {
      const topic = topicOf(query);
      if (topic) {
        web = await wikipediaSummary(topic);
        if (!web && !topic.includes(",")) {
          web = (await wikipediaSummary(`${topic}, India`)) ?? (await wikipediaSummary(`${topic}, Manipur`));
        }
      }
    } catch {
      web = null;
    }
  }

  // Tavily real-time tool: supplements seed claims, never overrides them.
  // Skipped for status/inquiry (live safety/inventory must stay "unknown").
  // Otherwise runs when the corpus missed OR the query is real-time
  // (weather/current/latest/news) OR weather_context intent. Fail-null.
  let tavily: TavilyResult[] | null = null;
  const realtimeHint = /\b(now|today|current|latest|recent|news|update|weather|forecast|temperature|monsoon|rain)\b/i.test(query);
  const shouldUseTavily =
    intent !== "status" && intent !== "inquiry_draft" && (intent === "weather_context" || found.length === 0 || realtimeHint);
  if (shouldUseTavily) {
    try {
      tavily = await tavilySearch(query, { topic: pickTavilyTopic(query, intent), maxResults: 5 });
      if (!tavily || tavily.length === 0) tavily = null;
    } catch {
      tavily = null;
    }
  }

  if (intent === "status" || intent === "plan") {
    unknowns.push("live availability", "current prices", "today's openings/closures");
  }

  const bundle: EvidenceBundle = {
    places: found,
    claimIds: found.flatMap((p) => p.claims.map((c) => c.id)),
    unknowns,
  };

  // Citations are attached to the claim they came from, so the visitor can
  // trace a specific sentence rather than a source list at the bottom.
  // Tavily hits are kind:web (unverified) — never claim IDs.
  const sources = found.flatMap((p) =>
    p.claims.map((c) => ({ title: c.sourceTitle, url: c.sourceUrl, kind: "claim" as const }))
  );
  const tavilySources = (tavily ?? []).map((r) => ({
    title: `${r.title} (Tavily — unverified)`,
    url: r.url,
    kind: "web" as const,
  }));
  const webSources = [
    ...(web ? [{ title: `${web.title} (Wikipedia — unverified)`, url: web.url, kind: "web" as const }] : []),
    ...tavilySources,
  ];

  // Grounded generation; any guard failure → template (ADR-09).
  try {
    const context = found
      .map(
        (p) =>
          `- ${p.name} (${p.district}, ${p.category}): ${p.summary} ${capacityWording(p)} Claims: ${p.claims
            .map((c) => `[${c.id}] ${c.fieldKey}=${c.valueText ?? c.valueInt ?? "n/a"} (${c.sourceTitle}, freshness=${projectFreshness(c)})`)
            .join(" ")}`
      )
      .join("\n");
    const webCtx = web
      ? `\nUNVERIFIED web context (Wikipedia "${web.title}" — do NOT treat as verified, do NOT cite a claim ID for it, label anything from it as unverified):\n${web.extract}\nSource: ${web.url}\n`
      : "";
    const tavilyCtx =
      tavily && tavily.length > 0
        ? `\nUNVERIFIED real-time web results (Tavily — do NOT treat as verified, do NOT cite a claim ID for them, label anything from them as unverified leads):\n${tavily
            .slice(0, 5)
            .map((r) => `- ${r.title} (${r.publishedDate ?? "date unknown"}): ${r.content}\n  Source: ${r.url}`)
            .join("\n")}\n`
        : "";
    const llm = agentRouterLLM();
    const answer = await llm.complete(
      SYSTEM,
      `Verified records:\n${context || "(none)"}\n${webCtx}${tavilyCtx}\nUnknowns: ${unknowns.join(", ") || "none"}\n\nUser question: ${query}\n\nAnswer using only the records above. Cite claim IDs like [c-loktak-01] immediately after each statement they support. State unknowns explicitly. Anything from UNVERIFIED sections must be labelled unverified and never carry a claim ID.`
    );
    const verdict = validateAnswer(answer, bundle);
    if (!verdict.ok) return fallback(intent, bundle, query, web, route.matched, confidence, sources, webSources, searchedAt, verdict.reasons, tavily);
    return {
      intent,
      matched: route.matched,
      confidence,
      bundle,
      answer,
      sources: [...sources, ...webSources],
      searchedAt,
      degraded: null,
    };
  } catch (e) {
    const reason = e instanceof Error ? e.message : "generation failed";
    return fallback(intent, bundle, query, web, route.matched, confidence, sources, webSources, searchedAt, [reason], tavily);
  }
}

function fallback(
  intent: Intent,
  bundle: EvidenceBundle,
  query: string,
  web: { title: string; extract: string; url: string } | null,
  matched: string,
  confidence: "high" | "low",
  sources: { title: string; url: string | null; kind: "claim" }[],
  webSources: { title: string; url: string; kind: "web" }[],
  searchedAt: string,
  reasons: string[],
  tavily?: TavilyResult[] | null
): RouterResult {
  return {
    intent,
    matched,
    confidence,
    bundle,
    answer: templateAnswer(intent, bundle, query, web, confidence, tavily),
    sources: [...sources, ...webSources],
    searchedAt,
    degraded: { reason: reasons },
  };
}

export type QueryStreamEvent =
  | { type: "status"; message: string }
  | { type: "sources"; sources: RouterResult["sources"]; intent: Intent; matched?: string }
  | { type: "token"; token: string }
  | { type: "done"; result: RouterResult };

function chunkText(s: string, size = 24): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  return out;
}

/**
 * Streaming variant of routeQuery — yields status/sources immediately so the
 * UI paints without waiting, then live LLM tokens, then the final result.
 * Retrieval + safety rules are identical to routeQuery; guard fallback still
 * applies (fallback answer is chunked as tokens).
 */
export async function* routeQueryEvents(query: string): AsyncGenerator<QueryStreamEvent> {
  const searchedAt = new Date().toISOString();
  const route = detectIntent(query);
  const intent = route.intent;
  const confidence = route.confidence;
  const unknowns: string[] = [];

  if (intent === "out_of_scope") {
    const result: RouterResult =
      route.matched === "gibberish"
        ? {
            intent,
            matched: route.matched,
            confidence,
            bundle: { places: [], claimIds: [], unknowns: [] },
            answer: templateAnswer(intent, { places: [], claimIds: [], unknowns: [] }, query, null, "low", null),
            sources: [],
            searchedAt,
          }
        : {
            intent,
            matched: route.matched,
            confidence,
            bundle: { places: [], claimIds: [], unknowns: [] },
            answer:
              "I help with Manipur trip planning from verified place info: where to stay, what's nearby, tentative itineraries, budgets, and drafting questions for local providers. I can't book, hold inventory, certify safety, or handle permits.",
            sources: [],
            searchedAt,
          };
    yield { type: "sources", sources: result.sources, intent, matched: route.matched };
    for (const c of chunkText(result.answer)) yield { type: "token", token: c };
    yield { type: "done", result };
    return;
  }

  yield { type: "status", message: "Searching verified places…" };
  const found = await seedRetriever.searchPlaces(query, { limit: 4 });

  const asksForHeld = /\b(price|prices|cost|costs|fee|fees|rate|rates|tariff|available|availability|vacan|open|opening|closed|hours|timing|timings|phone|contact|number|permit|permission|book|booking|reserve|reservation|safe|safety)\b/i.test(
    query
  );
  const hasCapacity = found.some((p) => p.claims.some((c) => c.fieldKey === "published_capacity"));
  if (asksForHeld && !hasCapacity) {
    unknowns.push("current prices", "availability for your dates", "opening hours", "contact details");
  }

  const topicUnknowns: string[] = [];
  if (intent === "weather_context") {
    topicUnknowns.push("current weather or forecast for any date", "road or lake conditions today");
  }
  if (/\b(route|routes|reach|reaching|get to|getting to|how (do|can) i (get|go|travel)|from the airport|directions?|taxi|bus|transport|distance)\b/i.test(query)) {
    topicUnknowns.push("travel routes, distances and transport options between specific points");
  }
  if (intent === "translate") {
    topicUnknowns.push("Manipuri language translations or transliterations");
  }
  for (const u of topicUnknowns) if (!unknowns.includes(u)) unknowns.push(u);

  let web: { title: string; extract: string; url: string } | null = null;
  if (found.length === 0 && intent !== "status" && intent !== "inquiry_draft") {
    try {
      const topic = topicOf(query);
      if (topic) {
        web = await wikipediaSummary(topic);
        if (!web && !topic.includes(",")) {
          web = (await wikipediaSummary(`${topic}, India`)) ?? (await wikipediaSummary(`${topic}, Manipur`));
        }
      }
    } catch {
      web = null;
    }
  }

  yield { type: "status", message: "Checking real-time sources…" };
  let tavily: TavilyResult[] | null = null;
  const realtimeHint = /\b(now|today|current|latest|recent|news|update|weather|forecast|temperature|monsoon|rain)\b/i.test(query);
  const shouldUseTavily =
    intent !== "status" && intent !== "inquiry_draft" && (intent === "weather_context" || found.length === 0 || realtimeHint);
  if (shouldUseTavily) {
    try {
      tavily = await tavilySearch(query, { topic: pickTavilyTopic(query, intent), maxResults: 5 });
      if (!tavily || tavily.length === 0) tavily = null;
    } catch {
      tavily = null;
    }
  }

  if (intent === "status" || intent === "plan") {
    unknowns.push("live availability", "current prices", "today's openings/closures");
  }

  const bundle: EvidenceBundle = {
    places: found,
    claimIds: found.flatMap((p) => p.claims.map((c) => c.id)),
    unknowns,
  };
  const sources = found.flatMap((p) =>
    p.claims.map((c) => ({ title: c.sourceTitle, url: c.sourceUrl, kind: "claim" as const }))
  );
  const tavilySources = (tavily ?? []).map((r) => ({
    title: `${r.title} (Tavily — unverified)`,
    url: r.url,
    kind: "web" as const,
  }));
  const webSources = [
    ...(web ? [{ title: `${web.title} (Wikipedia — unverified)`, url: web.url, kind: "web" as const }] : []),
    ...tavilySources,
  ];
  yield { type: "sources", sources: [...sources, ...webSources], intent, matched: route.matched };

  const context = found
    .map(
      (p) =>
        `- ${p.name} (${p.district}, ${p.category}): ${p.summary} ${capacityWording(p)} Claims: ${p.claims
          .map((c) => `[${c.id}] ${c.fieldKey}=${c.valueText ?? c.valueInt ?? "n/a"} (${c.sourceTitle}, freshness=${projectFreshness(c)})`)
          .join(" ")}`
    )
    .join("\n");
  const webCtx = web
    ? `\nUNVERIFIED web context (Wikipedia "${web.title}" — do NOT treat as verified, do NOT cite a claim ID for it, label anything from it as unverified):\n${web.extract}\nSource: ${web.url}\n`
    : "";
  const tavilyCtx =
    tavily && tavily.length > 0
      ? `\nUNVERIFIED real-time web results (Tavily — do NOT treat as verified, do NOT cite a claim ID for them, label anything from them as unverified leads):\n${tavily
          .slice(0, 5)
          .map((r) => `- ${r.title} (${r.publishedDate ?? "date unknown"}): ${r.content}\n  Source: ${r.url}`)
          .join("\n")}\n`
      : "";
  const userPrompt = `Verified records:\n${context || "(none)"}\n${webCtx}${tavilyCtx}\nUnknowns: ${unknowns.join(", ") || "none"}\n\nUser question: ${query}\n\nAnswer using only the records above. Cite claim IDs like [c-loktak-01] immediately after each statement they support. State unknowns explicitly. Anything from UNVERIFIED sections must be labelled unverified and never carry a claim ID.`;

  try {
    const { streamAgentRouter } = await import("./adapters");
    let answer = "";
    yield { type: "status", message: "Drafting answer…" };
    for await (const delta of streamAgentRouter(SYSTEM, userPrompt)) {
      answer += delta;
      yield { type: "token", token: delta };
    }
    const finalAnswer = answer.trim();
    if (!finalAnswer) throw new Error("AgentRouter returned empty content");
    const verdict = validateAnswer(finalAnswer, bundle);
    if (!verdict.ok) {
      const fb = fallback(intent, bundle, query, web, route.matched, confidence, sources, webSources, searchedAt, verdict.reasons, tavily);
      // Fallback was not streamed — emit it now so UI converges to validated text.
      // The tokens above are replaced by the caller with fb.answer on done.degraded.
      yield { type: "done", result: fb };
      return;
    }
    yield {
      type: "done",
      result: {
        intent,
        matched: route.matched,
        confidence,
        bundle,
        answer: finalAnswer,
        sources: [...sources, ...webSources],
        searchedAt,
        degraded: null,
      },
    };
  } catch (e) {
    const reason = e instanceof Error ? e.message : "generation failed";
    const fb = fallback(intent, bundle, query, web, route.matched, confidence, sources, webSources, searchedAt, [reason], tavily);
    for (const c of chunkText(fb.answer)) yield { type: "token", token: c };
    yield { type: "done", result: fb };
  }
}
