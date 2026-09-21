"use client";

// Contribute — the entry point of the moderation loop. GAP FIXED: the place
// list was hardcoded and the queue listing was shown to everyone; the queue is
// now reviewer-only and the place list is fetched.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Card, Field, inputClass, primaryButtonClass } from "@/components/ui";
import { readActorCookieClient } from "@/components/ActorSwitcher";

type Place = { id: string; name: string; district: string };
type QueueItem = {
  id: string;
  placeId: string;
  caption: string;
  attribution: string;
  license: string;
  moderation: string;
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: string;
};

export default function UploadPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [placeId, setPlaceId] = useState("");
  const [caption, setCaption] = useState("");
  const [attribution, setAttribution] = useState("");
  const [license, setLicense] = useState("CC BY-SA 4.0");
  const [owned, setOwned] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [role, setRole] = useState("visitor-demo");

  useEffect(() => {
    setRole(readActorCookieClient());
  }, []);

  useEffect(() => {
    fetch("/api/places?limit=50")
      .then((r) => r.json())
      .then((d) => {
        const list: Place[] = d.places ?? [];
        setPlaces(list);
        setPlaceId((prev) => prev || (list[0]?.id ?? ""));
        const map: Record<string, string> = {};
        for (const p of list) map[p.id] = p.name;
        setNames(map);
      })
      .catch(() => {});
    fetch("/api/uploads")
      .then((r) => r.json())
      .then((d) => setQueue(d.uploads ?? []))
      .catch(() => {});
  }, [role]);

  async function submit() {
    setResult("");
    setError("");
    if (!file) {
      setError("Choose a JPEG/PNG/WebP file (max 5 MB).");
      return;
    }
    if (!owned) {
      setError("You must confirm you own the photo or have permission to share it.");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.set("placeId", placeId);
      form.set("caption", caption);
      form.set("attribution", attribution);
      form.set("license", license);
      form.set("ownershipAffirmed", owned ? "on" : "");
      form.set("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      setResult(
        `Quarantined for review (${data.upload.id.slice(0, 8)}…). It is not public and will not appear on the place page until a reviewer approves it.`
      );
      setCaption("");
      setFile(null);
      setOwned(false);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-[#0B3D2E]">Contribute a photo</h1>
      <p className="mt-1 text-sm text-[#5D746B]">
        Only upload photos you own or have permission to share. Everything is quarantined until a reviewer
        approves it, and approval is what makes it appear on the place page.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label="Place">
          <select value={placeId} onChange={(e) => setPlaceId(e.target.value)} className={inputClass}>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.district}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Licence">
          <select value={license} onChange={(e) => setLicense(e.target.value)} className={inputClass}>
            <option>CC BY-SA 4.0</option>
            <option>CC BY 4.0</option>
            <option>CC0</option>
            <option>All rights reserved — permission granted to this site</option>
          </select>
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Caption" hint="max 280 characters, describe what is actually visible">
          <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={280} className={inputClass} />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Attribution" hint="how you want to be credited">
          <input value={attribution} onChange={(e) => setAttribution(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Photo file" hint="JPEG / PNG / WebP, max 5 MB">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
        </Field>
      </div>

      <label className="mt-4 flex items-start gap-2 text-sm">
        <input type="checkbox" checked={owned} onChange={(e) => setOwned(e.target.checked)} className="mt-1" />
        <span>I own this photo or have permission to share it under the licence selected above.</span>
      </label>

      <button onClick={submit} disabled={busy} className={`mt-4 ${primaryButtonClass}`}>
        {busy ? "Uploading…" : "Submit for review"}
      </button>

      {error && <p className="mt-3 rounded-2xl border border-red-700/20 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {result && <p className="mt-3 rounded-2xl border border-[#0E5A42]/20 bg-[#EEF5F1] p-4 text-sm text-[#0B3D2E]">{result}</p>}

      <h2 className="mt-9 font-semibold">
        Your submissions <span className="text-[#5D746B]/80">({queue.length})</span>
      </h2>
      {queue.length === 0 ? (
        <Card className="mt-2">
          <p className="text-sm text-[#5D746B]">
            {role === "reviewer" ? "Nothing in the queue." : "You have not submitted anything yet."}
          </p>
        </Card>
      ) : (
        <ul className="mt-2 space-y-2">
          {queue.map((u) => (
            <li key={u.id} className="rounded-lg border border-[#0B3D2E]/10 bg-white p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {names[u.placeId] ?? u.placeId} — {u.caption}
                </span>
                <Badge tone={u.moderation === "approved" ? "ok" : u.moderation === "rejected" ? "bad" : "warn"}>
                  {u.moderation}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-[#5D746B]">
                {u.attribution} · {u.license} · submitted {new Date(u.createdAt).toLocaleDateString("en-IN")}
                {u.reviewNote && <> · reason: {u.reviewNote}</>}
              </p>
              {u.moderation === "approved" && (
                <p className="mt-1 text-xs text-[#0B3D2E]">
                  Live on the{" "}
                  <Link href={`/places/${u.placeId}`} className="underline">
                    place page
                  </Link>
                  .
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {role !== "reviewer" && queue.length > 0 && (
        <p className="mt-3 text-xs text-[#5D746B]">
          You are seeing only your own submissions. Switch to the Reviewer role to work the moderation queue.
        </p>
      )}
    </main>
  );
}
