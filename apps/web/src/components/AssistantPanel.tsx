// Global assistant — round floating button + side panel, mounted once in
// RootLayout so Mit helps from every page. Shares the panel-only thread
// store (no full page).

"use client";

import { useEffect, useRef, useState } from "react";
import { AssistantInput, AssistantThreadView, clearThread, consumeOpenSignal, sendAssistantMessage, useAssistantStore } from "@/components/assistant-thread";

export function AssistantPanel() {
  const [open, setOpen] = useState(false);
  const { messages } = useAssistantStore();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open ]);

  const seenSignal = useRef(0);
  useEffect(() => {
    const signal = consumeOpenSignal();
    if (signal && signal.id !== seenSignal.current) {
      seenSignal.current = signal.id;
      setOpen(true);
      if (signal.prefill) void sendAssistantMessage(signal.prefill);
    }
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        aria-expanded={open}
        className="fixed right-5 bottom-5 z-50 grid h-14 w-14 cursor-pointer place-items-center rounded-full bg-[#0B3D2E] text-[#F3E8CF] shadow-[0_16px_36px_-10px_rgba(11,61,46,0.7)] ring-2 ring-[#C19A4B] transition hover:bg-[#0E5A42] active:scale-95"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
            <circle cx="9" cy="12" r="1" fill="currentColor" />
            <circle cx="13" cy="12" r="1" fill="currentColor" />
            <circle cx="17" cy="12" r="1" fill="currentColor" />
          </svg>
        )}
      </button>

      <div
        className={`fixed inset-0 z-40 bg-[#0B3D2E]/30 backdrop-blur-[2px] transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-label="Manipur Tourism assistant"
        aria-hidden={!open}
        className={`fixed top-0 right-0 bottom-0 z-50 flex w-full flex-col border-l border-[#0B3D2E]/10 bg-[#FDFBF7] shadow-2xl transition-transform duration-300 sm:w-[400px] ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center gap-2.5 border-b border-[#0B3D2E]/10 bg-white px-4 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0B3D2E] text-sm font-semibold text-[#F3E8CF]">M</span>
          <div className="leading-tight">
            <p className="font-display text-[15px] font-semibold text-[#0B3D2E]">Mit — trip assistant</p>
            <p className="text-[11px] text-[#5D746B]">Verified info only · never books</p>
          </div>
          <button
            type="button"
            onClick={() => clearThread()}
            disabled={messages.length === 0}
            className="ml-auto cursor-pointer rounded-full border border-[#0B3D2E]/15 px-3 py-1 text-[11px] font-semibold text-[#42584F] transition hover:border-[#0B3D2E]/35 disabled:opacity-40"
            aria-label="Clear conversation"
          >
            Clear
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AssistantThreadView compact />
        </div>

        <AssistantInput compact />
      </aside>
    </>
  );
}
