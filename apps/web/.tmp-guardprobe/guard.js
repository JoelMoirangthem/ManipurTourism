// Guard — output validation for assistant answers (R29, ADR-09).
//
// GAP FIXED: the previous check only asked "does this claim ID exist in the
// bundle?" That passes a citation attached to an unrelated sentence. Three
// checks now run, and any failure falls back to the deterministic template:
//
//   1. Structure  — every [c-...] ID must exist in the bundle (old check)
//   2. Support    — the sentence carrying a citation must actually overlap the
//                   cited claim's text, or be a listing sentence about a place
//                   that owns the claim
//   3. Prohibited — no guarantee / booking / safety-certification language
import { fieldClass, projectFreshness } from "./domain.js";
const STOPWORDS = new Set([
    "the", "a", "an", "and", "or", "of", "to", "in", "on", "at", "for", "with",
    "is", "are", "was", "were", "be", "been", "it", "this", "that", "these",
    "those", "as", "by", "from", "its", "has", "have", "had", "not", "but",
]);
function tokens(s) {
    return new Set(s
        .toLowerCase()
        .replace(/\[[^\]]*\]/g, " ")
        .replace(/[^a-z0-9\u0900-\u097F\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOPWORDS.has(w)));
}
function overlap(a, b) {
    let n = 0;
    for (const w of a)
        if (b.has(w))
            n++;
    return n;
}
/** Sentences with the citations they carry. */
export function citedSentences(answer) {
    const flat = answer.replace(/[’‘]/g, "'").replace(/\n+/g, " ");
    return flat
        .split(/(?<=[.!?])\s+/)
        .map((s) => ({ sentence: s.trim(), ids: [...s.matchAll(/\[(c-[\w-]+)\]/g)].map((m) => m[1]) }))
        .filter((s) => s.sentence.length > 0);
}
// Prohibited-claim patterns. Negated sentences are legitimate refusals
// ("I can't guarantee..."), so negation is checked first, per sentence.
const NEGATION = /can'?t|cannot|won'?t|don'?t|never|\bnot\b|\bno\b|whether|\?|only|var(y|ies)|unknown|unable|impossible/i;
const PROHIBITED = [
    { rx: /\bguarantee/i, label: "guarantee" },
    { rx: /\bbooked for you\b/i, label: "booking-claim" },
    { rx: /\breservation (is )?confirmed\b/i, label: "reservation-claim" },
    { rx: /\breserved (a|your) (room|stay)\b/i, label: "reservation-claim" },
    { rx: /\bcertified safe\b/i, label: "safety-certification" },
    { rx: /\bdefinitely safe\b/i, label: "safety-certification" },
    { rx: /\b100% safe\b/i, label: "safety-certification" },
    { rx: /\bit is safe to\b/i, label: "safety-certification" },
    { rx: /\bcurrently available\b/i, label: "live-inventory-claim" },
    { rx: /\b\d+ rooms? (are )?(free|available) (now|tonight|today)\b/i, label: "live-inventory-claim" },
];
export function prohibitedClaims(answer) {
    const hits = [];
    for (const { sentence } of citedSentences(answer)) {
        if (NEGATION.test(sentence))
            continue;
        for (const p of PROHIBITED)
            if (p.rx.test(sentence))
                hits.push(p.label);
    }
    return [...new Set(hits)];
}
/**
 * Stale-evidence check: the answer must not present an expired operational fact
 * as a present-tense truth (R18).
 *
 * Careful: this only fires when the sentence ASSERTS something. A hedged
 * sentence that already tells the reader the figure is undated is correct
 * behaviour, not a violation — flagging it caused a template fallback on good
 * answers. `expired` still applies to hedged sentences, because a stale price
 * is wrong even when flagged; `unknown` does not.
 */
export function staleOperationalClaims(answer, bundle, now = new Date()) {
    const hits = [];
    const byId = new Map();
    for (const place of bundle.places) {
        for (const claim of place.claims)
            byId.set(claim.id, { claim, place });
    }
    // Sentences that already disclaim the figure are safe regardless of freshness.
    // This list is deliberately broad: a hedged sentence is the CORRECT behaviour,
    // and over-flagging it forces a worse template answer. Phrases below were
    // observed in real model output via scripts/debug-guard.mjs.
    const HEDGED = /unconfirm|undated|not confirm|no observation date|not recorded|not listed|no record|isn'?t recorded|out of date|possibly out of date|treat as unverified|ask (the provider|directly|again)|contact (them|the)|expired|may (have )?chang|check (with|before)|verify|vary|varies|var(y|ies) by|so check|cannot confirm|can'?t confirm|unknown|not stated|no verified|directly with|official sources/i;
    const OPERATIONAL = /prices?|fees?|tariff|₹|rupee|open|opening|hours|available|availability|capacity|rooms?/i;
    const seen = new Set();
    for (const { sentence, ids } of citedSentences(answer)) {
        if (!OPERATIONAL.test(sentence))
            continue;
        const hedged = HEDGED.test(sentence);
        for (const id of ids) {
            const entry = byId.get(id);
            if (!entry)
                continue;
            // Only DECAYING fields can mislead by being stale. A structural claim
            // (a lake's identity, a property's listed size, a coordinate) is not an
            // operational promise, so an undated one is not a violation — the UI
            // still labels it undated so the reader can weigh it.
            if (fieldClass(entry.claim.fieldKey) === "structural")
                continue;
            const fresh = projectFreshness(entry.claim, now);
            // `unknown` on a hedged sentence is the correct outcome, not a violation.
            const violating = fresh === "expired" || (fresh === "unknown" && !hedged);
            if (!violating)
                continue;
            const key = `${id}:${fresh}`;
            if (seen.has(key))
                continue; // report each claim once, not once per sentence
            seen.add(key);
            hits.push(key);
        }
    }
    return hits;
}
/**
 * Support check: can the cited claim actually back this sentence?
 *
 * A citation supports a sentence when any of these hold:
 *   (a) content-word overlap with the claim text clears a small floor, OR
 *   (b) the sentence mentions a distinctive token of the owning place's name
 *       ("Keibul Lamjao" satisfies "Keibul Lamjao National Park"), OR
 *   (c) the sentence is a source/attribution line rather than an assertion.
 *
 * The failure we care about is a citation bolted onto a concrete factual
 * assertion the claim does not contain — not a partial place-name match.
 */
export function unsupportedCitations(answer, bundle) {
    const byId = new Map();
    for (const place of bundle.places) {
        for (const claim of place.claims)
            byId.set(claim.id, { claim, place });
    }
    // Attribution lines: "Sources: [c-...]", "Source —", "cited from", etc.
    const ATTRIBUTION = /^\s*(sources?|cited|from|reference|attribution)\b\s*[:\-—]/i;
    // Qualifying / epistemic sentences cite a claim to say what the RECORD does
    // or does not establish, e.g. "The records do not give prices ... [c-x]".
    // These are correct behaviour and carry inherently low lexical overlap with
    // the claim text, so overlap-gating them produces false rejections.
    const QUALIFYING = /\b(record|records|unknown|not (give|state|listed|recorded|confirm)|no (data|information|record)|freshness|do(es)? not|cannot confirm|can'?t confirm|unconfirm|verify|confirm|check|ask|vary|varies|unverified|out of date|expired)\b/i;
    // Distinctive place tokens: words from the place name that are not generic
    // geography/type words, so "Keibul Lamjao" counts but "Park" does not.
    const GENERIC = new Set([
        "national", "park", "lake", "fort", "market", "resort", "valley", "peak",
        "complex", "memorial", "hills", "hill", "island", "the", "of",
    ]);
    const distinctive = (name) => new Set(name
        .toLowerCase()
        .split(/[^a-z0-9']+/)
        .filter((w) => w.length > 2 && !GENERIC.has(w)));
    const bad = [];
    for (const { sentence, ids } of citedSentences(answer)) {
        if (ids.length === 0)
            continue;
        if (ATTRIBUTION.test(sentence))
            continue; // (c)
        // A sentence that only describes what the record does/doesn't say cannot
        // assert unsupported content — nothing concrete is being claimed.
        if (QUALIFYING.test(sentence))
            continue;
        const sTok = tokens(sentence);
        for (const id of ids) {
            const entry = byId.get(id);
            if (!entry) {
                bad.push(`${id}:not-in-bundle`);
                continue;
            }
            const claimText = [entry.claim.valueText ?? "", entry.claim.fieldKey, entry.place.name].join(" ");
            const cTok = tokens(claimText);
            // (b) distinctive place-name token present.
            const namesPlace = overlap(distinctive(entry.place.name), sTok) > 0;
            // (a) content overlap with the claim text.
            const enough = overlap(sTok, cTok) >= (namesPlace ? 1 : 3);
            if (!namesPlace && !enough)
                bad.push(`${id}:weak-support`);
        }
    }
    return [...new Set(bad)];
}
/** All three checks. Callers throw / fall back when `ok` is false. */
export function validateAnswer(answer, bundle, now = new Date()) {
    const reasons = [];
    const missing = unsupportedCitations(answer, bundle);
    if (missing.length)
        reasons.push(...missing.map((m) => `unsupported-citation:${m}`));
    const prohibited = prohibitedClaims(answer);
    if (prohibited.length)
        reasons.push(...prohibited.map((p) => `prohibited:${p}`));
    const stale = staleOperationalClaims(answer, bundle, now);
    if (stale.length)
        reasons.push(...stale.map((s) => `stale-as-current:${s}`));
    return { ok: reasons.length === 0, reasons };
}
