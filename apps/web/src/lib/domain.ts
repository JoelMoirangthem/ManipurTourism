// Domain — pure functions. No LLM, no I/O, no Date.now() except via args.
// Budget in integer minor units (paise). Trust projection per data-model §5.
//
// INVARIANT (R14/R18): "reviewed" is NOT "fresh". A claim can be approved AND
// expired. Never derive freshness from reviewState — they are orthogonal axes.

import type { PlaceClaim, PlaceRecord } from "./ports";

// ---------- budget.ts ----------
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export interface BudgetLine {
  label: string;
  amountPaise: number;
}

export interface BudgetResult {
  lines: BudgetLine[];
  totalPaise: number;
  includes: string;
  excludes: string;
}

export function computeBudget(lines: BudgetLine[], includes: string, excludes: string): BudgetResult {
  const totalPaise = lines.reduce((sum, l) => sum + l.amountPaise, 0);
  return { lines, totalPaise, includes, excludes };
}

export function formatINR(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

// ---------- trust.ts ----------
// Two orthogonal axes. Review answers "was this checked?"; freshness answers
// "is it still true as of the valid time?" Both are shown to the visitor.

export type ReviewState = "approved" | "pending_review" | "rejected" | "unknown";
export type Freshness = "current" | "stale" | "expired" | "unknown" | "conflict";

/**
 * Freshness from the claim's own valid time — the ONLY correct source.
 * `validUntil` wins when present; otherwise age from `observedAt` is bucketed
 * against the field's shelf life. No date information => `unknown`, never `current`.
 */
export function projectFreshness(
  claim: Pick<PlaceClaim, "fieldKey" | "observedAt" | "validUntil" | "reviewState">,
  now: Date = new Date()
): Freshness {
  if (claim.reviewState === "rejected") return "expired";
  if (claim.validUntil) {
    const until = new Date(claim.validUntil);
    if (Number.isNaN(until.getTime())) return "unknown";
    return until.getTime() > now.getTime() ? "current" : "expired";
  }
  if (!claim.observedAt) return "unknown";
  const observed = new Date(claim.observedAt);
  if (Number.isNaN(observed.getTime())) return "unknown";
  const ageDays = (now.getTime() - observed.getTime()) / 86_400_000;
  if (ageDays < 0) return "unknown";
  const shelfLife = shelfLifeDays(claim.fieldKey);
  if (ageDays <= shelfLife * 0.5) return "current";
  if (ageDays <= shelfLife) return "stale";
  return "expired";
}

/**
 * Field classes. This distinction matters for the guard: a DECAYING field can
 * go stale and mislead if presented unhedged, whereas a STRUCTURAL field cannot
 * — a lake is still the largest in the region whether or not we recorded when
 * we read that, and a directory room count is a property attribute, not a
 * statement about tonight.
 */
export type FieldClass = "decaying" | "structural";

export function fieldClass(fieldKey: string): FieldClass {
  switch (fieldKey) {
    // Structural: identity/description/geography/property size.
    case "description":
    case "coordinates":
    case "published_capacity":
      return "structural";
    // Decaying: anything a traveller acts on operationally.
    case "entry_fee":
    case "opening_hours":
    case "contact":
    case "price":
    case "availability":
      return "decaying";
    default:
      return "decaying";
  }
}

/**
 * Shelf life per field, from data-governance §5. Operational fields decay fast;
 * descriptive/geographic fields decay slowly. Unknown fields are treated as
 * short-lived so the UI under-claims rather than over-claims.
 */
export function shelfLifeDays(fieldKey: string): number {
  switch (fieldKey) {
    case "published_capacity":
      return 180;
    case "description":
      return 1095;
    case "coordinates":
      return 3650;
    case "entry_fee":
    case "opening_hours":
    case "contact":
      return 90;
    default:
      return 90;
  }
}

export function reviewLabel(state: string): string {
  switch (state) {
    case "approved":
      return "reviewed";
    case "pending_review":
      return "awaiting review";
    case "rejected":
      return "rejected";
    default:
      return "not reviewed";
  }
}

export interface TrustBadge {
  text: string;
  tone: "ok" | "warn" | "bad" | "muted";
}

/** Combined, human-readable trust line. Both axes visible, never merged. */
export function trustBadge(
  claim: Pick<PlaceClaim, "fieldKey" | "observedAt" | "validUntil" | "reviewState">,
  now: Date = new Date()
): TrustBadge {
  const fresh = projectFreshness(claim, now);
  const reviewed = reviewLabel(claim.reviewState);
  const map: Record<Freshness, { text: string; tone: TrustBadge["tone"] }> = {
    current: { text: "current", tone: "ok" },
    stale: { text: "possibly out of date", tone: "warn" },
    expired: { text: "out of date — re-confirm", tone: "bad" },
    conflict: { text: "sources disagree", tone: "bad" },
    unknown: { text: "undated — treat as unverified", tone: "muted" },
  };
  const f = map[fresh];
  return { text: `${f.text} · ${reviewed}`, tone: f.tone };
}

// ---------- capacity ----------
// Capacity ≠ availability (R20). The directory count is a published property
// size, never a statement that anything is free tonight.
export function capacityWording(place: PlaceRecord): string {
  const cap = place.claims.find((c) => c.fieldKey === "published_capacity");
  if (!cap?.valueText) {
    return "Capacity unlisted; availability unconfirmed — ask the provider for your dates.";
  }
  const fresh = projectFreshness(cap);
  const ageNote =
    fresh === "current" || fresh === "stale"
      ? ""
      : " (directory figure, undated)";
  return `Official directory lists ${cap.valueText}; current availability unconfirmed${ageNote}.`;
}

// ---------- planner.ts ----------
export interface TripBrief {
  nights: number;
  groupSize: number;
  interests: string[];
  budgetPaise: number | null;
  budgetIncludes: string | null;
}

export interface PlanLeg {
  placeId: string;
  name: string;
  district: string;
  category: string;
  nights: number;
}

export interface PlanDraft {
  title: string;
  placeIds: string[];
  /** Resolved display legs — the API surface must never leak bare slugs. */
  legs: PlanLeg[];
  nightsPerStop: Record<string, number>;
  notes: string[];
  missing: string[];
}

/**
 * Deterministic draft builder. Ordering is a stable function of district and
 * category only — no randomness, no LLM, no clock. Same brief => same drafts.
 *
 * NIGHTS ARITHMETIC (fixed): the stop count is capped so the schedule can never
 * require more nights than the visitor has. A 2-night trip gets 2 stops, not 5
 * stops of one night each. Every night is accounted for exactly once, and the
 * remainder goes to the earlier stops.
 */
export function buildDrafts(brief: TripBrief, candidates: PlaceRecord[]): PlanDraft[] {
  const toLeg = (p: PlaceRecord, nights: number): PlanLeg => ({
    placeId: p.id,
    name: p.name,
    district: p.district,
    category: p.category,
    nights,
  });

  const spread = (items: PlaceRecord[]): { legs: PlanLeg[]; nightsPerStop: Record<string, number> } => {
    const nightsPerStop: Record<string, number> = {};
    // Never schedule more stops than there are nights to sleep in them.
    const usable = items.slice(0, Math.max(1, brief.nights));
    if (usable.length === 0) return { legs: [], nightsPerStop };
    const base = Math.floor(brief.nights / usable.length);
    const rest = brief.nights % usable.length;
    return {
      legs: usable.map((p, i) => {
        const n = base + (i < rest ? 1 : 0);
        nightsPerStop[p.id] = n;
        return toLeg(p, n);
      }),
      nightsPerStop,
    };
  };

  const lakeside = candidates.filter((p) => /bishnupur/i.test(p.district));
  const elsewhere = candidates.filter((p) => !/bishnupur/i.test(p.district));

  const base = [...elsewhere.slice(0, 3), ...lakeside.slice(0, 2)];
  const lakeFirst = [...lakeside.slice(0, 3), ...elsewhere.slice(0, 2)];

  const missing = [
    "Accommodation replies for your exact dates",
    "Activity operating hours for your dates",
    "Transfer times between stops (unverified)",
  ];

  const drafts: PlanDraft[] = [];

  if (base.length > 0) {
    const { legs, nightsPerStop } = spread(base);
    drafts.push({
      title: "Imphal base + lake day trip",
      placeIds: legs.map((l) => l.placeId),
      legs,
      nightsPerStop,
      notes: [
        `Draft for ${brief.nights} night(s), group of ${brief.groupSize}, across ${legs.length} stop(s).`,
        "Base in Imphal avoids committing to lakeside capacity before confirmation.",
        brief.nights < base.length
          ? `Only the first ${legs.length} stop(s) are scheduled because you have ${brief.nights} night(s) — increase nights to include the rest.`
          : "",
      ].filter(Boolean),
      missing,
    });
  }

  if (lakeFirst.length > 0 && lakeFirst[0]?.id !== base[0]?.id) {
    const { legs, nightsPerStop } = spread(lakeFirst);
    drafts.push({
      title: "Lake-focused tentative order",
      placeIds: legs.map((l) => l.placeId),
      legs,
      nightsPerStop,
      notes: [
        "Suggested order only — not a timed itinerary; transfers unverified.",
        "Do not book travel around a Sendra night until a host replies for your dates.",
      ],
      missing,
    });
  }

  return drafts;
}

/**
 * Budget lines derived from a draft. Every amount traces to a source or is
 * labelled declared.
 *
 * Stay lines are deliberately ₹0: a nightly rate cannot be derived from an
 * undated directory capacity figure without inventing it (R20/R23). They exist
 * so the visitor can see WHICH lines are still unpriced, not to imply they cost
 * nothing.
 */
export function draftBudgetLines(draft: PlanDraft, candidates: PlaceRecord[]): BudgetLine[] {
  const stayNights = Object.values(draft.nightsPerStop).reduce((a, b) => a + b, 0);
  const lines: BudgetLine[] = [
    { label: `Nights to confirm (${stayNights})`, amountPaise: 0 },
  ];
  for (const leg of draft.legs) {
    const place = candidates.find((p) => p.id === leg.placeId);
    const cap = place?.claims.find((c) => c.fieldKey === "published_capacity");
    lines.push({
      label: `${leg.name} — ${leg.nights} night(s)${cap?.valueText ? ` (listed ${cap.valueText})` : ""}`,
      amountPaise: 0,
    });
  }
  return lines;
}
