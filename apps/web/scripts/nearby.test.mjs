import { describe, it } from "node:test";
import assert from "node:assert/strict";

// RED: this import must fail until src/lib/nearby.ts exists
import {
  IMPHAL_CENTER,
  buildNearbyQuery,
  buildNavigateUrl,
  formatDistanceKm,
  isValidLatLng,
} from "../src/lib/nearby.ts";

describe("nearby lib (TDD slice 1)", () => {
  it("exposes Imphal fallback centre near validated geocode", () => {
    assert.ok(Math.abs(IMPHAL_CENTER.lat - 24.8107) < 0.05);
    assert.ok(Math.abs(IMPHAL_CENTER.lng - 93.9386) < 0.05);
  });

  it("builds /api/places?near= query", () => {
    const q = buildNearbyQuery(24.81, 93.93, 50);
    assert.equal(q, "/api/places?near=24.81,93.93&radius_km=50");
  });

  it("formats distances", () => {
    assert.equal(formatDistanceKm(0.46), "0.5 km");
    assert.equal(formatDistanceKm(12.34), "12.3 km");
  });

  it("validates lat/lng", () => {
    assert.equal(isValidLatLng(24.8, 93.9), true);
    assert.equal(isValidLatLng(NaN, 93.9), false);
    assert.equal(isValidLatLng(100, 200), false);
  });

  it("builds a Google Maps driving universal link", () => {
    assert.equal(
      buildNavigateUrl(24.807, 93.938),
      "https://www.google.com/maps/dir/?api=1&destination=24.807,93.938&travelmode=driving"
    );
  });
});
