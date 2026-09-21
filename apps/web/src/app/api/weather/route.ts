import { seedRetriever, fetchWeather } from "@/lib/adapters";

// GET /api/weather?placeId= — model snapshot with valid time, context only.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const place = await seedRetriever.getPlace(url.searchParams.get("placeId") ?? "");
  if (!place) return Response.json({ error: "Place not found" }, { status: 404 });
  if (place.lat == null || place.lng == null) {
    return Response.json({ error: "No coordinates for this place" }, { status: 404 });
  }
  try {
    const snapshot = await fetchWeather(place.lat, place.lng);
    return Response.json({
      placeId: place.id,
      snapshot,
      note: "Forecast/model context for the valid time shown. Rain does not mean closed boating; no warning does not imply safe.",
    });
  } catch {
    return Response.json({ error: "Weather unavailable right now" }, { status: 502 });
  }
}
