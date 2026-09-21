"use client";

// Catalogue — search plus facet filters, debounced. Previously search only, and
// the district/category params supported by the API were unreachable from the UI.

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { inputClass } from "@/components/ui";
import { PlaceCoverCard } from "@/components/PlaceCoverCard";
import { readTripContext, writeTripContext, type TripContext } from "@/lib/tripContext";

type Card = {
  id: string;
  name: string;
  district: string;
  category: string;
  tagline: string;
  photo: string | null;
  claimsCount: number;
};

type Facets = { districts: string[]; categories: string[] };

function TripChip() {
  // Client island: reflects the saved trip context (context only, shown
  // separately from sourced records). Renders nothing until hydrated and
  // nothing when no destination, dates, or traveller count is saved.
  const [trip, setTrip] = useState<TripContext | null>(null);
  useEffect(() => {
    setTrip(readTripContext());
  }, []);
  if (!trip) return null;
  if (!trip.destination && !trip.checkIn && !trip.travellers) return null;
  return (
    <p className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-full border border-[#C19A4B]/60 bg-[#FBF6E9] px-4 py-1.5 text-xs font-semibold text-[#7a5f22]">
      <span>
        Your trip: {trip.destination || "Anywhere"} · {trip.travellers} travellers · {trip.checkIn || "dates flexible"}
      </span>
      <button
        type="button"
        onClick={() => {
          writeTripContext({ destination: "", checkIn: "", checkOut: "" });
          setTrip(readTripContext());
        }}
        className="cursor-pointer underline decoration-[#C19A4B] decoration-2 underline-offset-4"
        aria-label="Clear trip context"
      >
        Clear
      </button>
    </p>
  );
}

function PlacesInner() {
  // Hydrate initial filters from the URL so hero search (?q=) and collection
  // links (?district= / ?category=) land filtered. State is independent after
  // mount, so user edits still work.
  const searchParams = useSearchParams();
  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [debounced, setDebounced] = useState(() => searchParams.get("q") ?? "");
  const [district, setDistrict] = useState(() => searchParams.get("district") ?? "");
  const [category, setCategory] = useState(() => searchParams.get("category") ?? "");
  const [places, setPlaces] = useState<Card[]>([]);
  const [facets, setFacets] = useState<Facets>({ districts: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Re-sync when client navigation changes ?q=/district/category without a
  // remount (back/forward or Link between two /places?... URLs).
  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
    setDebounced(searchParams.get("q") ?? "");
    setDistrict(searchParams.get("district") ?? "");
    setCategory(searchParams.get("category") ?? "");
  }, [searchParams]);

  // Debounce so typing does not fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    const params = new URLSearchParams();
    if (debounced) params.set("q", debounced);
    if (district) params.set("district", district);
    if (category) params.set("category", category);
    fetch(`/api/places?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          setPlaces([]);
        } else {
          setError("");
          setPlaces(d.places ?? []);
          if (d.facets) setFacets(d.facets);
        }
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setLoading(false);
      });
    return () => ctrl.abort();
  }, [debounced, district, category]);

  const filtered = useMemo(() => district || category || debounced, [district, category, debounced]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9A7A2E] uppercase">Catalogue</p>
      <h1 className="font-display mt-1 text-4xl font-semibold tracking-tight text-[#0B3D2E]">Places</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5D746B]">
        Sourced records with published capacity shown separately from availability. Map locations are
        approximate — transfers are unverified.
      </p>
      <TripChip />

      <Link
        href="/nearby"
        className="mt-6 flex items-center gap-3 rounded-2xl border border-[#C19A4B]/40 bg-[#FBF6E9] p-4 transition hover:border-[#C19A4B]/70"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0B3D2E] text-sm font-semibold text-[#F3E8CF]">
          ◎
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[#0B3D2E]">Explore nearby on a map →</span>
          <span className="block truncate text-xs text-[#5D746B]">See catalogue places around your location, closest first.</span>
        </span>
      </Link>

      <div className="premium-card mt-6 rounded-2xl border border-[#0B3D2E]/10 bg-white p-3">
        <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Loktak, Kangla, trek, market…"
            className={inputClass}
            aria-label="Search places"
          />
          <select value={district} onChange={(e) => setDistrict(e.target.value)} className={inputClass} aria-label="Filter by district">
            <option value="">All districts</option>
            {facets.districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} aria-label="Filter by category">
            <option value="">All categories</option>
            {facets.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 px-1 pt-2.5 text-xs text-[#5D746B]">
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${loading ? "animate-pulse bg-[#C19A4B]" : "bg-[#0E5A42]"}`} />
            {loading ? "Loading…" : `${places.length} result${places.length === 1 ? "" : "s"}`}
          </span>
          {filtered && (
            <button
              onClick={() => {
                setQ("");
                setDistrict("");
                setCategory("");
                window.history.replaceState(null, "", window.location.pathname);
              }}
              className="font-semibold text-[#0B3D2E] underline decoration-[#C19A4B] decoration-2 underline-offset-4"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-4 rounded-2xl border border-red-700/20 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      {!loading && places.length === 0 && !error && (
        <div className="premium-card mt-6 rounded-2xl border border-[#0B3D2E]/10 bg-white p-8 text-center">
          <p className="font-display text-lg font-semibold text-[#0B3D2E]">No places match that.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#5D746B]">
            Try clearing the filters, or ask the assistant — it can explain what this catalogue covers and what it
            does not.
          </p>
          <Link href="/?assistant=open" className="mt-4 inline-block rounded-full bg-[#0B3D2E] px-5 py-2.5 text-sm font-semibold text-white">
            Ask the assistant →
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((p) => (
          <PlaceCoverCard
            key={p.id}
            place={{
              id: p.id,
              name: p.name,
              district: p.district,
              category: p.category,
              tagline: p.tagline,
              photo: p.photo,
              factsCount: p.claimsCount,
            }}
          />
        ))}
      </div>
    </main>
  );
}

export default function PlacesPage() {
  // Suspense boundary required by Next when a page reads useSearchParams.
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9A7A2E] uppercase">Catalogue</p>
          <h1 className="font-display mt-1 text-4xl font-semibold tracking-tight text-[#0B3D2E]">Places</h1>
          <p className="mt-2 text-sm leading-6 text-[#5D746B]">Loading…</p>
        </main>
      }
    >
      <PlacesInner />
    </Suspense>
  );
}
