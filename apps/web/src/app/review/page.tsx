"use client";

// Reviewer console. reviewer identity now comes from the resolved actor, and a
// rejection must carry a reason so the decision is auditable.

import { useCallback, useEffect, useState } from "react";
import { Badge, Card, Field, inputClass, primaryButtonClass } from "@/components/ui";
import { readActorCookieClient } from "@/components/ActorSwitcher";

type Item = {
  id: string;
  placeId: string;
  caption: string;
  attribution: string;
  license: string;
  moderation: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  digest: string;
  createdAt: string;
};

export default function ReviewPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [role, setRole] = useState("visitor-demo");

  useEffect(() => {
    setRole(readActorCookieClient());
  }, []);

  const refresh = useCallback(async () => {
    const [u, p] = await Promise.all([
      fetch("/api/uploads").then((r) => r.json()),
      fetch("/api/places?limit=50").then((r) => r.json()),
    ]);
    setItems(u.uploads ?? []);
    const map: Record<string, string> = {};
    for (const pl of p.places ?? []) map[pl.id] = pl.name;
    setNames(map);
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh, role]);

  async function decide(id: string, decision: "approved" | "rejected") {
    setNotice("");
    setError("");
    const note = reasons[id]?.trim() ?? "";
    if (decision === "rejected" && !note) {
      setError("Record a reason before rejecting — the decision has to be auditable.");
      return;
    }
    const res = await fetch(`/api/uploads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note: note || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Decision failed");
      return;
    }
    setNotice(`${id.slice(0, 8)}… ${decision}. Approved photos appear on the place page immediately.`);
    await refresh();
  }

  const pending = items.filter((i) => i.moderation === "pending");
  const decided = items.filter((i) => i.moderation !== "pending");

  if (role !== "reviewer") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-[#0B3D2E]">Reviewer console</h1>
        <Card className="mt-4 border-[#C19A4B]/40 bg-[#FBF6E9]">
          <p className="text-sm text-[#5a4a1e]">
            You are acting as <code className="rounded bg-[#0B3D2E]/5 px-1">{role}</code>. Moderation decisions are
            reviewer-only. Switch the acting role to <strong>Reviewer</strong> in the header.
          </p>
        </Card>
        <p className="mt-4 text-xs leading-5 text-[#5D746B]">
          The queue is not readable and decisions are refused server-side for other roles — earlier the reviewer
          name was taken from the request body, which meant anyone could approve their own upload.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-[#0B3D2E]">Reviewer console</h1>
      <p className="mt-1 text-sm text-[#5D746B]">
        Approve or reject quarantined contributions. Every decision records the reviewer, the timestamp and, for
        rejections, the reason.
      </p>

      {notice && <p className="mt-3 rounded-2xl border border-[#0E5A42]/20 bg-[#EEF5F1] p-4 text-sm text-[#0B3D2E]">{notice}</p>}
      {error && <p className="mt-3 rounded-2xl border border-red-700/20 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      <h2 className="mt-6 font-semibold">
        Pending <span className="text-[#5D746B]/80">({pending.length})</span>
      </h2>
      {pending.length === 0 && <Card className="mt-2"><p className="text-sm text-[#5D746B]">Queue clear.</p></Card>}

      {pending.map((u) => (
        <Card key={u.id} className="mt-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {names[u.placeId] ?? u.placeId} — {u.caption}
              </p>
              <p className="mt-0.5 text-xs text-[#5D746B]">
                {u.attribution} · {u.license} · submitted {new Date(u.createdAt).toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-[#5D746B]/80">
                digest {u.digest.slice(0, 16)}… · id {u.id.slice(0, 8)}…
              </p>
            </div>
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-[#0B3D2E]/10 bg-[#0B3D2E]/5">
              {/* Preview only renders for reviewers; the raw route refuses anyone else. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/uploads/${u.id}/raw`} alt="" className="h-full w-full object-cover" />
            </div>
          </div>

          <div className="mt-3">
            <Field label="Reason" hint="required to reject">
              <input
                value={reasons[u.id] ?? ""}
                onChange={(e) => setReasons((r) => ({ ...r, [u.id]: e.target.value }))}
                placeholder="e.g. attribution missing for a clearly watermarked photo"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => decide(u.id, "approved")}
              className="rounded-full bg-[#0B3D2E] px-4 py-1.5 text-xs font-medium text-white"
            >
              Approve
            </button>
            <button
              onClick={() => decide(u.id, "rejected")}
              className="rounded-full border border-red-600/40 px-4 py-1.5 text-xs font-medium text-red-800"
            >
              Reject
            </button>
          </div>
        </Card>
      ))}

      {decided.length > 0 && (
        <>
          <h2 className="mt-8 font-semibold">
            Decided <span className="text-[#5D746B]/80">({decided.length})</span>
          </h2>
          <ul className="mt-2 space-y-2">
            {decided.map((u) => (
              <li key={u.id} className="rounded-lg border border-[#0B3D2E]/10 bg-white p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {names[u.placeId] ?? u.placeId} — {u.caption}
                  </span>
                  <Badge tone={u.moderation === "approved" ? "ok" : "bad"}>{u.moderation}</Badge>
                </div>
                <p className="mt-1 text-xs text-[#5D746B]">
                  by {u.reviewedBy} · {u.reviewedAt ? new Date(u.reviewedAt).toLocaleString() : "—"}
                  {u.reviewNote && <> · reason: {u.reviewNote}</>}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      <button onClick={() => refresh()} className={`mt-6 ${primaryButtonClass}`}>
        Refresh queue
      </button>
    </main>
  );
}
