"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { tripToPlacesParams, writeTripContext } from "@/lib/tripContext";
import { inputClass } from "@/components/ui";

const TABS = [
  { label: "Stays", category: "Stay" },
  { label: "Culture", category: "Heritage" },
  { label: "Treks", category: "Trek" },
];
const DISTRICTS = ["", "Bishnupur", "Imphal West", "Ukhrul", "Senapati"];

export function TripWidget() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [travellers, setTravellers] = useState(2);
  return (
    <form
      className="rounded-[20px] border border-[#0B3D2E]/10 bg-white p-4 shadow-xl"
      onSubmit={(e) => {
        e.preventDefault();
        writeTripContext({ destination, checkIn, checkOut, travellers, interests: [TABS[tab].category] });
        router.push(tripToPlacesParams({ destination, checkIn, checkOut, travellers, interests: [TABS[tab].category] }));
      }}
    >
      <div role="tablist" aria-label="Trip type" className="flex flex-wrap gap-2">
        {TABS.map((t, i) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={i === tab}
            onClick={() => setTab(i)}
            className={
              i === tab
                ? "cursor-pointer rounded-full bg-[#0B3D2E] px-4 py-1.5 text-xs font-semibold text-white"
                : "cursor-pointer rounded-full border border-[#0B3D2E]/15 bg-white px-4 py-1.5 text-xs font-semibold text-[#0B3D2E] transition hover:border-[#0B3D2E]/35"
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <label className="block text-sm">
          <span className="text-[13px] font-semibold text-[#0B3D2E]">Destination</span>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className={`${inputClass} mt-1.5`}
          >
            {DISTRICTS.map((d) => (
              <option key={d === "" ? "anywhere" : d} value={d}>
                {d === "" ? "Anywhere in Manipur" : d}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-[13px] font-semibold text-[#0B3D2E]">Check-in</span>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className={`${inputClass} mt-1.5`}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[13px] font-semibold text-[#0B3D2E]">Check-out</span>
          <input
            type="date"
            value={checkOut}
            min={checkIn || undefined}
            onChange={(e) => setCheckOut(e.target.value)}
            className={`${inputClass} mt-1.5`}
          />
        </label>
        <div>
          <span id="trip-travellers-label" className="text-[13px] font-semibold text-[#0B3D2E]">
            Travellers
          </span>
          <div className="mt-1.5 flex items-center gap-2" role="group" aria-labelledby="trip-travellers-label">
            <button
              type="button"
              aria-label="Fewer travellers"
              disabled={travellers <= 1}
              onClick={() => setTravellers((n) => Math.max(1, n - 1))}
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-[#0B3D2E]/20 text-lg font-semibold text-[#0B3D2E] transition hover:border-[#0B3D2E]/40 disabled:cursor-not-allowed disabled:opacity-30"
            >
              −
            </button>
            <span aria-live="polite" className="w-8 text-center text-sm font-semibold text-[#0B3D2E]">
              {travellers}
            </span>
            <button
              type="button"
              aria-label="More travellers"
              disabled={travellers >= 50}
              onClick={() => setTravellers((n) => Math.min(50, n + 1))}
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-[#0B3D2E]/20 text-lg font-semibold text-[#0B3D2E] transition hover:border-[#0B3D2E]/40 disabled:cursor-not-allowed disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>
      </div>
      <button
        type="submit"
        className="mt-4 w-full cursor-pointer rounded-full bg-[#C19A4B] px-6 py-3 text-sm font-semibold text-[#0B3D2E] transition hover:bg-[#d4af5f] sm:w-auto"
      >
        Search
      </button>
    </form>
  );
}
