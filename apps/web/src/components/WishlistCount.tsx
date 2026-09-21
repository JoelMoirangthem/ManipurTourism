"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { readWishlist } from "@/lib/wishlist";
export function WishlistCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(readWishlist().length);
    const onStorage = () => setCount(readWishlist().length);
    window.addEventListener("storage", onStorage);
    const timer = setInterval(() => setCount(readWishlist().length), 1000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(timer);
    };
  }, []);
  if (count === 0) return null;
  return (
    <Link href="/places" aria-label={`${count} saved places`} className="rounded-full border border-[#C19A4B]/50 bg-[#FBF6E9] px-3 py-1.5 text-xs font-semibold text-[#7a5f22]" title="Saved places (this browser only)">
      ♥ {count} saved
    </Link>
  );
}
