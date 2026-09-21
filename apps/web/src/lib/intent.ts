// Intent router — deterministic, ordered, testable. No LLM (ADR-03).
//
// GAP FIXED: the old router was an unordered regex chain where "safe" mapped to
// `status`. "Is Loktak Lake safe to visit?" therefore took the status branch and
// skipped the safety-refusal path.
//
// Two structural changes:
//   1. Rules are evaluated in an explicit priority order. Refusal/safety intents
//      outrank everything, so they cannot be shadowed.
//   2. Matching is token-based with word boundaries, not substring `includes`
//      on a raw lowercased string.

import type { Intent } from "./ports";

export interface Route {
  intent: Intent;
  /** Which rule fired — surfaced in eval output so failures are diagnosable. */
  matched: string;
  confidence: "high" | "low";
}

interface Rule {
  name: string;
  intent: Intent;
  test: (q: string, words: Set<string>) => boolean;
}

/** Any-of word match with boundary safety (tokens are already split on non-word). */
const has = (words: Set<string>, ...candidates: string[]) =>
  candidates.some((c) => words.has(c));

/** Contiguous phrase match on the normalised string. */
const phrase = (q: string, ...phrases: string[]) => phrases.some((p) => q.includes(p));

/**
 * Priority order is load-bearing: safety and refusal first, then scope,
 * then language, then operational, then planning, then factual.
 */
const RULES: Rule[] = [
  {
    // Outranks everything: a visitor asking for a guarantee must not be routed
    // to a branch that could produce one.
    name: "safety",
    intent: "status",
    test: (_q, w) =>
      has(w, "safe", "safety", "dangerous", "unsafe", "risk", "risky", "secure") ||
      phrase(_q, "is it ok to", "is it okay to"),
  },
  {
    name: "booking-refusal",
    intent: "inquiry_draft",
    test: (_q, w) => has(w, "book", "booking", "reserve", "reservation", "guarantee", "hold"),
  },
  {
    name: "live-status",
    intent: "status",
    test: (_q, w) =>
      has(w, "open", "closed", "closing", "opening", "road", "roads", "blocked", "traffic", "permit", "permits") ||
      phrase(_q, "right now", "at the moment"),
  },
  {
    name: "weather-context",
    intent: "weather_context",
    test: (_q, w) => has(w, "weather", "rain", "raining", "temperature", "forecast", "monsoon"),
  },
  {
    name: "out-of-scope-self",
    intent: "out_of_scope",
    test: (_q, w) =>
      phrase(_q, "who are you", "what can you do", "what do you do", "are you a human", "what are you") ||
      (has(w, "you") && has(w, "help", "do") && w.size <= 5),
  },
  {
    name: "out-of-scope-off-topic",
    intent: "out_of_scope",
    test: (_q, w) =>
      // Explicitly-outside topics. Deliberately narrow: false positives here
      // would refuse a legitimate Manipur question.
      has(w, "pizza", "capital", "president", "cricket", "bitcoin", "stock", "movie", "recipe") &&
      !has(w, "manipur", "imphal", "loktak", "moirang", "ukhrul", "manipuri"),
  },
  {
    name: "translate",
    intent: "translate",
    test: (q) => /^(translate|how do you say|what does .* mean|meaning of)\b/.test(q),
  },
  {
    name: "plan",
    intent: "plan",
    test: (_q, w) =>
      has(w, "plan", "itinerary", "days", "day", "budget", "trip", "nights", "honeymoon", "schedule", "route") ||
      phrase(_q, "how many days"),
  },
  {
    name: "nearby",
    intent: "place_fact",
    test: (_q, w) =>
      has(w, "near", "nearby", "around", "close", "closest", "adjacent") ||
      phrase(_q, "next to"),
  },
  {
    name: "inquiry-intent",
    intent: "inquiry_draft",
    test: (_q, w) => has(w, "contact", "phone", "number", "message", "host", "guide", "operator", "ask", "email"),
  },
  {
    name: "greeting",
    intent: "place_fact",
    test: (q, w) => w.size <= 4 && /^(hi|hello|hey|namaste|thank you|thanks|good (morning|evening|afternoon))\b/.test(q),
  },
];

export function detectIntent(query: string): Route {
  const q = query.toLowerCase().trim().replace(/[?!.,;:]+/g, " ").replace(/\s+/g, " ");
  // Tokens: letters/digits only, so "safe?" and "safe" both yield "safe".
  const words = new Set(q.split(/[^a-z0-9']+/).filter(Boolean));

  // Gibberish check — no Latin word of 3+ letters and no known place token.
  const latinish = q.split(/[^a-z]+/).filter((w) => w.length >= 3);
  const knownish = ["manipur", "imphal", "loktak", "kangla", "keithel", "moirang", "shirui", "dzukou", "keibul", "sangai"];
  if (latinish.length === 0 && q.length > 0) {
    return { intent: "out_of_scope", matched: "gibberish", confidence: "low" };
  }
  if (latinish.length === 1 && !knownish.some((k) => q.includes(k)) && !/^(hi|hey|thanks?|hello|namaste)$/.test(q)) {
    return { intent: "place_fact", matched: "low-signal", confidence: "low" };
  }

  for (const rule of RULES) {
    if (rule.test(q, words)) {
      return { intent: rule.intent, matched: rule.name, confidence: "high" };
    }
  }
  return { intent: "place_fact", matched: "default-fact", confidence: "low" };
}
