"use client";

// Provider reply island for /messages/[id]. Extracted from the inbox reply
// form block. POSTs to /api/inquiries/${inquiryId}/messages, then reloads
// itself via window.location.reload() (server component has no client
// boundary for router.refresh(), so no onSent prop).

import { useState } from "react";
import { Field, inputClass, primaryButtonClass } from "@/components/ui";
import { KIND_LABEL } from "@/lib/messages";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomorrow(): string {
  return new Date(Date.now() + 86400000).toISOString().slice(0, 10);
}

export default function ReplyForm({ inquiryId }: { inquiryId: string }) {
  const [reply, setReply] = useState("");
  const [kind, setKind] = useState("reported_available");
  const [startDate, setStartDate] = useState(today);
  const [endDateExclusive, setEndDateExclusive] = useState(tomorrow);
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");

  async function sendReply() {
    if (!reply.trim()) return;
    setError("");
    const res = await fetch(`/api/inquiries/${inquiryId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: reply,
        availability: {
          kind,
          startDate,
          endDateExclusive,
          quantity: quantity ? Number(quantity) : null,
          quotePaise: null,
        },
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Reply failed");
      return;
    }
    window.location.reload();
  }

  return (
    <div className="mt-4 border-t border-[#0B3D2E]/10 pt-3">
      {error && (
        <p className="mb-3 rounded-2xl border border-red-700/20 bg-red-50 p-4 text-sm text-red-800">{error}</p>
      )}
      <Field label="Reply for the stated dates">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={3}
          placeholder="We can hold nothing, but for 14–16 Nov we currently expect two rooms free…"
          className={inputClass}
        />
      </Field>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <Field label="Availability">
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputClass}>
            <option value="reported_available">{KIND_LABEL.reported_available}</option>
            <option value="reported_unavailable">{KIND_LABEL.reported_unavailable}</option>
            <option value="needs_details">{KIND_LABEL.needs_details}</option>
          </select>
        </Field>
        <Field label="Start">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="End (exclusive)">
          <input
            type="date"
            value={endDateExclusive}
            onChange={(e) => setEndDateExclusive(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <Field label="Quantity">
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="2"
            inputMode="numeric"
            className={inputClass}
          />
        </Field>
      </div>

      <p className="mt-2 text-xs leading-5 text-[#5D746B]">
        Expiry is set by the server per report type: an availability report decays in 7 days, an
        unavailable report in 21, and neither outlives the stay window you are describing.
      </p>

      <button onClick={sendReply} disabled={!reply.trim()} className={`mt-3 ${primaryButtonClass}`}>
        Send reply
      </button>
    </div>
  );
}
