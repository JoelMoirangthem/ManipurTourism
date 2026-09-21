import { z } from "zod";
import { seedRetriever } from "@/lib/adapters";
import { buildDrafts, computeBudget, draftBudgetLines, formatINR } from "@/lib/domain";

const Brief = z.object({
  nights: z.number().int().min(1).max(30),
  groupSize: z.number().int().min(1).max(50),
  interests: z.array(z.string()).default([]),
  budgetRupees: z.number().min(0).nullable().default(null),
  budgetIncludes: z.string().nullable().default(null),
  query: z.string().default(""),
});

// POST /api/plan — deterministic drafts + budget arithmetic in code (ADR-03).
//
// GAP FIXED: the response previously returned `places: d.placeIds`, so the UI
// rendered raw slugs like "sendra-resort" instead of "Sendra Resort". Drafts now
// carry resolved legs.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = Brief.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid brief", details: parsed.error.flatten() }, { status: 400 });
  }
  const b = parsed.data;
  // A total without a stated basis is a meaningless number, so refuse it.
  if (b.budgetRupees != null && !b.budgetIncludes) {
    return Response.json(
      { error: "State what the budget includes (e.g. stay-only vs all-costs) before a total is computed." },
      { status: 400 }
    );
  }

  const searchTerm = b.query || b.interests.join(" ");
  const candidates = searchTerm
    ? await seedRetriever.searchPlaces(searchTerm, { limit: 8 })
    : await seedRetriever.searchPlaces("", { limit: 8 });

  const drafts = buildDrafts(
    {
      nights: b.nights,
      groupSize: b.groupSize,
      interests: b.interests,
      budgetPaise: b.budgetRupees != null ? Math.round(b.budgetRupees * 100) : null,
      budgetIncludes: b.budgetIncludes,
    },
    candidates
  );

  if (drafts.length === 0) {
    return Response.json({ drafts: [], budget: null, warning: "No candidate places matched that brief — try a place name or clear the filter." });
  }

  // Invariant: a draft may never schedule more nights than the visitor has.
  // buildDrafts caps the stop count, so a violation here is a code defect and
  // must fail loudly rather than ship a plan that invents an extra night.
  for (const d of drafts) {
    const scheduled = Object.values(d.nightsPerStop).reduce((a, b) => a + b, 0);
    if (scheduled !== b.nights) {
      return Response.json(
        {
          error: `Planner invariant violated: ${d.title} schedules ${scheduled} night(s) for a ${b.nights}-night trip.`,
        },
        { status: 500 }
      );
    }
  }

  // Budget: stay costs are deliberately NOT invented. The arithmetic shows what
  // the visitor declared and which lines remain unpriced, rather than guessing a
  // nightly rate from an undated directory figure (R20/R23).
  const budget =
    b.budgetRupees != null
      ? computeBudget(
          [
            { label: "Visitor-declared trip budget", amountPaise: Math.round(b.budgetRupees * 100) },
            ...draftBudgetLines(drafts[0], candidates),
          ],
          b.budgetIncludes!,
          "Transport, food, fees and stay breakdowns need host-confirmed quotes."
        )
      : null;

  return Response.json({
    drafts: drafts.map((d) => ({
      title: d.title,
      legs: d.legs,
      placeIds: d.placeIds,
      nights: d.nightsPerStop,
      notes: d.notes,
      missing: d.missing,
    })),
    budget: budget
      ? {
          total: formatINR(budget.totalPaise),
          includes: budget.includes,
          excludes: budget.excludes,
          lines: budget.lines.map((l) => ({ label: l.label, amount: formatINR(l.amountPaise) })),
        }
      : null,
    warning:
      "Tentative drafts only — availability, prices, hours and transfers unconfirmed. Nothing is held. Ask the provider for your dates.",
  });
}
