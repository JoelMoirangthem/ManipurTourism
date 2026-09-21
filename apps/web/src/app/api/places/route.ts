import { NextRequest } from "next/server";
import { seedRetriever } from "@/lib/adapters";
import { capacityWording } from "@/lib/domain";

// GET /api/places?q=&district=&category=&limit=
// GET /api/places?near=lat,lng&radius_km=20
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const near = url.searchParams.get("near");
  const radiusKm = Number(url.searchParams.get("radius_km") ?? "20");

  if (near) {
    const [latS, lngS] = near.split(",");
    const lat = Number(latS);
    const lng = Number(lngS);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return Response.json({ error: "near must be 'lat,lng'" }, { status: 400 });
    }
    const results = await seedRetriever.nearby(lat, lng, radiusKm);
    return Response.json({
      results: results.map((r) => ({
        id: r.place.id,
        name: r.place.name,
        district: r.place.district,
        category: r.place.category,
        tagline: r.place.tagline,
        lat: r.place.lat,
        lng: r.place.lng,
        photo: r.place.photos[0]?.storageKey ?? null,
        distanceKm: Math.round(r.distanceKm * 10) / 10,
        coordNote: r.place.coordSource ? "Map location approximate — transfers unverified." : null,
        capacity: capacityWording(r.place),
      })),
    });
  }

  const q = url.searchParams.get("q") ?? "";
  const district = url.searchParams.get("district") ?? undefined;
  const category = url.searchParams.get("category") ?? undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "24") || 24, 50);
  const places = await seedRetriever.searchPlaces(q, { district, category, limit });

  // Facets let the catalogue filter without fetching everything.
  const all = await seedRetriever.listAll();
  return Response.json({
    places: places.map((p) => ({
      id: p.id,
      name: p.name,
      district: p.district,
      category: p.category,
      summary: p.summary,
      tagline: p.tagline,
      capacity: capacityWording(p),
      photo: p.photos[0]?.storageKey ?? null,
      photoAttribution: p.photos[0]?.attribution ?? null,
      claimsCount: p.claims.length,
    })),
    facets: {
      districts: [...new Set(all.map((p) => p.district))].sort(),
      categories: [...new Set(all.map((p) => p.category))].sort(),
    },
    count: places.length,
  });
}
