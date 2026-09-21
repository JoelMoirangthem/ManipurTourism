import { seedRetriever } from "@/lib/adapters";

// GET /api/health — real dependency probe, not a placeholder.
// GAP FIXED: the previous version called searchPlaces("") which returned [] for
// an empty query, so `count` was always 0 regardless of corpus state.
export async function GET() {
  const places = await seedRetriever.listAll();
  const withClaims = places.filter((p) => p.claims.length > 0).length;
  return Response.json({
    ok: places.length > 0,
    corpus: { places: places.length, withClaims },
    config: {
      llm: Boolean(process.env.AGENTROUTER_API_KEY),
      translate: Boolean(process.env.GEMINI_API_KEY || process.env.SARVAM_API_KEY),
      database: Boolean(process.env.DATABASE_URL),
    },
    note: "Runs on bundled seed fixtures. Postgres/PostGIS is Phase 1.",
    time: new Date().toISOString(),
  });
}
