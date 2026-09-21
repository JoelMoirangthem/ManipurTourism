"use client";
import { PlaceCoverCard } from "@/components/PlaceCoverCard";

type RailPlace = {
  id: string;
  name: string;
  district: string;
  category: string;
  tagline: string;
  photo: string | null;
  factsCount: number;
};

export function AttractionsRail({ places }: { places: RailPlace[] }) {
  if (places.length === 0) return null;
  return (
    <section aria-labelledby="attractions-rail-heading">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9A7A2E] uppercase">Don&apos;t miss</p>
      <h2 id="attractions-rail-heading" className="font-display mt-1 text-2xl font-semibold tracking-tight text-[#0B3D2E]">
        Top attractions in Manipur
      </h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-[#5D746B]">
        Ranked catalogue order — swipe sideways, open a record for sourced facts.
      </p>
      <div className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {places.map((pl, i) => (
          <PlaceCoverCard
            key={pl.id}
            tall
            place={{
              id: pl.id,
              name: pl.name,
              district: pl.district,
              category: pl.category,
              tagline: pl.tagline,
              photo: pl.photo,
              factsCount: pl.factsCount,
              rank: String(i + 1).padStart(2, "0"),
              className: "w-64 shrink-0 snap-start sm:w-72",
            }}
          />
        ))}
      </div>
    </section>
  );
}
