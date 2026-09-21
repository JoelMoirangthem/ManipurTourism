"use client";

// Inquiry composer. GAP FIXED: the place list was three hardcoded <option>s, so
// five catalogue places could never be contacted. It is now fetched, and the
// page honours ?placeId= from a place-detail or plan link.

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Disclaimer, Field, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { readActorCookieClient } from "@/components/ActorSwitcher";

type PhraseCard = { id: string; intent: string; sourceText: string };
type Place = { id: string; name: string; district: string; category: string };
type Translation = { text: string; provider: string; quality: string; warning: string };

// useSearchParams requires a Suspense boundary during prerender, so the form is
// split out and wrapped below.
function InquireForm() {
  const params = useSearchParams();
  const [places, setPlaces] = useState<Place[]>([]);
  const [placeId, setPlaceId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [party, setParty] = useState(2);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);
  const [sentId, setSentId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [cards, setCards] = useState<PhraseCard[]>([]);
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translationNote, setTranslationNote] = useState("");
  // Read once in an effect — reading cookies during render would desync on hydration.
  const [actorId, setActorId] = useState("visitor-demo");

  useEffect(() => {
    setActorId(readActorCookieClient());
  }, []);

  const selected = useMemo(() => places.find((p) => p.id === placeId) ?? null, [places, placeId]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/places?limit=50", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        const list: Place[] = d.places ?? [];
        setPlaces(list);
        const wanted = params.get("placeId");
        setPlaceId(wanted && list.some((p) => p.id === wanted) ? wanted : (list[0]?.id ?? ""));
      })
      .catch(() => {});
    fetch("/api/phrases")
      .then((r) => r.json())
      .then((d) => setCards(d.cards ?? []))
      .catch(() => {});
    return () => ctrl.abort();
  }, [params]);

  // Date sanity is checked here so the visitor sees the problem before sending.
  const dateProblem =
    checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)
      ? "Check-out must be after check-in."
      : null;

  const canPreview = message.trim().length > 0 && placeId && !dateProblem;

  async function translate() {
    if (!message.trim()) return;
    setTranslating(true);
    setTranslation(null);
    setTranslationNote("");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message, sourceLang: "en", targetLang: "mni-IN" }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Failure must be honest and non-destructive: the original stands.
        setTranslationNote(data.error ?? "Translation unavailable — your original text is unchanged.");
      } else {
        setTranslation(data);
      }
    } catch {
      setTranslationNote("Translation unavailable — your original text is unchanged.");
    } finally {
      setTranslating(false);
    }
  }

  async function send() {
    setError("");
    setSending(true);
    const key =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId,
          checkIn: checkIn || null,
          checkOut: checkOut || null,
          partySize: party,
          message,
          idempotencyKey: key,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Send failed");
        return;
      }
      setSentId(data.inquiry.id);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSending(false);
    }
  }

  if (sentId) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Card className="border-[#0E5A42]/25 bg-[#EEF5F1]">
          <h1 className="text-lg font-semibold text-[#0B3D2E]">Sent to the service — not read yet.</h1>
          <p className="mt-2 text-sm leading-6 text-[#0B3D2E]">
            A reply here is host-reported for the dates you gave and it expires. It is not a reservation, and no
            one has confirmed anything yet. If nothing arrives, the answer is still &ldquo;unknown&rdquo;.
          </p>
          <div className="mt-3 flex gap-3">
            <Link href={`/messages/${sentId}`} className={primaryButtonClass}>
              View the thread
            </Link>
            <button
              onClick={() => {
                setSentId(null);
                setPreview(false);
                setMessage("");
                setTranslation(null);
              }}
              className={secondaryButtonClass}
            >
              Send another
            </button>
          </div>
        </Card>
        <Disclaimer className="mt-5" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-[#0B3D2E]">Ask a provider</h1>
      <p className="mt-1 text-sm text-[#5D746B]">
        A structured question with a preview before send. Your original words are always preserved.
      </p>
      <p className="mt-1 text-xs text-[#5D746B]/80">
        Identity for this demo session: <code className="rounded bg-[#0B3D2E]/5 px-1">{actorId}</code> — self-asserted,
        not authentication.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label="Place or service">
          <select value={placeId} onChange={(e) => setPlaceId(e.target.value)} className={inputClass}>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.district}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Party size">
          <input
            type="number"
            min={1}
            max={50}
            value={party}
            onChange={(e) => setParty(Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Check-in" hint="optional">
          <input
            type="date"
            value={checkIn}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setCheckIn(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Check-out" hint="optional">
          <input
            type="date"
            value={checkOut}
            min={checkIn || new Date().toISOString().slice(0, 10)}
            onChange={(e) => setCheckOut(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      {dateProblem && <p className="mt-2 text-sm text-red-800">{dateProblem}</p>}

      {selected && (
        <p className="mt-3 rounded-lg bg-[#FDFBF7] p-3 text-xs text-[#5D746B]">
          You are asking about <strong className="font-medium">{selected.name}</strong> ({selected.category},{" "}
          {selected.district}). Capacity listings on file are not availability for your dates.
        </p>
      )}

      <div className="mt-4">
        <Field label="Your message" hint="the original is preserved">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Hello — we are 2 guests arriving 14 Nov for 2 nights. Is a room available for those dates, and what would the total be? Does that include breakfast?"
            className={inputClass}
          />
        </Field>
      </div>

      {cards.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-[#5D746B]">
            Reviewed phrase cards (English source — Meiteilon targets publish only after human review):
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {cards.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.sourceText}
                onClick={() => setMessage((m) => (m ? `${m}\n${c.sourceText}` : c.sourceText))}
                className="rounded-full border border-[#0B3D2E]/15 bg-white px-3 py-1 text-xs text-[#42584F] hover:border-[#0B3D2E]/35"
              >
                + {c.intent}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button onClick={translate} disabled={translating || !message.trim()} className={secondaryButtonClass}>
          {translating ? "Translating…" : "Preview in Meiteilon (machine)"}
        </button>
        <span className="text-xs text-[#5D746B]/80">Machine output — never sent automatically.</span>
      </div>

      {translationNote && <p className="mt-2 text-xs text-[#5a4a1e]">{translationNote}</p>}

      {translation && (
        <Card className="mt-3 border-[#C19A4B]/40 bg-[#FBF6E9]">
          <p className="text-xs font-medium text-[#5a4a1e]">
            Machine translation ({translation.provider}) — unreviewed
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-[#5a4a1e]">{translation.text}</p>
          <p className="mt-2 text-xs leading-5 text-[#5a4a1e]">{translation.warning}</p>
          <p className="mt-1 text-xs text-[#5a4a1e]">
            Your original text is what gets sent. This is a preview to show the other party.
          </p>
        </Card>
      )}

      {!preview ? (
        <button onClick={() => setPreview(true)} disabled={!canPreview} className={`mt-5 ${primaryButtonClass}`}>
          Preview inquiry
        </button>
      ) : (
        <Card className="mt-5 border-[#0B3D2E]/20">
          <h2 className="font-semibold">Check this before sending</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="w-24 text-[#5D746B]/80">To</dt>
              <dd className="font-medium">{selected?.name ?? placeId}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 text-[#5D746B]/80">Dates</dt>
              <dd>{checkIn || "not stated"} → {checkOut || "not stated"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 text-[#5D746B]/80">Party</dt>
              <dd>{party} guest(s)</dd>
            </div>
          </dl>
          <p className="mt-3 whitespace-pre-line border-t border-[#0B3D2E]/10 pt-3 text-sm leading-6 text-[#1A2E28]">
            {message}
          </p>
          {error && <p className="mt-3 text-sm text-red-800">{error}</p>}
          <p className="mt-3 text-xs leading-5 text-[#5D746B]">
            Sending does not reserve or hold anything. The provider must reply for those dates before you treat
            anything as available.
          </p>
          <div className="mt-3 flex gap-2">
            <button onClick={send} disabled={sending} className={primaryButtonClass}>
              {sending ? "Sending…" : "Confirm send"}
            </button>
            <button onClick={() => setPreview(false)} className={secondaryButtonClass}>
              Edit
            </button>
          </div>
        </Card>
      )}
    </main>
  );
}

export default function InquirePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <p className="text-sm text-[#5D746B]/80">Loading the inquiry form…</p>
        </main>
      }
    >
      <InquireForm />
    </Suspense>
  );
}
