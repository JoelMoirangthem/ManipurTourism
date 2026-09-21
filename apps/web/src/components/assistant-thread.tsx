// Shared assistant store + thread UI. One panel-only conversation everywhere:
// the floating side panel reads the same external
// store (persisted to localStorage). Deterministic APIs stay authoritative:
// /api/ai/query answers, /api/plan drafts — this file only orchestrates.

"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { Badge, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { briefComplete, missingBriefFields, parseBrief, type ParsedBrief } from "@/lib/assistantBrief";

export interface EditableBrief {
  nights: number | null;
  groupSize: number | null;
  interests: string[];
  budgetRupees: number | null;
  budgetIncludes: string | null;
}

export interface AiResult {
  answer: string;
  sources?: { title: string; url: string | null; kind?: "claim" | "web" }[];
  searchedAt?: string;
  intent?: string;
  matched?: string;
  confidence?: "high" | "low";
  degraded?: { reason: string[] } | null;
  bundle?: { claimIds: string[]; places: { id: string; name: string }[] };
}

export interface PlanApiResult {
  drafts: {
    title: string;
    legs: { placeId: string; name: string; district: string; category: string; nights: number }[];
    nights: Record<string, number>;
    notes: string[];
    missing: string[];
  }[];
  budget: { total: string; includes: string; excludes: string; lines: { label: string; amount: string }[] } | null;
  warning: string;
}

export interface ThreadMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  result?: AiResult | null;
  brief?: EditableBrief | null;
  plan?: PlanApiResult | null;
  planError?: string | null;
  planBusy?: boolean;
}

interface ThreadState {
  messages: ThreadMessage[];
  busy: boolean;
}

const STORAGE_KEY = "mit_assistant_thread_v1";
const MAX_MESSAGES = 60;

let state: ThreadState = { messages: [], busy: false };
let loaded = false;
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.messages.slice(-MAX_MESSAGES)));
  } catch {
    /* storage full or unavailable — thread simply won't survive reload */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ThreadState {
  return state;
}

function getServerSnapshot(): ThreadState {
  return { messages: [], busy: false };
}

let openSignal: { id: number; prefill: string | null } | null = null;
let openSignalId = 0;
export function requestPanelOpen(prefill: string | null) {
  openSignalId += 1;
  openSignal = { id: openSignalId, prefill };
  listeners.forEach((l) => l());
}
export function consumeOpenSignal() {
  const signal = openSignal;
  openSignal = null;
  return signal;
}

export function useAssistantStore(): ThreadState & { loaded: boolean } {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    if (!loaded) {
      loaded = true;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) state = { ...state, messages: parsed.slice(-MAX_MESSAGES) };
        }
      } catch {
        /* corrupt thread — start fresh */
      }
      emit();
    }
  }, []);
  return { ...snap, loaded };
}

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `m-${Date.now().toString(36)}-${idCounter}`;
}

function lastBrief(): EditableBrief | null {
  for (let i = state.messages.length - 1; i >= 0; i--) {
    const b = state.messages[i].brief;
    if (b) return b;
  }
  return null;
}

function mergeBriefs(prev: EditableBrief | null, next: ParsedBrief): EditableBrief {
  return {
    nights: next.nights ?? prev?.nights ?? null,
    groupSize: next.groupSize ?? prev?.groupSize ?? null,
    interests: [...new Set([...(prev?.interests ?? []), ...next.interests])],
    budgetRupees: next.budgetRupees ?? prev?.budgetRupees ?? null,
    // A budget basis is only ever set by explicit user pick in the brief card.
    budgetIncludes: prev?.budgetIncludes ?? null,
  };
}

function finalizeResultMessage(id: string, userText: string, result: AiResult) {
  if (result.intent === "plan") {
    const brief = mergeBriefs(lastBrief(), parseBrief(userText));
    const missing = missingBriefFields(brief);
    const ask =
      missing.length > 0
        ? `I can draft that. I still need: ${missing.join(", ")}. Tell me, or tap a suggestion below — then confirm the brief to generate drafts.`
        : `Here's what I understood. Confirm the brief and I'll generate tentative drafts with an honest budget.`;
    state = {
      ...state,
      messages: state.messages.map((m) => (m.id === id ? { ...m, text: `${result.answer}\n\n${ask}`, result, brief } : m)),
    };
  } else {
    state = {
      ...state,
      messages: state.messages.map((m) => (m.id === id ? { ...m, text: result.answer, result } : m)),
    };
  }
  emit();
}

function patchMessageText(id: string, text: string, result?: AiResult | null) {
  state = {
    ...state,
    messages: state.messages.map((m) => (m.id === id ? { ...m, text, ...(result !== undefined ? { result } : {}) } : m)),
  };
  emit();
}

export async function sendAssistantMessage(rawText: string) {
  const text = rawText.trim();
  if (!text || state.busy) return;
  state = { ...state, busy: true, messages: [...state.messages, { id: nextId(), role: "user", text }] };
  // Streaming placeholder — paints instantly, fills token-by-token.
  const assistantId = nextId();
  state = {
    ...state,
    messages: [...state.messages, { id: assistantId, role: "assistant", text: "…" }],
  };
  emit();
  const failMessage = (msg: string) => {
    state = { ...state, messages: state.messages.map((m) => (m.id === assistantId ? { ...m, text: msg } : m)) };
  };
  try {
    const res = await fetch("/api/ai/query", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ query: text, stream: true }),
    });
    const ctype = res.headers.get("content-type") ?? "";
    if (!res.ok || !ctype.includes("text/event-stream") || !res.body) {
      // Non-stream fallback (old JSON contract).
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        failMessage(data?.error ?? "The assistant is unavailable right now. Try again in a moment.");
      } else {
        finalizeResultMessage(assistantId, text, data as AiResult);
      }
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let acc = "";
    let settled = false;
    let sawToken = false;
    const flush = (chunk: string) => {
      buf += chunk;
      const parts = buf.split("\n\n");
      buf = parts.pop() ?? "";
      for (const part of parts) {
        const lines = part.split("\n");
        let ev = "";
        const dataLines: string[] = [];
        for (const ln of lines) {
          if (ln.startsWith("event:")) ev = ln.slice(6).trim();
          else if (ln.startsWith("data:")) dataLines.push(ln.slice(5).trim());
        }
        const raw = dataLines.join("\n");
        if (!ev || !raw) continue;
        try {
          const payload = JSON.parse(raw);
          if (ev === "status") {
            if (!sawToken) patchMessageText(assistantId, payload.message ?? "…");
          } else if (ev === "sources") {
            patchMessageText(assistantId, acc || "…", {
              answer: acc,
              sources: payload.sources ?? [],
              intent: payload.intent,
              matched: payload.matched,
            } as AiResult);
          } else if (ev === "token") {
            sawToken = true;
            acc += payload.token ?? "";
            patchMessageText(assistantId, acc);
          } else if (ev === "done") {
            settled = true;
            finalizeResultMessage(assistantId, text, payload as AiResult);
          } else if (ev === "error") {
            failMessage(payload.message ?? "The assistant is unavailable right now. Try again in a moment.");
          }
        } catch {
          /* partial SSE frame — ignore */
        }
      }
    };
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      flush(decoder.decode(value, { stream: true }));
    }
    flush(decoder.decode());
    if (!settled) {
      // Stream cut before done — converge on whatever arrived, else honest error.
      if (sawToken && acc.trim()) {
        patchMessageText(assistantId, acc);
      } else {
        failMessage("Could not reach the assistant. Check your connection and try again.");
      }
    }
  } catch {
    failMessage("Could not reach the assistant. Check your connection and try again.");
  } finally {
    state = { ...state, busy: false };
    emit();
  }
}

export function updateBrief(messageId: string, patch: Partial<EditableBrief>) {
  state = {
    ...state,
    messages: state.messages.map((m) => (m.id === messageId && m.brief ? { ...m, brief: { ...m.brief, ...patch } } : m)),
  };
  emit();
}

export async function confirmPlan(messageId: string) {
  const msg = state.messages.find((m) => m.id === messageId);
  const brief = msg?.brief;
  if (!msg || !brief || !briefComplete(brief) || msg.planBusy) return;
  state = { ...state, messages: state.messages.map((m) => (m.id === messageId ? { ...m, planBusy: true, planError: null } : m)) };
  emit();
  try {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nights: brief.nights,
        groupSize: brief.groupSize,
        interests: brief.interests,
        budgetRupees: brief.budgetRupees,
        budgetIncludes: brief.budgetIncludes,
        query: "",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      state = { ...state, messages: state.messages.map((m) => (m.id === messageId ? { ...m, planBusy: false, planError: data.error ?? "Planning failed." } : m)) };
    } else {
      state = { ...state, messages: state.messages.map((m) => (m.id === messageId ? { ...m, planBusy: false, plan: data as PlanApiResult } : m)) };
    }
  } catch {
    state = { ...state, messages: state.messages.map((m) => (m.id === messageId ? { ...m, planBusy: false, planError: "Could not reach the planner." } : m)) };
  }
  emit();
}

export function clearThread() {
  state = { messages: [], busy: false };
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

const STARTER_FLAG = "mit_assistant_started_plan";
export function seedPlanStarter() {
  try {
    if (sessionStorage.getItem(STARTER_FLAG)) return;
    sessionStorage.setItem(STARTER_FLAG, "1");
  } catch {
    /* ignore */
  }
  if (state.messages.length > 0) return;
  state = {
    ...state,
    messages: [
      {
        id: nextId(),
        role: "assistant",
        text: "Let's draft a tentative plan together. Tell me how many nights, how many people, and what draws you — lake, heritage, market, trek — plus a budget if you have one. I'll confirm the brief before generating anything.",
      },
    ],
  };
  emit();
}

function CitedRecords({ result }: { result: AiResult }) {
  const cited = [...result.answer.matchAll(/\[(c-[\w-]+)\]/g)].map((m) => m[1]);
  const claimSources = result.sources?.filter((s) => s.kind !== "web") ?? [];
  const webSources = result.sources?.filter((s) => s.kind === "web") ?? [];
  if (cited.length === 0 && claimSources.length === 0 && webSources.length === 0 && !result.degraded) return null;
  return (
    <div className="mt-2 space-y-2">
      {cited.length > 0 && (
        <ul className="space-y-0.5">
          {[...new Set(cited)].map((id) => {
            const owner = result.bundle?.places.find((p) => id.includes(p.id));
            return (
              <li key={id} className="text-[11px] text-[#5D746B]">
                <code className="rounded bg-[#0B3D2E]/5 px-1.5 py-0.5 font-medium text-[#0B3D2E]">{id}</code>
                {owner && (
                  <>
                    {" "}from <Link href={`/places/${owner.id}`} className="font-semibold text-[#0B3D2E] underline">{owner.name}</Link>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {claimSources.length > 0 && (
        <p className="text-[11px] text-[#5D746B]">Sources: {[...new Set(claimSources.map((s) => s.title))].join("; ")}</p>
      )}
      {webSources.length > 0 && (
        <div className="rounded-xl border border-[#C19A4B]/40 bg-[#FBF6E9] p-2.5">
          <p className="text-[11px] font-semibold text-[#5a4a1e]">Unverified web context — treat as a lead, not a fact.</p>
          {webSources.map((s) => (
            <p key={s.url} className="mt-0.5 text-[11px] text-[#5a4a1e]">
              <a className="font-semibold underline" href={s.url ?? "#"} rel="noreferrer noopener" target="_blank">{s.title}</a>
            </p>
          ))}
        </div>
      )}
      {result.degraded && <p className="text-[11px] text-[#5D746B]">Template fallback: {result.degraded.reason.join("; ")}</p>}
    </div>
  );
}

const QUICK_NIGHTS = [1, 2, 3, 5];
const QUICK_GROUPS = [1, 2, 4, 6];

function BriefCard({ message, compact }: { message: ThreadMessage; compact?: boolean }) {
  const brief = message.brief;
  if (!brief) return null;
  const missing = missingBriefFields(brief);
  const needsBasis = brief.budgetRupees != null && brief.budgetIncludes == null;
  const ready = briefComplete(brief);
  return (
    <div className="mt-2 rounded-2xl border border-[#C19A4B]/40 bg-[#FBF6E9] p-3">
      <p className="text-[11px] font-semibold tracking-[0.12em] text-[#9A7A2E] uppercase">Trip brief — confirm to draft</p>
      <div className="mt-2 space-y-2 text-xs">
        <div>
          <p className="font-semibold text-[#0B3D2E]">Nights: {brief.nights ?? "—"}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {QUICK_NIGHTS.map((n) => (
              <button key={n} type="button" onClick={() => updateBrief(message.id, { nights: n })} className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${brief.nights === n ? "border-[#0B3D2E] bg-[#0B3D2E] text-white" : "border-[#0B3D2E]/20 bg-white text-[#42584F] hover:border-[#0B3D2E]/40"}`}>
                {n}n
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="font-semibold text-[#0B3D2E]">Group: {brief.groupSize ?? "—"}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {QUICK_GROUPS.map((g) => (
              <button key={g} type="button" onClick={() => updateBrief(message.id, { groupSize: g })} className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${brief.groupSize === g ? "border-[#0B3D2E] bg-[#0B3D2E] text-white" : "border-[#0B3D2E]/20 bg-white text-[#42584F] hover:border-[#0B3D2E]/40"}`}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[#42584F]">Interests: {brief.interests.length > 0 ? brief.interests.join(", ") : "—"}</p>
        <p className="text-[#42584F]">Budget: {brief.budgetRupees != null ? `₹${brief.budgetRupees.toLocaleString("en-IN")}` : "—"}</p>
        {needsBasis && (
          <label className="block">
            <span className="font-semibold text-[#0B3D2E]">Budget includes (required)</span>
            <select value={brief.budgetIncludes ?? ""} onChange={(e) => updateBrief(message.id, { budgetIncludes: e.target.value || null })} className={`${inputClass} mt-1`} aria-label="What the budget includes">
              <option value="">Pick one…</option>
              <option value="stay-only">Stay only</option>
              <option value="all-costs">Stay + food + transport + fees</option>
            </select>
          </label>
        )}
      </div>
      {missing.length > 0 && <p className="mt-2 text-[11px] font-medium text-[#7a5f22]">Still needed: {missing.join(", ")}.</p>}
      {message.planError && <p className="mt-2 text-[11px] font-medium text-red-800">{message.planError}</p>}
      <button type="button" onClick={() => confirmPlan(message.id)} disabled={!ready || message.planBusy} className={`${ready ? primaryButtonClass : secondaryButtonClass} mt-2 w-full !px-4 !py-2 !text-xs`}>
        {message.planBusy ? "Drafting…" : message.plan ? "Re-generate drafts" : "Confirm brief — generate drafts"}
      </button>
      {message.plan && <PlanDrafts plan={message.plan} compact={compact} />}
    </div>
  );
}

function PlanDrafts({ plan, compact }: { plan: PlanApiResult; compact?: boolean }) {
  return (
    <div className="mt-2 space-y-2">
      <p className="rounded-xl border border-[#C19A4B]/40 bg-[#FBF6E9] p-2.5 text-[11px] leading-5 text-[#5a4a1e]">{plan.warning}</p>
      {plan.drafts.length === 0 && <p className="text-xs text-[#42584F]">No draft matched. Try different interests or dates.</p>}
      {plan.drafts.map((d) => (
        <div key={d.title} className="rounded-xl border border-[#0B3D2E]/10 bg-white p-2.5">
          <p className={`font-display font-semibold text-[#0B3D2E] ${compact ? "text-sm" : "text-base"}`}>{d.title}</p>
          <ol className="mt-1.5 space-y-1">
            {d.legs.map((leg, i) => (
              <li key={`${leg.placeId}-${i}`} className="flex items-center justify-between gap-2 text-xs">
                <span>
                  <span className="mr-1.5 font-semibold text-[#9A7A2E]">{String(i + 1).padStart(2, "0")}</span>
                  <Link href={`/places/${leg.placeId}`} className="font-semibold text-[#0B3D2E] underline decoration-[#C19A4B] decoration-2 underline-offset-4">{leg.name}</Link>
                </span>
                <Badge tone="muted">{leg.nights}n</Badge>
              </li>
            ))}
          </ol>
          {plan.budget && (
            <div className="mt-1.5 border-t border-[#0B3D2E]/10 pt-1.5 text-[11px]">
              <p className="font-semibold text-[#0B3D2E]">{plan.budget.total} ({plan.budget.includes})</p>
              <p className="text-[#5D746B]">Not included: {plan.budget.excludes}</p>
            </div>
          )}
          <p className="mt-1.5 text-[11px] text-[#5D746B]">Still missing: {d.missing.join("; ")}</p>
        </div>
      ))}
    </div>
  );
}

export function AssistantThreadView({ compact }: { compact?: boolean }) {
  const { messages, busy } = useAssistantStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, busy]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0B3D2E] text-xl text-[#F3E8CF]">M</span>
        <p className="font-display mt-3 text-lg font-semibold text-[#0B3D2E]">Ask Mit anything</p>
        <p className="mt-1 max-w-[26ch] text-xs leading-5 text-[#5D746B]">
          Verified places, tentative trip drafts with honest budgets, and help asking providers — never a booking.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${compact ? "px-3 py-3" : ""}`}>
      {messages.map((m) =>
        m.role === "user" ? (
          <div key={m.id} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#0B3D2E] px-3.5 py-2.5 text-sm leading-6 text-white">
            {m.text}
          </div>
        ) : (
          <div key={m.id} className="max-w-[95%] rounded-2xl rounded-bl-md border border-[#0B3D2E]/10 bg-white px-3.5 py-2.5 shadow-sm">
            <p className="text-sm leading-6 whitespace-pre-line text-[#1A2E28]">{m.text}</p>
            {m.result && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {m.result.intent && <Badge tone="muted">{m.result.intent}</Badge>}
                {m.result.degraded && <Badge tone="warn">template fallback</Badge>}
              </div>
            )}
            {m.result && <CitedRecords result={m.result} />}
            {m.brief && <BriefCard message={m} compact={compact} />}
          </div>
        )
      )}
      {busy && <p className="text-xs text-[#5D746B]">Mit is thinking…</p>}
      <div ref={bottomRef} />
    </div>
  );
}

export function AssistantInput({ compact, onSent }: { compact?: boolean; onSent?: () => void }) {
  const { busy } = useAssistantStore();
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <form
      className={`flex gap-2 ${compact ? "border-t border-[#0B3D2E]/10 bg-white px-3 py-3" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        const value = inputRef.current?.value ?? "";
        if (!value.trim() || busy) return;
        if (inputRef.current) inputRef.current.value = "";
        void sendAssistantMessage(value);
        onSent?.();
      }}
    >
      <input ref={inputRef} placeholder="Ask or describe your trip…" aria-label="Message the assistant" className={inputClass} autoComplete="off" />
      <button type="submit" disabled={busy} className={`${primaryButtonClass} shrink-0 !px-5`} aria-label="Send message">
        {busy ? "…" : "→"}
      </button>
    </form>
  );
}

