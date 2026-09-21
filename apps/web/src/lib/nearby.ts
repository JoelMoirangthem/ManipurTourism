// src/lib/nearby.ts — pure helpers for the nearby map.
// Client-safe: no server imports, no secrets.

export const IMPHAL_CENTER = { lat: 24.8107515, lng: 93.9386097 };

export function buildNearbyQuery(lat: number, lng: number, radiusKm: number): string {
  return `/api/places?near=${lat},${lng}&radius_km=${radiusKm}`;
}

/**
 * Google Maps universal link that opens real turn-by-turn driving
 * navigation (app on mobile, maps site on desktop). No API key needed —
 * turn-by-turn only exists inside Google's own app, never embedded.
 */
export function buildNavigateUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

export function formatDistanceKm(d: number): string {
  return `${(Math.round(d * 10) / 10).toFixed(1)} km`;
}

export function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
