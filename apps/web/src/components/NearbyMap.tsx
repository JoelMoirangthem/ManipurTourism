"use client";

// NearbyMap — visible Google basemap + auto nearby catalogue pins.
// Catalogue-only: pins come from GET /api/places?near= (seedRetriever.nearby).
// Clicking a pin or list card opens our /places/[id] page, never Google.
// Client island: geolocation, window.google, useEffect — never import server code.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IMPHAL_CENTER, buildNearbyQuery, buildNavigateUrl, formatDistanceKm, isValidLatLng } from "@/lib/nearby";
import { Badge, Notice } from "@/components/ui";

type NearbyResult = {
  id: string;
  name: string;
  district: string;
  category: string;
  tagline: string;
  lat: number | null;
  lng: number | null;
  photo: string | null;
  distanceKm: number;
  coordNote: string | null;
};

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (el: HTMLElement, opts: Record<string, unknown>) => GoogleMapInstance;
        Marker: new (opts: Record<string, unknown>) => GoogleMarkerInstance;
        InfoWindow: new () => GoogleInfoWindowInstance;
        SymbolPath: { CIRCLE: number };
        event: { addListener: (instance: unknown, event: string, cb: () => void) => void };
      };
    };
  }
}

type GoogleMapInstance = {
  setCenter: (c: { lat: number; lng: number }) => void;
  panTo: (c: { lat: number; lng: number }) => void;
};

type GoogleMarkerInstance = {
  setMap: (m: GoogleMapInstance | null) => void;
  addListener: (event: string, cb: () => void) => void;
};

type GoogleInfoWindowInstance = {
  setContent: (html: string) => void;
  open: (map: GoogleMapInstance, marker: GoogleMarkerInstance) => void;
};

let mapsPromise: Promise<void> | null = null;
function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps) return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("maps script failed")));
      return;
    }
    const s = document.createElement("script");
    s.dataset.googleMaps = "1";
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("maps script failed"));
    document.head.appendChild(s);
  });
  return mapsPromise;
}

// Small tourist radii: city sights sit within ~1 km of Imphal centre,
// the lake circuit ~31–39 km out. Always refetch on tap — even mid-locate,
// the current centre (Imphal fallback until GPS resolves) is valid to query.
const DEFAULT_RADIUS_KM = 30;
const RADIUS_OPTIONS = [5, 10, 15, 25, 30];

export function NearbyMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapObj = useRef<GoogleMapInstance | null>(null);
  const markersRef = useRef<GoogleMarkerInstance[]>([]);
  const infoRef = useRef<GoogleInfoWindowInstance | null>(null);

  const [center, setCenter] = useState(IMPHAL_CENTER);
  const [source, setSource] = useState<"locating" | "device" | "imphal" | "manual">("locating");
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [results, setResults] = useState<NearbyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mapError, setMapError] = useState(() =>
    apiKey ? "" : "Map preview needs NEXT_PUBLIC_GOOGLE_MAPS_API_KEY — list below still works."
  );
  // Tiles can take a moment (or never arrive offline): show feedback until
  // the map reports tiles, with a timeout fallback so no blank box lingers.
  const [mapLoading, setMapLoading] = useState(() => Boolean(apiKey));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchNearby = useCallback(async (lat: number, lng: number, radius: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(buildNearbyQuery(lat, lng, radius));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Nearby lookup failed");
      setResults((data.results ?? []) as NearbyResult[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nearby lookup failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-locate on mount: device GPS first, Imphal fallback (no button needed).
  // Geolocation callbacks + fetch resolve async — the sync fallback for
  // missing geolocation is deferred so the effect only subscribes.
  useEffect(() => {
    let cancelled = false;
    const fallbackToImphal = () => {
      if (cancelled) return;
      setCenter(IMPHAL_CENTER);
      setSource("imphal");
      void fetchNearby(IMPHAL_CENTER.lat, IMPHAL_CENTER.lng, DEFAULT_RADIUS_KM);
    };
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      const t = setTimeout(fallbackToImphal, 0);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const { latitude, longitude } = pos.coords;
        if (!isValidLatLng(latitude, longitude)) {
          setCenter(IMPHAL_CENTER);
          setSource("imphal");
          fetchNearby(IMPHAL_CENTER.lat, IMPHAL_CENTER.lng, DEFAULT_RADIUS_KM);
          return;
        }
        setCenter({ lat: latitude, lng: longitude });
        setSource("device");
        fetchNearby(latitude, longitude, DEFAULT_RADIUS_KM);
      },
      () => {
        if (cancelled) return;
        setCenter(IMPHAL_CENTER);
        setSource("imphal");
        fetchNearby(IMPHAL_CENTER.lat, IMPHAL_CENTER.lng, DEFAULT_RADIUS_KM);
      },
      { timeout: 8000, maximumAge: 300000 }
    );
    return () => {
      cancelled = true;
    };
  }, [fetchNearby]);

  const changeRadius = (r: number) => {
    setRadiusKm(r);
    void fetchNearby(center.lat, center.lng, r);
  };

  // Init / update the visible map. Marker sync runs after the Maps script
  // loads (external system); failure surfaces async in the load callback.
  useEffect(() => {
    if (!apiKey) return;
    if (!mapRef.current) return;
    let cancelled = false;
    const fallbackTimer = setTimeout(() => {
      if (!cancelled) setMapLoading(false);
    }, 12000);
    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !mapRef.current) return;
        const g = window.google;
        if (!g) return;
        if (!mapObj.current) {
          mapObj.current = new g.maps.Map(mapRef.current, {
            center,
            zoom: 10,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
          infoRef.current = new g.maps.InfoWindow();
        } else {
          mapObj.current.setCenter(center);
        }
        const map = mapObj.current;
        g.maps.event.addListener(map, "tilesloaded", () => {
          if (!cancelled) setMapLoading(false);
        });
        // Clear old markers.
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        // You-are-here dot.
        const you = new g.maps.Marker({
          position: center,
          map,
          title: source === "device" ? "Your current location" : "Imphal centre (fallback)",
          icon: {
            path: g.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: "#1a73e8",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
        markersRef.current.push(you);

        // Catalogue pins — click opens our /places/[id] page.
        results
          .filter((r) => r.lat != null && r.lng != null)
          .forEach((r) => {
            const marker = new g.maps.Marker({
              position: { lat: r.lat as number, lng: r.lng as number },
              map,
              title: r.name,
            });
            marker.addListener("click", () => {
              setSelectedId(r.id);
              mapObj.current?.panTo({ lat: r.lat as number, lng: r.lng as number });
              infoRef.current?.setContent(
                `<div style="max-width:220px;font-family:system-ui">` +
                  `<strong>${r.name}</strong><br/>` +
                  `<span>${r.district} · ${formatDistanceKm(r.distanceKm)}</span><br/>` +
                  `<a href="/places/${r.id}" style="color:#0B3D2E;font-weight:600">View details →</a><br/>` +
                  `<a href="${buildNavigateUrl(r.lat as number, r.lng as number)}" target="_blank" rel="noopener" style="color:#0B3D2E;font-weight:600">Navigate ↗</a>` +
                  `</div>`
              );
              const info = infoRef.current;
              const host = mapObj.current;
              if (info && host) info.open(host, marker);
            });
            markersRef.current.push(marker);
          });
      })
      .catch(() => {
        if (!cancelled) setMapError("Map failed to load — check API key restrictions. List below still works.");
      });
    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
    };
  }, [apiKey, center, results, source]);

  const useDevice = () => {
    if (!navigator.geolocation) return;
    setSource("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!isValidLatLng(latitude, longitude)) {
          setCenter(IMPHAL_CENTER);
          setSource("imphal");
          fetchNearby(IMPHAL_CENTER.lat, IMPHAL_CENTER.lng, radiusKm);
          return;
        }
        setCenter({ lat: latitude, lng: longitude });
        setSource("device");
        fetchNearby(latitude, longitude, radiusKm);
      },
      () => {
        setCenter(IMPHAL_CENTER);
        setSource("manual");
        fetchNearby(IMPHAL_CENTER.lat, IMPHAL_CENTER.lng, radiusKm);
      },
      { timeout: 8000 }
    );
  };

  const useImphal = () => {
    setCenter(IMPHAL_CENTER);
    setSource("manual");
    fetchNearby(IMPHAL_CENTER.lat, IMPHAL_CENTER.lng, radiusKm);
  };

  const selected = results.find((r) => r.id === selectedId) ?? null;

  return (
    <section aria-label="Nearby tourist places map" className="premium-card rounded-2xl border border-[#0B3D2E]/10 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="gold">{source === "device" ? "Using your location" : source === "locating" ? "Locating…" : "Imphal centre"}</Badge>
        <span className="text-xs text-[#5D746B]">Auto shows nearby catalogue places — tap a pin to open its page.</span>
        <span className="ml-auto flex gap-2">
          <button type="button" onClick={useDevice} className="rounded-full border border-[#0B3D2E]/15 px-3 py-1.5 text-xs font-semibold text-[#0B3D2E] hover:border-[#0B3D2E]/30">
            Use my location
          </button>
          <button type="button" onClick={useImphal} className="rounded-full border border-[#0B3D2E]/15 px-3 py-1.5 text-xs font-semibold text-[#0B3D2E] hover:border-[#0B3D2E]/30">
            Imphal centre
          </button>
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Search radius">
        {RADIUS_OPTIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => changeRadius(r)}
            aria-pressed={radiusKm === r}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              radiusKm === r ? "bg-[#0B3D2E] text-white" : "border border-[#0B3D2E]/15 bg-white text-[#0B3D2E] hover:border-[#0B3D2E]/30"
            }`}
          >
            {r} km
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div
            ref={mapRef}
            role="application"
            aria-label="Map showing your location and nearby tourist places"
            className="relative h-[300px] w-full overflow-hidden rounded-2xl border border-[#0B3D2E]/10 bg-[#EEF5F1] sm:h-[380px] lg:sticky lg:top-20 lg:h-[520px]"
          >
            {mapError ? (
              <div className="grid h-full place-items-center p-6 text-center">
                <p className="max-w-md text-sm leading-6 text-[#5D746B]">{mapError}</p>
              </div>
            ) : (
              mapLoading && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <p aria-live="polite" className="animate-pulse rounded-full border border-[#0B3D2E]/10 bg-white/90 px-4 py-2 text-xs font-semibold text-[#0B3D2E]">
                    Loading map…
                  </p>
                </div>
              )
            )}
          </div>
          <p className="mt-2 text-xs text-[#5D746B]">Map locations approximate — transfers unverified. Blue dot = you, pins = catalogue places.</p>
        </div>
        <div className="lg:col-span-2">
          {error && (
            <div>
              <Notice tone="error">{error}</Notice>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-[#5D746B]">
            <span className={`h-1.5 w-1.5 rounded-full ${loading ? "animate-pulse bg-[#C19A4B]" : "bg-[#0E5A42]"}`} />
            {loading ? "Finding nearby places…" : `${results.length} nearby place${results.length === 1 ? "" : "s"} within ${radiusKm} km`}
          </div>

          {!loading && results.length === 0 && !error && (
            <p className="mt-3 rounded-2xl border border-[#0B3D2E]/10 bg-[#EEF5F1] p-4 text-sm text-[#0B3D2E]">
              No catalogue places within {radiusKm} km — try a larger radius or Imphal centre.
            </p>
          )}

          <ul className="mt-3 grid gap-2">
            {results.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/places/${r.id}`}
                  onClick={() => setSelectedId(r.id)}
                  aria-label={`Open ${r.name}, ${formatDistanceKm(r.distanceKm)} away`}
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition hover:border-[#0B3D2E]/30 hover:bg-[#EEF5F1] focus-visible:outline-2 focus-visible:outline-[#0B3D2E] ${
                    selectedId === r.id ? "border-[#C19A4B] bg-[#FBF6E9]" : "border-[#0B3D2E]/10 bg-white"
                  }`}
                >
                  {r.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.photo} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" loading="lazy" />
                  ) : (
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#0B3D2E] text-sm font-semibold text-[#F3E8CF]">
                      {r.name.slice(0, 1)}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#0B3D2E]">{r.name}</span>
                    <span className="block text-xs text-[#5D746B]">
                      {r.district} · {r.category} · {formatDistanceKm(r.distanceKm)}
                    </span>
                  </span>
                  <span aria-hidden className="ml-auto shrink-0 text-[#0B3D2E]">→</span>
                </Link>
              </li>
            ))}
          </ul>

          {selected && (
            <p className="mt-3 text-xs text-[#5D746B]">
              Selected: <Link href={`/places/${selected.id}`} className="font-semibold text-[#0B3D2E] underline">Open {selected.name} →</Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
