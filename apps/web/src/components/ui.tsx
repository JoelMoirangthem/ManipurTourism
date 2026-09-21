// UI primitives — trust rendering lives in one place so it cannot drift
// between screens (design.md §4/§5). Jewel-Emerald light premium system.

import type { Freshness } from "@/lib/domain";

export function Badge({ tone, children }: { tone: "ok" | "warn" | "bad" | "muted" | "gold"; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    ok: "border-[#0E5A42]/25 bg-[#EEF5F1] text-[#0B3D2E]",
    warn: "border-[#9A7A2E]/30 bg-[#FBF6E9] text-[#7a5f22]",
    bad: "border-red-700/25 bg-red-50 text-red-800",
    muted: "border-[#0B3D2E]/12 bg-[#0B3D2E]/[0.04] text-[#42584F]",
    gold: "border-[#C19A4B]/50 bg-[#C19A4B] text-[#0B3D2E]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function freshnessTone(f: Freshness): "ok" | "warn" | "bad" | "muted" {
  if (f === "current") return "ok";
  if (f === "stale") return "warn";
  if (f === "expired" || f === "conflict") return "bad";
  return "muted";
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`premium-card rounded-2xl border border-[#0B3D2E]/10 bg-white p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ kicker, title, lede }: { kicker?: string; title: string; lede?: string }) {
  return (
    <div>
      {kicker && (
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9A7A2E] uppercase">{kicker}</p>
      )}
      <h2 className="font-display mt-1 text-2xl font-semibold tracking-tight text-[#0B3D2E]">{title}</h2>
      {lede && <p className="mt-1 max-w-2xl text-sm leading-6 text-[#5D746B]">{lede}</p>}
    </div>
  );
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "error" | "success" | "warn";
  children: React.ReactNode;
}) {
  const tones = {
    info: "border border-[#0B3D2E]/12 bg-[#EEF5F1] text-[#0B3D2E]",
    error: "border border-red-700/20 bg-red-50 text-red-800",
    success: "border border-[#0E5A42]/25 bg-[#EEF5F1] text-[#0B3D2E]",
    warn: "border border-[#C19A4B]/40 bg-[#FBF6E9] text-[#6b551f]",
  };
  return <div className={`rounded-2xl p-4 text-sm leading-6 ${tones[tone]}`}>{children}</div>;
}

/**
 * The standing disclaimer. Every operational-adjacent surface renders this, so
 * no screen can quietly imply a booking or a safety guarantee.
 */
export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p
      className={`rounded-xl border border-[#0B3D2E]/10 bg-white/70 px-3 py-2.5 text-xs leading-5 text-[#5D746B] ${className}`}
    >
      Host replies are host-reported for the stated dates and expire — they are never reservations, and
      nothing here certifies a place, road or activity as safe.
    </p>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-[13px] font-semibold text-[#0B3D2E]">{label}</span>
      {hint && <span className="ml-1.5 text-xs text-[#5D746B]">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[#0B3D2E]/15 bg-white px-3.5 py-2.5 text-sm text-[#1A2E28] shadow-sm outline-none transition placeholder:text-[#5D746B]/60 hover:border-[#0B3D2E]/25 focus:border-[#0E5A42] focus:ring-2 focus:ring-[#0E5A42]/15";

export const primaryButtonClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0B3D2E] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(11,61,46,0.6)] transition hover:bg-[#0E5A42] hover:shadow-[0_14px_28px_-10px_rgba(11,61,46,0.65)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40";

export const secondaryButtonClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#0B3D2E]/20 bg-white px-6 py-2.5 text-sm font-semibold text-[#0B3D2E] shadow-sm transition hover:border-[#0B3D2E]/40 hover:bg-[#EEF5F1] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40";
