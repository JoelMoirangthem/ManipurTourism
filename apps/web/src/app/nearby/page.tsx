import type { Metadata } from "next";
import Link from "next/link";
import { NearbyMap } from "@/components/NearbyMap";

export const metadata: Metadata = {
  title: "Near me — Manipur Tourism Mit",
  description:
    "See verified catalogue places around your current location on a map. Tap any pin to open its sourced page.",
};

export default function NearbyPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9A7A2E] uppercase">Near me</p>
      <h1 className="font-display mt-1 text-4xl font-semibold tracking-tight text-[#0B3D2E]">
        What&apos;s around you
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5D746B]">
        Your location is used once to sort the verified catalogue by distance — it is never stored.
        Start at Imphal centre when location is unavailable.{" "}
        <Link href="/places" className="font-semibold text-[#0B3D2E] underline decoration-[#C19A4B] decoration-2 underline-offset-4">
          Browse the full catalogue →
        </Link>
      </p>
      <div className="mt-6">
        <NearbyMap />
      </div>
    </main>
  );
}
