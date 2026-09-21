// PlaceCoverCard — compact full-bleed cover card. The photo fills the whole
// card; title + district + a facts mini-chip are always visible over a pine
// gradient; one short tagline + Explore slide up on hover, keyboard focus,
// or (touch) first tap. Second tap navigates.

"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui";
import { WishlistHeart } from "@/components/WishlistHeart";

export interface CoverCardPlace {
  id: string;
  name: string;
  district: string;
  category: string;
  tagline: string;
  photo: string | null;
  photoAlt?: string;
  factsCount: number;
  rank?: string;
  className?: string;
}

export function PlaceCoverCard({ place, tall = false }: { place: CoverCardPlace; tall?: boolean }) {
  const [tapped, setTapped] = useState(false);
  // Touch detection only feeds the tap handler — never the rendered HTML —
  // so reading it in the initializer is hydration-safe (no DOM mismatch).
  const [isTouch] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(hover: none)").matches
  );

  return (
    // Stretched-link card: the Link covers the card for navigation while the
    // wishlist heart stays a sibling button (a <button> inside an <a> is
    // invalid HTML and breaks assistive tech). Text layers are pointer-transparent.
    <div
      className={`premium-card group relative flex ${tall ? "aspect-[9/16]" : "aspect-[4/3]"} flex-col justify-end overflow-hidden rounded-2xl border border-[#0B3D2E]/10 bg-[#0B3D2E] ${place.className ?? ""}`}
    >
      {place.photo ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={place.photo}
          alt={place.photoAlt ?? ""}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover motion-safe:transition motion-safe:duration-700 group-hover:scale-[1.05]"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-[#0E5A42] text-xs font-semibold text-[#DCEBE3]">
          No photo on record
        </div>
      )}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#0B3D2E]/95 via-[#0B3D2E]/40 to-transparent" />

      <Link
        href={`/places/${place.id}`}
        aria-label={`Open ${place.name}`}
        onClick={(e) => {
          // Touch has no hover: first tap reveals the tagline, second navigates.
          if (isTouch && !tapped) {
            e.preventDefault();
            setTapped(true);
          }
        }}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C19A4B]"
      />
      <div className="absolute top-3 right-3 left-3 z-10 flex items-start justify-between gap-2">
        <span className="pointer-events-none">
          <Badge tone="gold">{place.category}</Badge>
        </span>
        <WishlistHeart placeId={place.id} />
      </div>
      {place.rank && (
        <span aria-hidden className="font-display pointer-events-none absolute top-12 left-4 text-4xl font-semibold text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">
          {place.rank}
        </span>
      )}

      <div className="pointer-events-none relative p-4">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-[#E8C97A] uppercase">{place.district}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <h2 className="font-display flex-1 text-xl leading-tight font-semibold tracking-tight text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">
            {place.name}
          </h2>
          <span className="shrink-0 rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {place.factsCount} fact{place.factsCount === 1 ? "" : "s"}
          </span>
        </div>
        <div
          className={
            tapped
              ? "overflow-hidden motion-safe:transition-all motion-safe:duration-300 translate-y-0 opacity-100"
              : "overflow-hidden motion-safe:transition-all motion-safe:duration-300 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
          }
        >
          <p className="font-display mt-1.5 text-[15px] leading-snug font-medium text-[#F3EFE2] italic">{place.tagline}</p>
          <span className="mt-1.5 inline-block text-sm font-semibold text-[#E8C97A] underline decoration-[#C19A4B] decoration-2 underline-offset-4">
            Explore →
          </span>
        </div>
      </div>
    </div>
  );
}
