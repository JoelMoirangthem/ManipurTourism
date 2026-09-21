// Brief parser — pure, deterministic, dependency-free. Turns a visitor's
// plain words into a tentative trip brief for /api/plan. Never invents:
// anything not stated stays null/empty, and a budget without a stated basis
// keeps budgetIncludes null so the UI must ask before calling the API.

export interface ParsedBrief {
  nights: number | null;
  groupSize: number | null;
  interests: string[];
  budgetRupees: number | null;
  budgetIncludes: null;
}

const INTEREST_KEYWORDS: Array<{ interest: string; words: string[] }> = [
  { interest: "Lake", words: ["lake", "loktak", "sendra", "phumdi", "boat"] },
  { interest: "Heritage", words: ["heritage", "fort", "kangla", "history", "culture", "museum", "temple", "palace"] },
  { interest: "Market", words: ["market", "bazaar", "shopping", "keithel", "handloom", "craft"] },
  { interest: "Trek", words: ["trek", "trekking", "hike", "hiking", "hills", "shirui", "dzukou", "valley", "peak"] },
  { interest: "National Park", words: ["national park", "wildlife", "sangai", "keibul", "safari", "deer"] },
  { interest: "Stay", words: ["stay", "hotel", "resort", "room", "rooms", "night halt", "accommodation"] },
];

function clampInt(n: number, min: number, max: number): number | null {
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  if (i < min || i > max) return null;
  return i;
}

export function parseBrief(text: string): ParsedBrief {
  const q = ` ${text.toLowerCase()} `;

  let nights: number | null = null;
  const nightMatch = q.match(/(\d+)\s*[-–]?\s*(day|days|night|nights)\b/);
  if (nightMatch) nights = clampInt(Number(nightMatch[1]), 1, 30);

  let groupSize: number | null = null;
  const groupMatch =
    q.match(/group of (\d+)/) ??
    q.match(/we are (\d+)/) ??
    q.match(/(\d+)\s*(people|persons|guests|members|travellers|travelers|friends|family members)\b/);
  if (groupMatch) groupSize = clampInt(Number(groupMatch[1]), 1, 50);

  let budgetRupees: number | null = null;
  // Only treat a figure as a budget when budget language is nearby.
  if (/\b(budget|under|within|around|bachat|rupees|rs\.?|₹)\b/.test(q)) {
    const moneyMatch = q.match(/₹\s?([\d,]+)/) ?? q.match(/\brs\.?\s?([\d,]+)/) ?? q.match(/\b([\d,]{4,})\b/);
    if (moneyMatch) {
      const value = Number(moneyMatch[1].replace(/,/g, ""));
      if (Number.isFinite(value) && value > 0 && value <= 10000000) budgetRupees = Math.round(value);
    }
  }

  const interests: string[] = [];
  for (const { interest, words } of INTEREST_KEYWORDS) {
    if (words.some((w) => q.includes(w)) && !interests.includes(interest)) interests.push(interest);
  }

  return { nights, groupSize, interests, budgetRupees, budgetIncludes: null };
}

export function missingBriefFields(brief: {
  nights: number | null;
  groupSize: number | null;
  budgetRupees: number | null;
  budgetIncludes: string | null;
}): string[] {
  const missing: string[] = [];
  if (brief.nights == null) missing.push("nights");
  if (brief.groupSize == null) missing.push("group size");
  if (brief.budgetRupees != null && brief.budgetIncludes == null) missing.push("budget basis");
  return missing;
}

export function briefComplete(brief: {
  nights: number | null;
  groupSize: number | null;
  budgetRupees: number | null;
  budgetIncludes: string | null;
}): boolean {
  return missingBriefFields(brief).length === 0;
}
