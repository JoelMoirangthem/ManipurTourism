import { seedRetriever } from "@/lib/adapters";
import { capacityWording, projectFreshness, reviewLabel, shelfLifeDays, trustBadge } from "@/lib/domain";

// GET /api/places/[id] — Next 16: params is async.
// Each claim carries its reviewed/current axes separately so the UI can render
// them without recomputing policy.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const place = await seedRetriever.getPlace(id);
  if (!place) return Response.json({ error: "Place not found" }, { status: 404 });
  return Response.json({
    ...place,
    capacity: capacityWording(place),
    coordNote: place.coordSource ? "Map location approximate — transfers unverified." : null,
    claims: place.claims.map((c) => ({
      ...c,
      freshness: projectFreshness(c),
      reviewed: reviewLabel(c.reviewState),
      shelfLifeDays: shelfLifeDays(c.fieldKey),
      badge: trustBadge(c),
    })),
  });
}
