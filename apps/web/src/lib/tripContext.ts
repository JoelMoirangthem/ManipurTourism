// apps/web/src/lib/tripContext.ts — browser-persisted trip context. Dates and
// travellers are context only, never live inventory.
export interface TripContext {
  destination: string;
  checkIn: string;
  checkOut: string;
  travellers: number;
  interests: string[];
}

export const EMPTY_TRIP: TripContext = { destination: "", checkIn: "", checkOut: "", travellers: 2, interests: [] };
const TRIP_KEY = "mit_trip_context_v1";

export function readTripContext(): TripContext {
  if (typeof window === "undefined") return { ...EMPTY_TRIP };
  try {
    const raw = window.localStorage.getItem(TRIP_KEY);
    if (!raw) return { ...EMPTY_TRIP };
    const parsed = JSON.parse(raw) as Partial<TripContext>;
    return {
      destination: typeof parsed.destination === "string" ? parsed.destination : "",
      checkIn: typeof parsed.checkIn === "string" ? parsed.checkIn : "",
      checkOut: typeof parsed.checkOut === "string" ? parsed.checkOut : "",
      travellers: typeof parsed.travellers === "number" && parsed.travellers >= 1 && parsed.travellers <= 50 ? Math.floor(parsed.travellers) : 2,
      interests: Array.isArray(parsed.interests) ? parsed.interests.filter((i): i is string => typeof i === "string") : [],
    };
  } catch {
    return { ...EMPTY_TRIP };
  }
}

export function writeTripContext(patch: Partial<TripContext>): TripContext {
  const next = { ...readTripContext(), ...patch };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(TRIP_KEY, JSON.stringify(next));
    } catch {
      /* storage inaccessible — context simply will not persist */
    }
  }
  return next;
}

export function tripToPlacesParams(trip: TripContext): string {
  const params = new URLSearchParams();
  if (trip.destination) params.set("district", trip.destination);
  if (trip.checkIn) params.set("checkIn", trip.checkIn);
  if (trip.checkOut) params.set("checkOut", trip.checkOut);
  const query = params.toString();
  return query ? `/places?${query}` : "/places";
}
