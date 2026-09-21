"use client";

// Messages — the role-aware merged list (replaces /threads + /inbox).
// GET /api/inquiries is scope-enforced, so this page shows only threads
// visible to the acting identity.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Card, inputClass } from "@/components/ui";
import { ACTOR_COOKIE, readActorCookieClient } from "@/components/ActorSwitcher";
import { roleCopy, threadUrl } from "@/lib/messages";

type Row = {
  id: string;
  placeId: string;
  partySize: number;
  checkIn: string | null;
  checkOut: string | null;
  state: string;
  messageCount: number;
  updatedAt: string;
  awaitingProvider: boolean;
};

export default function MessagesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [role] = useState(readActorCookieClient);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    Promise.all([
      fetch("/api/inquiries", { signal: ctrl.signal }).then((r) => r.json()),
      fetch("/api/places?limit=50", { signal: ctrl.signal }).then((r) => r.json()),
    ])
      .then(([inq, places]) => {
        setRows(inq.inquiries ?? []);
        const map: Record<string, string> = {};
        for (const p of places.places ?? []) map[p.id] = p.name;
        setNames(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => ctrl.abort();
  }, [role]);

  const shown = filter ? rows.filter((r) => r.state === filter) : rows;
  const copy = roleCopy(role);
  const isProvider =
    role === "authority-demo" || role === "authority" || role === "provider-demo" || role === "provider";

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-[#0B3D2E]">{copy.title}</h1>
      <p className="mt-1 text-sm text-[#5D746B]">
        {copy.lede} Acting as <code className="rounded bg-[#0B3D2E]/5 px-1">{role}</code> — other
        people&rsquo;s threads are not visible here; the API refuses them.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by state: open / answered / closed"
          className={`${inputClass} max-w-xs`}
          aria-label="Filter messages by state"
        />
        <span className="text-xs text-[#5D746B]/80">{shown.length} shown</span>
      </div>

      {loading && <p className="mt-6 text-sm text-[#5D746B]/80">Loading…</p>}

      {!loading && shown.length === 0 && (
        <Card className="mt-6">
          <p className="text-sm text-[#42584F]">
            {rows.length === 0
              ? "No messages yet. Send a question to a provider and it will appear here."
              : "No message matches that state filter."}
          </p>
          <Link href="/inquire" className="mt-2 inline-block text-sm font-medium underline">
            Ask a provider
          </Link>
        </Card>
      )}

      <div className="mt-6 space-y-2">
        {shown.map((r) => (
          <Link
            key={r.id}
            href={threadUrl(r.id)}
            className="block premium-card rounded-2xl border border-[#0B3D2E]/10 bg-white p-4 transition hover:border-[#0B3D2E]/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{names[r.placeId] ?? r.placeId}</span>
              <span className="flex items-center gap-2">
                <Badge tone={r.state === "answered" ? "ok" : r.state === "closed" ? "muted" : "warn"}>{r.state}</Badge>
                {r.awaitingProvider && <Badge tone="muted">waiting on host</Badge>}
                {isProvider && r.awaitingProvider && <Badge tone="gold">Needs your reply</Badge>}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#5D746B]">
              {r.partySize} guest(s) · {r.checkIn ?? "dates not stated"} → {r.checkOut ?? "—"} · {r.messageCount}{" "}
              message{r.messageCount === 1 ? "" : "s"} · updated {new Date(r.updatedAt).toLocaleString()}
            </p>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-xs leading-5 text-[#5D746B]">
        Cookie used for this demo scope: <code className="rounded bg-[#0B3D2E]/5 px-1">{ACTOR_COOKIE}</code>. In
        production this is a session, and unverified identity defaults to the least privilege.
      </p>
    </main>
  );
}
