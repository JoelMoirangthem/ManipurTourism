"use client";
import { useState } from "react";

type Season = { name: string; months: string; temp: string; note: string };

export function SeasonExplorer({ seasons }: { seasons: Season[] }) {
  const [selected, setSelected] = useState(0);
  if (seasons.length === 0) return null;
  const safe = Math.min(selected, seasons.length - 1);
  const current = seasons[safe];

  return (
    <div>
      <div role="tablist" aria-label="Seasons in Manipur" className="flex flex-wrap gap-2">
        {seasons.map((s, i) => (
          <button
            key={s.name}
            type="button"
            role="tab"
            aria-selected={i === safe}
            onClick={() => setSelected(i)}
            className={
              i === safe
                ? "cursor-pointer rounded-full bg-[#0B3D2E] px-4 py-2 text-xs font-semibold text-white"
                : "cursor-pointer rounded-full border border-[#0B3D2E]/15 bg-white px-4 py-2 text-xs font-semibold text-[#0B3D2E] transition hover:border-[#0B3D2E]/35"
            }
          >
            {s.name}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        className="premium-card mt-4 rounded-2xl border border-[#0B3D2E]/10 bg-white p-5"
      >
        <p className="text-[11px] font-semibold tracking-[0.14em] text-[#9A7A2E] uppercase">{current.months}</p>
        <h3 className="font-display mt-1 text-lg font-semibold text-[#0B3D2E]">{current.name}</h3>
        <p className="text-xs font-semibold text-[#0B3D2E]">{current.temp}</p>
        <p className="mt-2 text-sm leading-6 text-[#42584F]">{current.note}</p>
      </div>
    </div>
  );
}
