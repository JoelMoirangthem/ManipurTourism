"use client";
import { useEffect, useState } from "react";
import { readWishlist, toggleWishlist } from "@/lib/wishlist";

export function WishlistHeart({ placeId }: { placeId: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(readWishlist().includes(placeId));
  }, [placeId]);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label="Save place"
      title={saved ? "Saved to your shortlist" : "Save place"}
      onClick={(e) => {
        // Hearts sit inside card links — never navigate on toggle.
        e.preventDefault();
        e.stopPropagation();
        const next = toggleWishlist(readWishlist(), placeId);
        setSaved(next.includes(placeId));
        window.dispatchEvent(new Event("storage"));
      }}
      className={`grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C19A4B] ${
        saved
          ? "border-[#C19A4B]/60 bg-[#FBF6E9] text-[#9A7A2E]"
          : "border-[#0B3D2E]/15 bg-white/90 text-[#0B3D2E] hover:border-[#C19A4B]/60"
      }`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill={saved ? "#C19A4B" : "none"}
        stroke={saved ? "#C19A4B" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
